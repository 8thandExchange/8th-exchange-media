import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  addMediaAsset,
  listHashtagGroups,
  listMediaAssets,
  upsertHashtagGroup,
  type MediaAssetRow,
} from "@/lib/portal/social";

/** The brand library: media assets + hashtag groups in one round trip. */
export async function GET(request: Request) {
  try {
    await requireInvoicingAuth();
    const clientId = new URL(request.url).searchParams.get("clientId") || null;
    const [media, hashtagGroups] = await Promise.all([
      listMediaAssets(clientId),
      listHashtagGroups(clientId),
    ]);
    return NextResponse.json({ media, hashtagGroups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
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
      clientId?: string;
      kind?: "media" | "hashtags";
      label?: string;
      url?: string;
      type?: MediaAssetRow["type"];
      tags?: string[];
      name?: string;
      hashtags?: string[];
    };
    const clientId = body.clientId || null;

    if (body.kind === "media") {
      if (!body.label?.trim() || !body.url?.trim()) {
        return NextResponse.json({ error: "Label and URL are required" }, { status: 400 });
      }
      try {
        new URL(body.url.trim());
      } catch {
        return NextResponse.json({ error: "The URL is not valid" }, { status: 400 });
      }
      const asset = await addMediaAsset({
        clientId,
        label: body.label.trim(),
        url: body.url.trim(),
        type: body.type,
        tags: body.tags,
      });
      return NextResponse.json({ ok: true, asset });
    }

    if (body.kind === "hashtags") {
      if (!body.name?.trim() || !body.hashtags?.length) {
        return NextResponse.json(
          { error: "A group name and at least one hashtag are required" },
          { status: 400 }
        );
      }
      await upsertHashtagGroup({
        clientId,
        name: body.name.trim(),
        hashtags: body.hashtags
          .map((h) => h.trim().replace(/^#/, ""))
          .filter(Boolean)
          .map((h) => `#${h}`),
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
