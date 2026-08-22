import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { createArtifactRevision } from "@/lib/production/service";
import type { CreativeContent } from "@/lib/production/types";

const artifactInput = z.object({
  artifactType: z.enum([
    "production_brief",
    "hook_set",
    "script",
    "shot_list",
    "storyboard",
    "seo_brief",
    "caption_set",
    "thumbnail_brief",
    "repurposed_content",
  ]),
  content: z.record(z.string(), z.unknown()),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = artifactInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Artifact content is invalid" },
      { status: 400 }
    );
  }
  try {
    const { id } = await params;
    const revision = await createArtifactRevision({
      projectId: id,
      artifactType: parsed.data.artifactType,
      content: parsed.data.content as CreativeContent,
    });
    return NextResponse.json({ ok: true, revision });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create revision";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
