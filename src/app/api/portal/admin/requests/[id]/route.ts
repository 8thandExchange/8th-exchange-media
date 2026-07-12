import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  addUpdate,
  getRequest,
  statusLabel,
  updateRequestStatus,
  REQUEST_STATUSES,
  type RequestStatus,
} from "@/lib/portal/service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

    const body = (await request.json()) as { status?: string };
    const status = REQUEST_STATUSES.find((s) => s.value === body.status)?.value as
      | RequestStatus
      | undefined;
    if (!status) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    if (status !== existing.status) {
      await updateRequestStatus(id, status);
      await addUpdate({
        requestId: id,
        author: "system",
        body: `Status changed to ${statusLabel(status)}.`,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
