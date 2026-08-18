import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createPixel, listPixels, sendCapiEvent } from "@/lib/meta";
import { resolveMetaAuth } from "@/lib/portal/metaAuth";
import { upsertMetaConnection } from "@/lib/portal/metaStore";

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
    const pixels = await listPixels(auth);
    return NextResponse.json({ pixels, pixelId: auth.pixelId ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list pixels";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
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
      name?: string;
      pixelId?: string;
      testEventCode?: string;
    };
    const clientId = clientIdFrom(body.clientId);
    const { auth, label } = await resolveMetaAuth(clientId);

    if (body.action === "use" && body.pixelId?.trim()) {
      const connection = await upsertMetaConnection(clientId, { pixelId: body.pixelId.trim() });
      return NextResponse.json({ ok: true, pixel: { id: body.pixelId.trim() }, connection });
    }

    if (body.action === "test") {
      if (!auth.pixelId) {
        return NextResponse.json(
          { error: "No Pixel ID on this connection yet — create or select one first." },
          { status: 400 }
        );
      }
      await sendCapiEvent(auth, {
        eventName: "Lead",
        eventId: `test_${Date.now()}`,
        eventSourceUrl: "https://8emedia.com/invoicing/ads",
        customData: { content_name: `${label} test event` },
        testEventCode: body.testEventCode,
      });
      return NextResponse.json({
        ok: true,
        message: body.testEventCode
          ? "Test event sent. It should appear in Events Manager → Test events within a few seconds."
          : "Lead event sent via Conversions API. Check Events Manager → Overview (can take up to 20 minutes without a test code).",
      });
    }

    const pixel = await createPixel(auth, body.name?.trim() || label);
    await upsertMetaConnection(clientId, { pixelId: pixel.id });
    return NextResponse.json({ ok: true, pixel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update pixel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
