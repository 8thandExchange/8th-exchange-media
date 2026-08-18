import { getPortalDb } from "@/lib/portal/db";
import { agencyDomainVerifyFromEnv, agencyPublicPixelFromEnv } from "@/lib/meta";

export interface MetaConnectionPublic {
  clientId: string | null;
  pixelId: string | null;
  adAccountId: string | null;
  businessId: string | null;
  pageId: string | null;
  domainVerification: string | null;
  hasToken: boolean;
}

export interface MetaConnectionRow extends MetaConnectionPublic {
  accessToken: string | null;
}

const COLUMNS =
  "client_id, pixel_id, ad_account_id, business_id, page_id, access_token, domain_verification";

function isMissingTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    message.includes("brand_meta_connections")
  );
}

const TABLE_HINT =
  "Run supabase/migrations/20260818_brand_meta_connections.sql in the Supabase SQL editor (project 8th-exchange-media), then retry.";

function mapRow(row: {
  client_id: string | null;
  pixel_id: string | null;
  ad_account_id: string | null;
  business_id: string | null;
  page_id: string | null;
  access_token: string | null;
  domain_verification: string | null;
}): MetaConnectionRow {
  return {
    clientId: row.client_id,
    pixelId: row.pixel_id,
    adAccountId: row.ad_account_id,
    businessId: row.business_id,
    pageId: row.page_id,
    domainVerification: row.domain_verification,
    accessToken: row.access_token,
    hasToken: Boolean(row.access_token),
  };
}

function toPublic(row: MetaConnectionRow): MetaConnectionPublic {
  const { accessToken: _token, ...rest } = row;
  return rest;
}

export async function getMetaConnection(clientId: string | null): Promise<MetaConnectionRow | null> {
  try {
    let query = getPortalDb().from("brand_meta_connections").select(COLUMNS);
    query = clientId ? query.eq("client_id", clientId) : query.is("client_id", null);
    const { data, error } = await query.maybeSingle();
    if (isMissingTable(error)) return null;
    if (error) throw new Error(error.message);
    return data ? mapRow(data) : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("brand_meta_connections") || message.includes("SUPABASE")) {
      return null;
    }
    throw error;
  }
}

export async function getMetaConnectionPublic(
  clientId: string | null
): Promise<MetaConnectionPublic | null> {
  const row = await getMetaConnection(clientId);
  return row ? toPublic(row) : null;
}

export async function upsertMetaConnection(
  clientId: string | null,
  fields: {
    accessToken?: string | null;
    adAccountId?: string | null;
    pixelId?: string | null;
    businessId?: string | null;
    pageId?: string | null;
    domainVerification?: string | null;
  }
): Promise<MetaConnectionPublic> {
  const existing = await getMetaConnection(clientId);
  const payload: Record<string, unknown> = {
    client_id: clientId,
    updated_at: new Date().toISOString(),
  };
  if (fields.accessToken !== undefined) payload.access_token = fields.accessToken;
  if (fields.adAccountId !== undefined) payload.ad_account_id = fields.adAccountId;
  if (fields.pixelId !== undefined) payload.pixel_id = fields.pixelId;
  if (fields.businessId !== undefined) payload.business_id = fields.businessId;
  if (fields.pageId !== undefined) payload.page_id = fields.pageId;
  if (fields.domainVerification !== undefined) {
    payload.domain_verification = fields.domainVerification;
  }

  const db = getPortalDb();
  if (existing) {
    let query = db.from("brand_meta_connections").update(payload);
    query = clientId ? query.eq("client_id", clientId) : query.is("client_id", null);
    const { error } = await query;
    if (isMissingTable(error)) throw new Error(TABLE_HINT);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await db.from("brand_meta_connections").insert(payload);
    if (isMissingTable(error)) throw new Error(TABLE_HINT);
    if (error) throw new Error(error.message);
  }

  const saved = await getMetaConnection(clientId);
  if (!saved) throw new Error("Saved the Meta connection but could not read it back.");
  return toPublic(saved);
}

export async function deleteMetaConnection(clientId: string | null): Promise<void> {
  let query = getPortalDb().from("brand_meta_connections").delete();
  query = clientId ? query.eq("client_id", clientId) : query.is("client_id", null);
  const { error } = await query;
  if (isMissingTable(error)) throw new Error(TABLE_HINT);
  if (error) throw new Error(error.message);
}

export async function listConnectedMetaClientIds(): Promise<string[]> {
  try {
    const { data, error } = await getPortalDb()
      .from("brand_meta_connections")
      .select("client_id")
      .not("client_id", "is", null);
    if (isMissingTable(error) || error) return [];
    return (data ?? [])
      .map((row) => row.client_id as string | null)
      .filter((id): id is string => Boolean(id));
  } catch {
    return [];
  }
}

/**
 * Public-site trackers only — never the access token. Env fills gaps so
 * the marketing site still works if Supabase is unreachable.
 */
export async function getAgencyPublicTrackers(): Promise<{
  pixelId: string;
  domainVerification: string;
}> {
  const fromEnv = {
    pixelId: agencyPublicPixelFromEnv(),
    domainVerification: agencyDomainVerifyFromEnv(),
  };
  try {
    const row = await getMetaConnection(null);
    return {
      pixelId: row?.pixelId?.trim() || fromEnv.pixelId,
      domainVerification: row?.domainVerification?.trim() || fromEnv.domainVerification,
    };
  } catch {
    return fromEnv;
  }
}
