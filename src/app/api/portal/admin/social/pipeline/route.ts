import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  createPipelinePost,
  listPipelinePosts,
  type SocialMediaItem,
  type SocialPostStatus,
} from "@/lib/portal/social";

export async function GET(request: Request) {
  try {
    await requireInvoicingAuth();
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const statuses = url.searchParams.get("statuses")?.split(",") as
      | SocialPostStatus[]
      | undefined;
    const posts = await listPipelinePosts(clientId || null, statuses);
    return NextResponse.json({ posts });
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
      summary?: string;
      variants?: Record<string, string>;
      media?: SocialMediaItem[];
      accountIds?: string[];
      status?: string;
      scheduleAt?: string;
      category?: string;
    };

    if (!body.summary?.trim()) {
      return NextResponse.json({ error: "Post text is required" }, { status: 400 });
    }

    let scheduleAt: string | undefined;
    if (body.scheduleAt) {
      const parsed = new Date(body.scheduleAt);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: "Invalid schedule time" }, { status: 400 });
      }
      scheduleAt = parsed.toISOString();
    }

    const status =
      body.status === "idea" || body.status === "pending_approval"
        ? body.status
        : "draft";

    const post = await createPipelinePost({
      clientId: body.clientId || null,
      summary: body.summary.trim(),
      variants: body.variants,
      media: (body.media ?? []).filter((m) => typeof m?.url === "string" && m.url.trim()),
      accountIds: (body.accountIds ?? []).filter(
        (id): id is string => typeof id === "string" && id.length > 0
      ),
      status,
      scheduleAt,
      category: body.category?.trim() || undefined,
    });

    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
