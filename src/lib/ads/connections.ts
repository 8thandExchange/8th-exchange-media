import { getPortalDb } from "@/lib/portal/db";
import type { MetaAuth } from "@/lib/meta";

export const BRAND_ADS_TABLE = "brand_ads_connections";

export const BRAND_ADS_MIGRATION_SQL = `-- Run in the 8th-exchange-media Supabase project (SQL editor).
-- RLS on, no policies: the service-role client in lib/portal/db.ts is the only way in.

create table if not exists brand_ads_connections (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references portal_clients(id) on delete cascade,
  platform text not null default 'meta',
  pixel_id text,
  ad_account_id text,
  business_id text,
  page_id text,
  capi_token text,
  ads_token text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_ads_connections_platform_check check (platform in ('meta', 'google'))
);

create unique index if not exists brand_ads_connections_agency_platform
  on brand_ads_connections (platform)
  where client_id is null;

create unique index if not exists brand_ads_connections_client_platform
  on brand_ads_connections (client_id, platform)
  where client_id is not null;

alter table brand_ads_connections enable row level security;
`;

export interface MetaConnectionPublic {
  clientId: string | null;
  pixelId: string | null;
  adAccountId: string | null;
  businessId: string | null;
  pageId: string | null;
  hasCapiToken: boolean;
  hasAdsToken: boolean;
}

export type ConnectionsResult<T> =
  | { ok: true; data: T }
  | { ok: false; missingTable: boolean; error: string };

function isMissingTable(message: string): boolean {
  return (
    /brand_ads_connections/i.test(message) ||
    /could not find the table/i.test(message) ||
    message.includes("42P01") ||
    message.includes("PGRST205")
  );
}

function asPublic(row: {
  client_id: string | null;
  pixel_id: string | null;
  ad_account_id: string | null;
  business_id: string | null;
  page_id: string | null;
  capi_token: string | null;
  ads_token: string | null;
}): MetaConnectionPublic {
  return {
    clientId: row.client_id,
    pixelId: row.pixel_id,
    adAccountId: row.ad_account_id,
    businessId: row.business_id,
    pageId: row.page_id,
    hasCapiToken: Boolean(row.capi_token),
    hasAdsToken: Boolean(row.ads_token),
  };
}

export async function listMetaConnections(): Promise<ConnectionsResult<MetaConnectionPublic[]>> {
  try {
    const { data, error } = await getPortalDb()
      .from(BRAND_ADS_TABLE)
      .select("client_id, pixel_id, ad_account_id, business_id, page_id, capi_token, ads_token")
      .eq("platform", "meta");
    if (error) {
      return {
        ok: false,
        missingTable: isMissingTable(error.message),
        error: error.message,
      };
    }
    return { ok: true, data: (data ?? []).map(asPublic) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load Meta connections";
    return { ok: false, missingTable: isMissingTable(message), error: message };
  }
}

export async function getClientMetaConnection(
  clientId: string
): Promise<ConnectionsResult<MetaConnectionPublic | null>> {
  try {
    const { data, error } = await getPortalDb()
      .from(BRAND_ADS_TABLE)
      .select("client_id, pixel_id, ad_account_id, business_id, page_id, capi_token, ads_token")
      .eq("platform", "meta")
      .eq("client_id", clientId)
      .maybeSingle();
    if (error) {
      return {
        ok: false,
        missingTable: isMissingTable(error.message),
        error: error.message,
      };
    }
    return { ok: true, data: data ? asPublic(data) : null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load Meta connection";
    return { ok: false, missingTable: isMissingTable(message), error: message };
  }
}

/** Server-only. Tokens included. Used by CAPI / Graph calls for a client brand. */
export async function getClientMetaAuth(clientId: string): Promise<MetaAuth | null> {
  const { data, error } = await getPortalDb()
    .from(BRAND_ADS_TABLE)
    .select("pixel_id, ad_account_id, business_id, page_id, capi_token, ads_token")
    .eq("platform", "meta")
    .eq("client_id", clientId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.pixel_id && !data?.ad_account_id) return null;
  return {
    pixelId: data.pixel_id ?? "",
    capiToken: data.capi_token,
    adsToken: data.ads_token || data.capi_token,
    adAccountId: data.ad_account_id,
    businessId: data.business_id,
    pageId: data.page_id,
  };
}

export async function upsertClientMetaConnection(
  clientId: string,
  fields: {
    pixelId?: string | null;
    adAccountId?: string | null;
    businessId?: string | null;
    pageId?: string | null;
    capiToken?: string | null;
    adsToken?: string | null;
  }
): Promise<void> {
  const db = getPortalDb();
  const { data: existing, error: readError } = await db
    .from(BRAND_ADS_TABLE)
    .select("id, pixel_id, ad_account_id, business_id, page_id, capi_token, ads_token")
    .eq("platform", "meta")
    .eq("client_id", clientId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  const next = {
    client_id: clientId,
    platform: "meta",
    pixel_id: fields.pixelId !== undefined ? fields.pixelId : (existing?.pixel_id ?? null),
    ad_account_id: fields.adAccountId !== undefined ? fields.adAccountId : (existing?.ad_account_id ?? null),
    business_id: fields.businessId !== undefined ? fields.businessId : (existing?.business_id ?? null),
    page_id: fields.pageId !== undefined ? fields.pageId : (existing?.page_id ?? null),
    capi_token: fields.capiToken !== undefined ? fields.capiToken : (existing?.capi_token ?? null),
    ads_token: fields.adsToken !== undefined ? fields.adsToken : (existing?.ads_token ?? null),
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await db.from(BRAND_ADS_TABLE).update(next).eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await db.from(BRAND_ADS_TABLE).insert(next);
  if (error) throw new Error(error.message);
}

export async function deleteClientMetaConnection(clientId: string): Promise<void> {
  const { error } = await getPortalDb()
    .from(BRAND_ADS_TABLE)
    .delete()
    .eq("platform", "meta")
    .eq("client_id", clientId);
  if (error) throw new Error(error.message);
}
