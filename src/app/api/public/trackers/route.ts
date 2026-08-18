import { NextResponse } from "next/server";
import { getAgencyPublicTrackers } from "@/lib/portal/metaStore";

/**
 * Public, secret-free tracker ids for the consent banner.
 * Static marketing pages cannot read Supabase at request time; the
 * client fetches this after paint so a pixel created in Ads works
 * without a Vercel redeploy.
 */
export async function GET() {
  try {
    const { pixelId } = await getAgencyPublicTrackers();
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID?.trim() || "";
    return NextResponse.json(
      { pixelId: pixelId || "", ga4Id },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch {
    return NextResponse.json({
      pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "",
      ga4Id: process.env.NEXT_PUBLIC_GA4_ID?.trim() || "",
    });
  }
}
