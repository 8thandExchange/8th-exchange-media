import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  createPortalClient,
  getLead,
  updateLead,
  type LeadStatus,
} from "@/lib/portal/service";

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "converted", "archived"];

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: string };
    const status = LEAD_STATUSES.find((s) => s === body.status);
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    await updateLead(id, { status });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Convert a lead into a portal client; returns the one-time access code. */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const lead = await getLead(id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    if (lead.status === "converted" && lead.client_id) {
      return NextResponse.json({ error: "Lead is already converted" }, { status: 400 });
    }

    const brandNotes = [
      lead.website ? `Website: ${lead.website}` : null,
      lead.industry ? `Industry: ${lead.industry}` : null,
      Object.keys(lead.socials).length
        ? `Socials: ${Object.entries(lead.socials)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}`
        : null,
      lead.goals.length ? `Goals: ${lead.goals.join(", ")}` : null,
      lead.services.length ? `Services: ${lead.services.join(", ")}` : null,
      lead.budget ? `Budget: ${lead.budget}` : null,
      lead.brand_assets ? `Brand assets:\n${lead.brand_assets}` : null,
      lead.notes ? `Notes:\n${lead.notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const client = await createPortalClient({
      company: lead.company,
      contactName: lead.contact_name,
      email: lead.email,
      brandNotes: brandNotes || undefined,
    });

    await updateLead(id, { status: "converted", client_id: client.id });

    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to convert lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
