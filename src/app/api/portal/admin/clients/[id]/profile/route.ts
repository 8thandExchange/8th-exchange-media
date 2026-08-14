import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { getClientById, updateClientProfile } from "@/lib/portal/service";

const MAX = 200;

function clean(v: unknown, max = MAX): string | null | undefined {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
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

  try {
    const body = (await request.json()) as Record<string, unknown>;

    let socials: Record<string, string> | undefined;
    if (body.socials && typeof body.socials === "object" && !Array.isArray(body.socials)) {
      socials = {};
      for (const [k, v] of Object.entries(body.socials as Record<string, unknown>).slice(0, 12)) {
        const val = clean(v);
        if (val) socials[k.slice(0, 40)] = val;
      }
    }

    await updateClientProfile(id, {
      phone: clean(body.phone, 30),
      website: clean(body.website),
      address: clean(body.address, 400),
      company: clean(body.company, 120) ?? undefined,
      contactName: clean(body.contactName, 120) ?? undefined,
      socials,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
