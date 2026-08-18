import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { pixelIdLooksValid } from "@/lib/meta/config";
import {
  deleteBrandMetaAccount,
  MetaAccountsUnavailableError,
  upsertBrandMetaAccount,
} from "@/lib/portal/metaAccounts";
import { getClientById } from "@/lib/portal/service";

function asOptionalId(value: unknown, label: string, max = 80): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== "string") {
    throw new Error(`${label} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) {
    return NextResponse.json({ error: "Unknown client" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      pixelId?: string | null;
      datasetId?: string | null;
      adAccountId?: string | null;
      businessId?: string | null;
      capiToken?: string | null;
      systemUserToken?: string | null;
    };

    if (body.action === "disconnect") {
      await deleteBrandMetaAccount(id);
      return NextResponse.json({ ok: true, connected: false });
    }

    const pixelId = asOptionalId(body.pixelId, "Pixel ID");
    if (pixelId && !pixelIdLooksValid(pixelId)) {
      return NextResponse.json(
        {
          error:
            "That does not look like a Meta Pixel ID. Events Manager shows a numeric id (15–16 digits). Create the Pixel there first — this app cannot issue one.",
        },
        { status: 400 }
      );
    }

    const saved = await upsertBrandMetaAccount(id, {
      pixelId,
      datasetId: asOptionalId(body.datasetId, "Dataset ID"),
      adAccountId: asOptionalId(body.adAccountId, "Ad account ID"),
      businessId: asOptionalId(body.businessId, "Business ID"),
      capiToken: asOptionalId(body.capiToken, "CAPI token", 400),
      systemUserToken: asOptionalId(body.systemUserToken, "System user token", 400),
    });

    return NextResponse.json({ ok: true, account: saved });
  } catch (error) {
    const status = error instanceof MetaAccountsUnavailableError ? 503 : 500;
    const message = error instanceof Error ? error.message : "Failed to save Meta connection";
    return NextResponse.json({ error: message }, { status });
  }
}
