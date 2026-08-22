import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  getCreativeProjectBundle,
  transitionCreativeProject,
} from "@/lib/production/service";
import type { CreativeProjectStatus } from "@/lib/production/types";

const actionInput = z.object({
  action: z.enum([
    "start_production",
    "submit_review",
    "approve",
    "request_changes",
    "complete",
    "archive",
  ]),
  note: z.string().trim().max(1500).optional(),
});

const target: Record<z.infer<typeof actionInput>["action"], CreativeProjectStatus> = {
  start_production: "in_production",
  submit_review: "in_review",
  approve: "approved",
  request_changes: "changes_requested",
  complete: "completed",
  archive: "archived",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
    const { id } = await params;
    return NextResponse.json(await getCreativeProjectBundle(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load production project";
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 401 : 500 }
    );
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
  const parsed = actionInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown production action" }, { status: 400 });
  }
  try {
    const { id } = await params;
    const project = await transitionCreativeProject(
      id,
      target[parsed.data.action],
      parsed.data.note
    );
    return NextResponse.json({ ok: true, project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Production action failed";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
