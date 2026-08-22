import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { addMeasurement } from "@/lib/growth/service";

const measurementInput = z
  .object({
    metricId: z.string().uuid(),
    periodStart: z.string().date(),
    periodEnd: z.string().date(),
    value: z.number().finite(),
    source: z.enum(["manual", "ghl", "ga4", "stripe", "other"]).default("manual"),
    evidenceUrl: z.union([z.string().url(), z.literal("")]).optional(),
    notes: z.string().max(1000).optional(),
  })
  .refine((value) => value.periodEnd >= value.periodStart, {
    message: "The measurement end date must be on or after its start date",
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

  const parsed = measurementInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Measurement details are invalid" },
      { status: 400 }
    );
  }

  try {
    const { id } = await params;
    const measurement = await addMeasurement({
      campaignId: id,
      ...parsed.data,
    });
    return NextResponse.json({ ok: true, measurement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record measurement";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
