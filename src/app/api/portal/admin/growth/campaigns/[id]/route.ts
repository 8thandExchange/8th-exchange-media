import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { getCampaignBundle, transitionCampaign } from "@/lib/growth/service";
import type { CampaignStatus } from "@/lib/growth/types";

const actionInput = z.object({
  action: z.enum(["review", "approve", "request_changes", "complete", "archive"]),
  note: z.string().trim().max(1000).optional(),
});

const target: Record<z.infer<typeof actionInput>["action"], CampaignStatus> = {
  review: "in_review",
  approve: "approved",
  request_changes: "changes_requested",
  complete: "completed",
  archive: "archived",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
    const { id } = await params;
    return NextResponse.json(await getCampaignBundle(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load campaign";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = actionInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown campaign action" }, { status: 400 });
  }
  try {
    const { id } = await params;
    const campaign = await transitionCampaign(id, target[parsed.data.action], parsed.data.note);
    return NextResponse.json({ ok: true, campaign });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign action failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
