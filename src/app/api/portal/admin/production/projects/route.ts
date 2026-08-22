import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  createCreativeProject,
  listCreativeProjects,
} from "@/lib/production/service";

const createInput = z.object({
  campaignId: z.string().uuid(),
  productionType: z.enum(["short_video", "long_video", "photo_campaign", "article", "mixed"]),
  targetDurationSeconds: z.number().int().min(10).max(3600),
  dueAt: z.union([z.string().datetime(), z.literal("")]).optional(),
});

export async function GET() {
  try {
    await requireInvoicingAuth();
    return NextResponse.json({ projects: await listCreativeProjects() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load production projects";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = createInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Production details are incomplete" },
      { status: 400 }
    );
  }
  try {
    const project = await createCreativeProject({
      ...parsed.data,
      dueAt: parsed.data.dueAt || undefined,
    });
    return NextResponse.json({ ok: true, project }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Creative package generation failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
