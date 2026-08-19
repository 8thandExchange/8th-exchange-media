import { NextResponse } from "next/server";
import { requirePortalClient } from "@/lib/portal/auth";
import { getClientById } from "@/lib/portal/service";
import { decidePipelinePost, getPipelinePost } from "@/lib/portal/social";

/** Client decision on a post awaiting their approval. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let clientId: string;
  try {
    clientId = await requirePortalClient();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const post = await getPipelinePost(id);
    // Only the owning client may decide, and only while it's pending.
    if (!post || post.client_id !== clientId) {
      return NextResponse.json({ error: "Unknown post" }, { status: 404 });
    }
    if (post.status !== "pending_approval") {
      return NextResponse.json(
        { error: "This post is no longer awaiting approval" },
        { status: 409 }
      );
    }

    const body = (await request.json()) as { decision?: string; note?: string };
    if (body.decision !== "approved" && body.decision !== "rejected") {
      return NextResponse.json({ error: "Decision must be approve or reject" }, { status: 400 });
    }
    if (body.decision === "rejected" && !body.note?.trim()) {
      return NextResponse.json(
        { error: "Tell us what to change so we can fix it" },
        { status: 400 }
      );
    }

    const client = await getClientById(clientId);
    const updated = await decidePipelinePost(
      id,
      body.decision,
      client?.contact_name ?? "client",
      body.note?.trim() || undefined
    );
    return NextResponse.json({ ok: true, post: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to record the decision";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
