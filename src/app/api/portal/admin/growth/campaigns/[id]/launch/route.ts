import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { launchCampaign } from "@/lib/growth/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const result = await launchCampaign(id);
    return NextResponse.json({
      ok: true,
      ...result,
      message:
        result.created > 0
          ? `${result.created} drafts were added to the Content Pipeline. Nothing has been published.`
          : "This campaign's drafts already exist in the Content Pipeline.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create content drafts";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
