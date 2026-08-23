import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { syncCampaignGa4Measurements } from "@/lib/growth/ga4Sync";

const syncInput = z
  .object({
    periodStart: z.string().date(),
    periodEnd: z.string().date(),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "The sync end date must be on or after its start date",
  });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = syncInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Sync details are invalid" },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const result = await syncCampaignGa4Measurements(id, {
      startDate: parsed.data.periodStart,
      endDate: parsed.data.periodEnd,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not sync GA4 measurements";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
