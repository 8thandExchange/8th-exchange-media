import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { getClientMetaAuth } from "@/lib/ads/connections";
import { agencyMetaAuth, sendMetaCapiEvent } from "@/lib/meta";
import { SITE_URL } from "@/lib/site";

/**
 * Staff-only CAPI test. Sends a Lead into Events Manager's Test Events
 * panel when a test code is provided; otherwise it is a real Lead with
 * a clearly labeled source so it can be ignored in reporting.
 */
export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      clientId?: string;
      testEventCode?: string;
    };

    const clientId = body.clientId?.trim() || null;
    let auth = agencyMetaAuth();
    if (clientId) {
      try {
        auth = await getClientMetaAuth(clientId);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Could not load the client Meta connection";
        return NextResponse.json(
          {
            error: /brand_ads_connections|schema cache|42P01|PGRST205/i.test(message)
              ? "The brand_ads_connections table is missing. Run the SQL shown on /invoicing/ads in the 8th-exchange-media Supabase project."
              : message,
          },
          { status: 400 }
        );
      }
    }

    if (!auth?.pixelId) {
      return NextResponse.json(
        {
          error: clientId
            ? "This client has no Pixel / Dataset ID saved. Open their client page and paste it on the Meta card."
            : "NEXT_PUBLIC_META_PIXEL_ID is not set. Create the Pixel in Events Manager, then add the Dataset ID in Vercel → 8th-exchange-media → Settings → Environment Variables (Production and Preview) and redeploy.",
        },
        { status: 400 }
      );
    }

    const eventId = crypto.randomUUID();
    const result = await sendMetaCapiEvent({
      eventName: "Lead",
      eventId,
      sourceUrl: `${SITE_URL}/invoicing/ads`,
      email: "ads-test@8emedia.com",
      request,
      customData: { content_name: "Staff CAPI test", content_category: "ads-setup" },
      testEventCode: body.testEventCode?.trim(),
      auth,
    });

    return NextResponse.json({
      ok: true,
      eventId,
      eventsReceived: result.eventsReceived,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Meta CAPI test failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
