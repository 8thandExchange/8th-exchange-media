import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { getBrandKit, getClientById, upsertBrandKit, type BrandKit } from "@/lib/portal/service";

const MAX_SHORT = 300;
const MAX_LONG = 5000;
const MAX_LIST = 40;

function str(value: unknown, max = MAX_SHORT): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function strList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, MAX_LIST)
    .map((v) => v.trim().slice(0, MAX_SHORT));
  return list.length ? list : undefined;
}

function linkList(value: unknown): { label: string; url: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const label = str((v as Record<string, unknown>).label);
      const url = str((v as Record<string, unknown>).url, 1000);
      return label && url ? { label, url } : null;
    })
    .filter((v): v is { label: string; url: string } => v !== null)
    .slice(0, MAX_LIST);
  return list.length ? list : undefined;
}

function colorList(value: unknown): { name: string; hex: string; usage?: string }[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const list = value
    .map((v) => {
      if (!v || typeof v !== "object") return null;
      const name = str((v as Record<string, unknown>).name);
      const hexRaw = str((v as Record<string, unknown>).hex, 20);
      const usage = str((v as Record<string, unknown>).usage);
      if (!name || !hexRaw) return null;
      const hex = hexRaw.startsWith("#") ? hexRaw : `#${hexRaw}`;
      if (!/^#[0-9a-fA-F]{3,8}$/.test(hex)) return null;
      return { name, hex: hex.toUpperCase(), ...(usage ? { usage } : {}) };
    })
    .filter((v): v is { name: string; hex: string; usage?: string } => v !== null)
    .slice(0, MAX_LIST);
  return list.length ? list : undefined;
}

function socialsMap(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>).slice(0, 12)) {
    const v = str(val);
    if (v) out[key.slice(0, 40)] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function sanitizeKit(body: Record<string, unknown>): BrandKit {
  const kit: BrandKit = {
    tagline: str(body.tagline),
    mission: str(body.mission, MAX_LONG),
    audience: str(body.audience, MAX_LONG),
    voiceTone: str(body.voiceTone, MAX_LONG),
    voiceDos: strList(body.voiceDos),
    voiceDonts: strList(body.voiceDonts),
    colors: colorList(body.colors),
    headingFont: str(body.headingFont),
    bodyFont: str(body.bodyFont),
    typographyNotes: str(body.typographyNotes, MAX_LONG),
    logos: linkList(body.logos),
    assets: linkList(body.assets),
    socials: socialsMap(body.socials),
    keywords: strList(body.keywords),
    competitors: strList(body.competitors),
    notes: str(body.notes, MAX_LONG),
  };
  return Object.fromEntries(Object.entries(kit).filter(([, v]) => v !== undefined)) as BrandKit;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const client = await getClientById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    const kit = await getBrandKit(id);
    return NextResponse.json({ client: { id: client.id, company: client.company }, kit: kit ?? {} });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load brand kit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const client = await getClientById(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const kit = sanitizeKit(body);
    await upsertBrandKit(id, kit);
    return NextResponse.json({ ok: true, kit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save brand kit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
