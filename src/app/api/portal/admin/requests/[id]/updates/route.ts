import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { addUpdate, getRequest } from "@/lib/portal/service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const existing = await getRequest(id);
    if (!existing) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const body = (await request.json()) as { body?: string };
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await addUpdate({ requestId: id, author: "staff", body: body.body.trim() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to post update";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
