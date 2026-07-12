import { NextResponse } from "next/server";
import { requirePortalClient } from "@/lib/portal/auth";
import { addUpdate, getRequest } from "@/lib/portal/service";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let clientId: string;
  try {
    clientId = await requirePortalClient();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const portalRequest = await getRequest(id);
    if (!portalRequest || portalRequest.client_id !== clientId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as { body?: string };
    if (!body.body?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await addUpdate({ requestId: id, author: "client", body: body.body.trim() });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to post message";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
