import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { verifyAdAccount } from "@/lib/meta";
import { resolveMetaAuth } from "@/lib/portal/metaAuth";
import {
  deleteMetaConnection,
  getMetaConnectionPublic,
  upsertMetaConnection,
} from "@/lib/portal/metaStore";
import { getClientById } from "@/lib/portal/service";

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

  const clientId = clientIdFrom(new URL(request.url).searchParams.get("clientId"));
  if (clientId) {
    const client = await getClientById(clientId);
    if (!client) return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  try {
    const stored = await getMetaConnectionPublic(clientId);
    let label = "8E Media";
    if (clientId) {
      const client = await getClientById(clientId);
      label = client?.company ?? "Client";
    }
    // Env can make the agency "connected" even without a row.
    let connected = Boolean(stored?.hasToken && stored.adAccountId);
    if (!clientId && !connected) {
      try {
        await resolveMetaAuth(null);
        connected = true;
      } catch {
        connected = false;
      }
    }
    return NextResponse.json({ connection: stored, connected, label });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load Meta connection";
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
      clientId?: string | null;
      action?: string;
      accessToken?: string;
      adAccountId?: string;
      pixelId?: string;
      businessId?: string;
      pageId?: string;
      domainVerification?: string;
    };

    const clientId = clientIdFrom(body.clientId);
    if (clientId) {
      const client = await getClientById(clientId);
      if (!client) return NextResponse.json({ error: "Unknown client" }, { status: 404 });
    }

    if (body.action === "disconnect") {
      await deleteMetaConnection(clientId);
      return NextResponse.json({ ok: true, connected: false });
    }

    const accessToken = body.accessToken?.trim();
    const adAccountId = body.adAccountId?.trim();
    if (!accessToken || !adAccountId) {
      return NextResponse.json(
        {
          error:
            "Both the System User token and the ad account id are required. Create them in Meta Business settings → Users → System users.",
        },
        { status: 400 }
      );
    }

    try {
      await verifyAdAccount({ accessToken, adAccountId });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Meta rejected those credentials — check the token scopes (ads_management, ads_read) and that the system user is assigned to this ad account.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const connection = await upsertMetaConnection(clientId, {
      accessToken,
      adAccountId,
      pixelId: body.pixelId?.trim() || null,
      businessId: body.businessId?.trim() || null,
      pageId: body.pageId?.trim() || null,
      domainVerification: body.domainVerification?.trim() || null,
    });

    return NextResponse.json({ ok: true, connected: true, connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save Meta connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
