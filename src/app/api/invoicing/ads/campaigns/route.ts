import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  createPausedCampaign,
  listCampaigns,
  META_CAMPAIGN_OBJECTIVES,
  type MetaCampaignObjective,
} from "@/lib/meta";
import { resolveMetaAuth } from "@/lib/portal/metaAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientId = new URL(request.url).searchParams.get("clientId");
    const { auth } = await resolveMetaAuth(clientId);
    const campaigns = await listCampaigns(auth);
    return NextResponse.json({ campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not list Meta campaigns";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      objective?: string;
      clientId?: string;
    };

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    const objective = body.objective as MetaCampaignObjective | undefined;
    const allowed = META_CAMPAIGN_OBJECTIVES.some((item) => item.value === objective);
    if (!objective || !allowed) {
      return NextResponse.json(
        { error: "Pick a campaign objective from the Ads page list." },
        { status: 400 }
      );
    }

    const { auth } = await resolveMetaAuth(
      typeof body.clientId === "string" && body.clientId ? body.clientId : null
    );
    const result = await createPausedCampaign(auth, { name, objective });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
