import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createPausedCampaign, listCampaigns, MetaApiError } from "@/lib/meta";
import { resolveMetaAuth } from "@/lib/portal/metaAuth";
import { SITE_URL } from "@/lib/site";

function clientIdFrom(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

export async function GET(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const clientId = clientIdFrom(new URL(request.url).searchParams.get("clientId"));
    const { auth } = await resolveMetaAuth(clientId);
    const campaigns = await listCampaigns(auth);
    return NextResponse.json({ campaigns });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list campaigns";
    const status = error instanceof MetaApiError ? error.status : message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status: status >= 400 ? status : 500 });
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
      clientId?: string | null;
      name?: string;
      destinationUrl?: string;
      dailyBudgetUsd?: number;
      primaryText?: string;
      headline?: string;
      objective?: string;
      specialAdCategories?: string[];
    };

    const clientId = clientIdFrom(body.clientId);
    const { auth } = await resolveMetaAuth(clientId);

    const name = body.name?.trim();
    const destinationUrl = body.destinationUrl?.trim() || `${SITE_URL}/growth-map`;
    const primaryText = body.primaryText?.trim();
    const headline = body.headline?.trim();
    const objective = body.objective === "OUTCOME_LEADS" ? "OUTCOME_LEADS" : "OUTCOME_TRAFFIC";
    const dailyBudgetUsd = Number(body.dailyBudgetUsd);

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }
    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json({ error: "Destination must be a full URL (https://…)" }, { status: 400 });
    }
    if (!primaryText || !headline) {
      return NextResponse.json({ error: "Primary text and headline are required" }, { status: 400 });
    }
    if (!Number.isFinite(dailyBudgetUsd) || dailyBudgetUsd < 1) {
      return NextResponse.json({ error: "Daily budget must be at least $1" }, { status: 400 });
    }

    const created = await createPausedCampaign(auth, {
      name,
      destinationUrl,
      dailyBudgetUsd,
      primaryText,
      headline,
      objective,
      specialAdCategories: Array.isArray(body.specialAdCategories)
        ? body.specialAdCategories.filter((v): v is string => typeof v === "string")
        : [],
    });

    return NextResponse.json({ ok: true, ...created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    const status = error instanceof MetaApiError && error.status >= 400 && error.status < 600 ? error.status : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
