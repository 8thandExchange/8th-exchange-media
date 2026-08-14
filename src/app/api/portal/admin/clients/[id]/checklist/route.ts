import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { ONBOARDING_CHECKLIST, type ChecklistState } from "@/lib/portal/checklist";
import { getClientById, updateClientChecklist } from "@/lib/portal/service";

const VALID_KEYS = new Set(
  ONBOARDING_CHECKLIST.flatMap((group) => group.items.map((item) => item.key))
);

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) return NextResponse.json({ error: "Unknown client" }, { status: 404 });

  try {
    const body = (await request.json()) as {
      entries?: Record<string, { done?: boolean; note?: string }>;
    };

    const entries: ChecklistState = {};
    for (const [key, value] of Object.entries(body.entries ?? {})) {
      if (!VALID_KEYS.has(key) || !value || typeof value !== "object") continue;
      entries[key] = {
        done: Boolean(value.done),
        note: typeof value.note === "string" ? value.note.trim().slice(0, 300) : undefined,
        at: new Date().toISOString(),
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
