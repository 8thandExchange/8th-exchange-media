import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { normalizeAdAccountId, verifyMetaConnection } from "@/lib/meta";
import { getClientById, setClientMeta } from "@/lib/portal/service";

/**
 * Set or clear a client's Meta ad-account connection.
 * The token is write-only: it is stored server-side and never echoed back.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      adAccountId?: string;
      accessToken?: string;
      pixelId?: string;
      businessId?: string;
      action?: string;
    };

    if (body.action === "disconnect") {
      await setClientMeta(id, {
        adAccountId: null,
        accessToken: null,
        pixelId: null,
        businessId: null,
      });
      return NextResponse.json({ ok: true, connected: false });
    }

    const adAccountId = body.adAccountId?.trim();
    const accessToken = body.accessToken?.trim();
    if (!adAccountId || !accessToken) {
      return NextResponse.json(
        { error: "Both the ad account id and the system-user token are required" },
        { status: 400 }
      );
    }

    const pixelId = body.pixelId?.trim() || null;
    const businessId = body.businessId?.trim() || null;
    const auth = {
      accessToken,
      adAccountId: normalizeAdAccountId(adAccountId),
      pixelId,
      businessId,
    };

    try {
      await verifyMetaConnection(auth);
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Meta rejected those credentials";
      return NextResponse.json(
        {
          error: `${detail} — check the ad account id and that the token is a system-user token with ads_management / ads_read on that account.`,
        },
        { status: 400 }
      );
    }

    await setClientMeta(id, {
      adAccountId: auth.adAccountId,
      accessToken,
      pixelId,
      businessId,
    });
    return NextResponse.json({ ok: true, connected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update Meta connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
