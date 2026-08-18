import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createPixel, listPixels } from "@/lib/meta";
import { resolveMetaAuth } from "@/lib/portal/metaAuth";
import { setClientMetaPixel } from "@/lib/portal/service";

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
    const pixels = await listPixels(auth);
    return NextResponse.json({ pixels, configuredPixelId: auth.pixelId ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not list Meta Pixels";
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
    const body = (await request.json()) as { name?: string; clientId?: string };
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { error: "Name the Pixel — e.g. “8E Media — 8emedia.com”." },
        { status: 400 }
      );
    }

    const clientId = typeof body.clientId === "string" && body.clientId ? body.clientId : null;
    const { auth, label } = await resolveMetaAuth(clientId);
    const pixel = await createPixel(auth, name);

    if (clientId && pixel.id) {
      await setClientMetaPixel(clientId, pixel.id);
    }

    return NextResponse.json({
      ok: true,
      pixel,
      label,
      nextStep: clientId
        ? `Saved Pixel ${pixel.id} on ${label}. Install that id on the client’s site (and keep this dashboard as the source of truth).`
        : `Created Pixel ${pixel.id}. Add NEXT_PUBLIC_META_PIXEL_ID=${pixel.id} in Vercel → 8th-exchange-media → Settings → Environment Variables, then redeploy, or the browser tag on 8emedia.com will stay off.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create Pixel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
