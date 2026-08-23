import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { isValidClientType } from "@/lib/portal/checklist";
import {
  BAA_STATUSES,
  ENTITY_TYPES,
  getClientById,
  updateClientProfile,
  type BaaStatus,
  type EntityType,
} from "@/lib/portal/service";

const MAX = 200;
const VALID_ENTITY = new Set(ENTITY_TYPES.map((e) => e.value));
const VALID_BAA = new Set(BAA_STATUSES.map((e) => e.value));

function clean(v: unknown, max = MAX): string | null | undefined {
  if (v === null) return null;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) return NextResponse.json({ error: "Unknown client" }, { status: 404 });

  try {
    const body = (await request.json()) as Record<string, unknown>;

    let socials: Record<string, string> | undefined;
    if (body.socials && typeof body.socials === "object" && !Array.isArray(body.socials)) {
      socials = {};
      for (const [k, v] of Object.entries(body.socials as Record<string, unknown>).slice(0, 12)) {
        const val = clean(v);
        if (val) socials[k.slice(0, 40)] = val;
      }
    }

    let subprocessors: string[] | undefined;
    if (Array.isArray(body.subprocessors)) {
      subprocessors = body.subprocessors
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .slice(0, 40)
        .map((v) => v.trim().slice(0, 200));
    } else if (typeof body.subprocessors === "string") {
      subprocessors = body.subprocessors
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean)
        .slice(0, 40);
    }

    const clientType = isValidClientType(body.clientType) ? body.clientType : undefined;
    const entityTypeRaw = clean(body.entityType, 40);
    const entityType =
      entityTypeRaw && VALID_ENTITY.has(entityTypeRaw as EntityType)
        ? (entityTypeRaw as EntityType)
        : entityTypeRaw === null
          ? null
          : undefined;
    const baaRaw = clean(body.baaStatus, 40);
    const baaStatus =
      baaRaw && VALID_BAA.has(baaRaw as BaaStatus)
        ? (baaRaw as BaaStatus)
        : baaRaw === null
          ? null
          : undefined;

    let phiPermitted: boolean | null | undefined;
    if (body.phiPermitted === null) phiPermitted = null;
    else if (typeof body.phiPermitted === "boolean") phiPermitted = body.phiPermitted;
    else if (body.phiPermitted === "true") phiPermitted = true;
    else if (body.phiPermitted === "false") phiPermitted = false;

    await updateClientProfile(id, {
      phone: clean(body.phone, 30),
      website: clean(body.website),
      address: clean(body.address, 400),
      company: clean(body.company, 120) ?? undefined,
      contactName: clean(body.contactName, 120) ?? undefined,
      socials,
      clientType,
      legalName: clean(body.legalName, 200),
      ein: clean(body.ein, 20),
      entityType,
      registeredAgent: clean(body.registeredAgent, 200),
      baaStatus,
      subprocessors,
      phiPermitted,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
