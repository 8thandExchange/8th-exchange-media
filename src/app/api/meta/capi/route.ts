import { NextResponse } from "next/server";
import { agencyCapiAuth, isAllowedCapiEvent, sendCapiEvent } from "@/lib/meta";

export const dynamic = "force-dynamic";

const PRIVATE_PREFIXES = ["/invoicing", "/portal", "/pay"];

function isPrivateUrl(raw?: string): boolean {
  if (!raw) return false;
  try {
    const url = new URL(raw);
    return PRIVATE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
  } catch {
    return true;
  }
}

/**
 * Browser → Conversions API. Consent-gated on the client (CookieConsent).
 * Only the agency Pixel is used here — client sites host their own tags.
 */
export async function POST(request: Request) {
  const auth = agencyCapiAuth();
  if (!auth?.pixelId) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  let body: {
    eventName?: string;
    eventId?: string;
    eventSourceUrl?: string;
    fbp?: string;
    fbc?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const eventName = body.eventName ?? "";
  if (!isAllowedCapiEvent(eventName)) {
    return NextResponse.json({ error: "Unsupported event." }, { status: 400 });
  }

  if (isPrivateUrl(body.eventSourceUrl)) {
    return NextResponse.json({ ok: false, skipped: true });
  }

  const forwarded = request.headers.get("x-forwarded-for");
  const clientIpAddress = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip");
  const clientUserAgent = request.headers.get("user-agent");

  try {
    await sendCapiEvent(
      {
        eventName,
        eventId: body.eventId?.trim() || undefined,
        eventSourceUrl: body.eventSourceUrl?.trim() || undefined,
        user: {
          clientIpAddress,
          clientUserAgent,
          fbp: body.fbp?.trim() || null,
          fbc: body.fbc?.trim() || null,
        },
      },
      auth
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Meta CAPI PageView failed", error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
