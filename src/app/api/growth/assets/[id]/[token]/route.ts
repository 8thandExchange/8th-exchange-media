import { ImageResponse } from "next/og";
import { isInvoicingAuthenticated } from "@/lib/invoicing/auth";
import { ASSET_DIMENSIONS, renderGrowthAsset } from "@/lib/growth/graphics";
import { getAssetForRender } from "@/lib/growth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; token: string }> }
) {
  try {
    const { id, token } = await params;
    const asset = await getAssetForRender(id, token);
    if (!asset) return new Response("Graphic not found", { status: 404 });

    if (asset.status !== "approved") {
      const preview = new URL(request.url).searchParams.get("preview") === "1";
      if (!preview || !(await isInvoicingAuthenticated())) {
        return new Response("Graphic is awaiting approval", { status: 403 });
      }
    }

    const dimensions = ASSET_DIMENSIONS[asset.format];
    return new ImageResponse(renderGrowthAsset(asset), {
      ...dimensions,
      headers: {
        "Cache-Control":
          asset.status === "approved"
            ? "public, max-age=3600, s-maxage=86400, immutable"
            : "private, no-store",
        "Content-Disposition": `inline; filename="${asset.template_key}-${asset.format}.png"`,
      },
    });
  } catch (error) {
    console.error("Growth asset rendering failed", error);
    return new Response("Graphic rendering failed", { status: 500 });
  }
}
