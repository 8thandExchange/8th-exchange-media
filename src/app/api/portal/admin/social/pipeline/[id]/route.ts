import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { resolveGhlAuth } from "@/lib/portal/ghlAuth";
import {
  cancelPipelinePost,
  decidePipelinePost,
  editPipelinePost,
  getPipelinePost,
  pushPipelinePostToGhl,
  submitForApproval,
  type SocialMediaItem,
} from "@/lib/portal/social";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      summary?: string;
      variants?: Record<string, string>;
      media?: SocialMediaItem[];
      accountIds?: string[];
      scheduleAt?: string | null;
      category?: string | null;
    };
    const post = await editPipelinePost(id, {
      summary: body.summary,
      variants: body.variants,
      media: body.media,
      accountIds: body.accountIds,
      scheduleAt:
        body.scheduleAt === undefined
          ? undefined
          : body.scheduleAt
            ? new Date(body.scheduleAt).toISOString()
            : null,
      category: body.category,
    });
    return NextResponse.json({ ok: true, post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as { action?: string; note?: string };
    const existing = await getPipelinePost(id);
    if (!existing) {
      return NextResponse.json({ error: "Unknown post" }, { status: 404 });
    }

    switch (body.action) {
      case "submit": {
        const post = await submitForApproval(id);
        return NextResponse.json({ ok: true, post });
      }
      // Staff approval — for the agency's own brands there is no client
      // to review, so staff can approve directly.
      case "approve": {
        const post = await decidePipelinePost(id, "approved", "staff", body.note);
        return NextResponse.json({ ok: true, post });
      }
      case "cancel": {
        const post = await cancelPipelinePost(id);
        return NextResponse.json({ ok: true, post });
      }
      case "push": {
        const { auth } = await resolveGhlAuth(existing.client_id);
        const post = await pushPipelinePostToGhl(id, auth);
        return NextResponse.json({ ok: true, post });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
