import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { addFile, addUpdate, getRequest } from "@/lib/portal/service";

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

    const body = (await request.json()) as { label?: string; url?: string };
    if (!body.label?.trim() || !body.url?.trim()) {
      return NextResponse.json({ error: "Label and URL are required" }, { status: 400 });
    }

    let url: string;
    try {
      url = new URL(body.url.trim()).toString();
    } catch {
      return NextResponse.json({ error: "URL must be a valid link" }, { status: 400 });
    }

    await addFile({ requestId: id, label: body.label.trim(), url });
    await addUpdate({
      requestId: id,
      author: "system",
      body: `Deliverable added: ${body.label.trim()}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
