import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createSocialPost, listSocialPosts } from "@/lib/ghl";
import { resolveGhlAuth } from "@/lib/portal/ghlAuth";

export async function GET(request: Request) {
  try {
    await requireInvoicingAuth();
    const clientId = new URL(request.url).searchParams.get("clientId");
    const { auth } = await resolveGhlAuth(clientId);
    const posts = await listSocialPosts(auth);
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
      summary?: string;
      accountIds?: string[];
      mediaUrls?: string[];
      scheduleDate?: string;
      status?: string;
      clientId?: string;
    };

    const { auth } = await resolveGhlAuth(
      typeof body.clientId === "string" && body.clientId ? body.clientId : null
    );

    if (!body.summary?.trim()) {
      return NextResponse.json({ error: "Post text is required" }, { status: 400 });
    }
    const accountIds = (body.accountIds ?? []).filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );
    if (accountIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one social account" },
        { status: 400 }
      );
    }

    const mediaUrls = (body.mediaUrls ?? [])
      .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
      .map((u) => {
        try {
          return new URL(u.trim()).toString();
        } catch {
          return null;
        }
      })
      .filter((u): u is string => u !== null)
      .slice(0, 10);

    let scheduleDate: string | undefined;
    if (body.scheduleDate) {
      const parsed = new Date(body.scheduleDate);
      if (Number.isNaN(parsed.getTime()) || parsed.getTime() < Date.now()) {
        return NextResponse.json({ error: "Schedule time must be in the future" }, { status: 400 });
      }
      scheduleDate = parsed.toISOString();
    }

    const status =
      body.status === "draft" || body.status === "published" || body.status === "scheduled"
        ? body.status
        : undefined;

    const result = await createSocialPost({
      summary: body.summary.trim(),
      accountIds,
      mediaUrls,
      scheduleDate,
      status,
    }, auth);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
