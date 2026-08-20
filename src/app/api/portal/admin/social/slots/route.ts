import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  addPostingSlot,
  deletePostingSlot,
  listPostingSlots,
} from "@/lib/portal/social";

export async function GET(request: Request) {
  try {
    await requireInvoicingAuth();
    const clientId = new URL(request.url).searchParams.get("clientId") || null;
    const slots = await listPostingSlots(clientId);
    return NextResponse.json({ slots });
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
      weekday?: number;
      slotTime?: string;
      category?: string;
    };
    if (
      typeof body.weekday !== "number" ||
      body.weekday < 0 ||
      body.weekday > 6 ||
      !/^\d{2}:\d{2}$/.test(body.slotTime ?? "")
    ) {
      return NextResponse.json(
        { error: "A weekday and a time like 09:00 are required" },
        { status: 400 }
      );
    }
    const slot = await addPostingSlot({
      clientId: body.clientId || null,
      weekday: body.weekday,
      slotTime: `${body.slotTime}:00`,
      category: body.category?.trim() || undefined,
    });
    return NextResponse.json({ ok: true, slot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add the slot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing slot id" }, { status: 400 });
    await deletePostingSlot(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove the slot";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
