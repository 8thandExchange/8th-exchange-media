import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createCampaign, listCampaigns } from "@/lib/growth/service";

const campaignInput = z.object({
  opportunityId: z.string().uuid(),
  name: z.string().trim().min(3).max(140),
  objective: z.string().trim().min(8).max(500),
  audience: z.string().trim().min(3).max(500),
  offer: z.string().trim().min(3).max(500),
  primaryCta: z.string().trim().min(2).max(100),
  destinationUrl: z.string().url().max(2048),
  channels: z.array(z.enum(["facebook", "instagram", "linkedin", "x", "google"])).min(1),
  socialAccountIds: z.array(z.string().min(1)).default([]),
  baselineValue: z.number().finite(),
  targetValue: z.number().finite(),
  metricLabel: z.string().trim().min(2).max(100),
  metricUnit: z.enum(["count", "currency", "percent", "ratio", "duration"]),
});

export async function GET() {
  try {
    await requireInvoicingAuth();
    return NextResponse.json({ campaigns: await listCampaigns() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load campaigns";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = campaignInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Campaign details are incomplete" },
      { status: 400 }
    );
  }
  if (parsed.data.targetValue === parsed.data.baselineValue) {
    return NextResponse.json(
      { error: "The target must be different from the baseline" },
      { status: 400 }
    );
  }

  try {
    const campaign = await createCampaign(parsed.data);
    return NextResponse.json({ ok: true, campaign }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Campaign generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
