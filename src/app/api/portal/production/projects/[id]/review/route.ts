import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePortalClient } from "@/lib/portal/auth";
import { getClientById } from "@/lib/portal/service";
import { decideCreativeProjectForClient } from "@/lib/production/service";

const reviewInput = z.object({
  decision: z.enum(["approved", "changes_requested"]),
  note: z.string().trim().max(1500).optional(),
});

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
  const parsed = reviewInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Choose approve or request changes" }, { status: 400 });
  }
  if (parsed.data.decision === "changes_requested" && !parsed.data.note?.trim()) {
    return NextResponse.json(
      { error: "Tell the studio what should change" },
      { status: 400 }
    );
  }
  try {
    const [{ id }, client] = await Promise.all([params, getClientById(clientId)]);
    const project = await decideCreativeProjectForClient({
      projectId: id,
      clientId,
      reviewerLabel: client?.contact_name ?? "Client",
      decision: parsed.data.decision,
      note: parsed.data.note,
    });
    return NextResponse.json({ ok: true, project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not record review";
    return NextResponse.json(
      { error: message },
      { status: message === "Unknown production project" ? 404 : 409 }
    );
  }
}
