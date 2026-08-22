import { NextResponse } from "next/server";
import { z } from "zod";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import {
  addCreativeRightsAsset,
  deleteCreativeRightsAsset,
  updateCreativeRightsAsset,
} from "@/lib/production/service";

const rightsInput = z.object({
  label: z.string().trim().min(2).max(160),
  assetType: z.enum([
    "b_roll",
    "logo",
    "product",
    "location",
    "talent_release",
    "music",
    "sfx",
    "graphic",
    "reference",
    "final_master",
  ]),
  sourceUrl: z.string().url().max(2048),
  ownerName: z.string().trim().min(2).max(160),
  rightsBasis: z.enum([
    "client_owned",
    "stock",
    "work_for_hire",
    "editorial",
    "licensed",
    "unknown",
  ]),
  status: z.enum(["pending", "cleared", "restricted", "expired", "revoked"]),
  allowedChannels: z.array(z.string().min(1)).default([]),
  allowedTerritories: z.array(z.string().min(1)).default([]),
  modificationAllowed: z.boolean().default(false),
  expiresAt: z.union([z.string().date(), z.literal("")]).optional(),
  evidenceUrl: z.union([z.string().url(), z.literal("")]).optional(),
  restrictions: z.string().trim().max(1000).optional(),
});

const rightsUpdateInput = z.object({
  assetId: z.string().uuid(),
  status: z.enum(["pending", "cleared", "restricted", "expired", "revoked"]),
  evidenceUrl: z.union([z.string().url(), z.literal("")]).optional(),
  restrictions: z.string().trim().max(1000).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = rightsInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Asset rights details are invalid" },
      { status: 400 }
    );
  }
  try {
    const { id } = await params;
    const asset = await addCreativeRightsAsset({
      projectId: id,
      ...parsed.data,
      expiresAt: parsed.data.expiresAt || undefined,
      evidenceUrl: parsed.data.evidenceUrl || undefined,
    });
    return NextResponse.json({ ok: true, asset }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not register production asset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = rightsUpdateInput.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Rights update is invalid" },
      { status: 400 }
    );
  }
  try {
    const { id } = await params;
    const asset = await updateCreativeRightsAsset({
      projectId: id,
      ...parsed.data,
      evidenceUrl: parsed.data.evidenceUrl || undefined,
    });
    return NextResponse.json({ ok: true, asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update asset rights";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = z
    .object({ assetId: z.string().uuid() })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Asset id is invalid" }, { status: 400 });
  }
  try {
    const { id } = await params;
    await deleteCreativeRightsAsset({ projectId: id, assetId: parsed.data.assetId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not remove asset";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
