import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createPortalClient, listClients } from "@/lib/portal/service";

export async function GET() {
  try {
    await requireInvoicingAuth();
    const clients = await listClients();
    return NextResponse.json({ clients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      company?: string;
      contactName?: string;
      email?: string;
      brandNotes?: string;
    };

    if (!body.company?.trim() || !body.contactName?.trim() || !body.email?.trim()) {
      return NextResponse.json(
        { error: "Company, contact name, and email are required" },
        { status: 400 }
      );
    }

    const client = await createPortalClient({
      company: body.company.trim(),
      contactName: body.contactName.trim(),
      email: body.email,
      brandNotes: body.brandNotes?.trim() || undefined,
    });

    // No credential to hand over: clients sign in with an emailed one-time code.
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
