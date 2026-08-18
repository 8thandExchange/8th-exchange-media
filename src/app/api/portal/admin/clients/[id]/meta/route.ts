import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  deleteClientMetaConnection,
  getClientMetaAuth,
  upsertClientMetaConnection,
} from "@/lib/ads/connections";
import { probeMetaConnection } from "@/lib/meta";
import { getClientById } from "@/lib/portal/service";

function missingTableError(message: string): boolean {
  return /brand_ads_connections|schema cache|42P01|PGRST205/i.test(message);
}

function tableHint(message: string): string {
  if (missingTableError(message)) {
    return "The brand_ads_connections table is missing. Open /invoicing/ads and run the SQL in the 8th-exchange-media Supabase project (SQL editor), then try again.";
  }
  return message;
}

/**
 * Set or clear a client's Meta Pixel / ad-account connection.
 * Tokens are write-only and never echoed back.
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
      action?: string;
      pixelId?: string;
      adAccountId?: string;
      businessId?: string;
      pageId?: string;
      capiToken?: string;
      adsToken?: string;
    };

    if (body.action === "disconnect") {
      await deleteClientMetaConnection(id);
      return NextResponse.json({ ok: true, connected: false });
    }

    const pixelId = body.pixelId?.trim() || undefined;
    const adAccountId = body.adAccountId?.trim() || undefined;
    const businessId = body.businessId?.trim() || undefined;
    const pageId = body.pageId?.trim() || undefined;
    const capiToken = body.capiToken?.trim() || undefined;
    const adsToken = body.adsToken?.trim() || undefined;

    if (!pixelId && !adAccountId && !capiToken && !adsToken && !businessId && !pageId) {
      return NextResponse.json(
        { error: "Paste at least a Pixel / Dataset ID or an ad account ID." },
        { status: 400 }
      );
    }

    await upsertClientMetaConnection(id, {
      pixelId,
      adAccountId,
      businessId,
      pageId,
      capiToken,
      adsToken,
    });

    if (body.capiToken?.trim() || body.adsToken?.trim()) {
      try {
        const auth = await getClientMetaAuth(id);
        if (auth) await probeMetaConnection(auth);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Meta rejected those credentials";
        return NextResponse.json(
          {
            error: `Saved, but Meta did not accept the token yet: ${message}. Check the Pixel ID and that the token belongs to that Dataset / ad account.`,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ ok: true, connected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update Meta connection";
    return NextResponse.json({ error: tableHint(message) }, { status: 500 });
  }
}
