import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { launchCreativeProject } from "@/lib/production/service";

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
    const result = await launchCreativeProject(id);
    return NextResponse.json({
      ok: true,
      ...result,
      message:
        result.created > 0
          ? `${result.created} approved derivatives were added as Content Pipeline drafts. Nothing was published.`
          : "This production package already has Content Pipeline drafts.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create distribution drafts";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
