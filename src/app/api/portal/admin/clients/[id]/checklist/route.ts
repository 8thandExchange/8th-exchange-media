import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { ONBOARDING_CHECKLIST, type ChecklistState } from "@/lib/portal/checklist";
import { getClientById, isComplianceAnswered, updateClientChecklist } from "@/lib/portal/service";

const VALID_KEYS = new Set(
  ONBOARDING_CHECKLIST.flatMap((group) => group.items.map((item) => item.key))
);

function clean(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) return NextResponse.json({ error: "Unknown client" }, { status: 404 });

  if (!isComplianceAnswered(client)) {
    return NextResponse.json(
      {
        error:
          "Answer the compliance block first (BAA status, whether PHI may enter the CRM, and the subprocessor list). The rest of the checklist stays locked until those three are set.",
      },
      { status: 409 }
    );
  }

  try {
    const body = (await request.json()) as {
      entries?: Record<
        string,
        {
          done?: boolean;
          value?: string;
          note?: string;
          evidenceUrl?: string;
          completedBy?: string;
        }
      >;
    };

    const entries: ChecklistState = {};
    for (const [key, value] of Object.entries(body.entries ?? {})) {
      if (!VALID_KEYS.has(key) || !value || typeof value !== "object") continue;
      const done = Boolean(value.done);
      entries[key] = {
        done,
        value: clean(value.value, 400),
        note: clean(value.note, 500),
        evidenceUrl: clean(value.evidenceUrl, 1000),
        completedBy: clean(value.completedBy, 80),
        completedAt: done ? new Date().toISOString() : undefined,
      };
    }
    if (Object.keys(entries).length === 0) {
      return NextResponse.json({ error: "No valid checklist entries" }, { status: 400 });
    }

    await updateClientChecklist(id, entries);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update checklist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
