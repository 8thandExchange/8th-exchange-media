import { getPortalDb } from "@/lib/portal/db";

export interface BrandMetaAccount {
  client_id: string;
  pixel_id: string | null;
  dataset_id: string | null;
  ad_account_id: string | null;
  business_id: string | null;
  has_capi_token: boolean;
  has_system_user_token: boolean;
  updated_at: string | null;
}

export interface BrandMetaSecrets {
  capiToken: string | null;
  systemUserToken: string | null;
}

const PUBLIC_COLUMNS =
  "client_id, pixel_id, dataset_id, ad_account_id, business_id, updated_at, capi_token, system_user_token";

function isMissingTable(error: { message?: string } | null): boolean {
  const message = error?.message ?? "";
  return /brand_meta_accounts|schema cache|does not exist|Could not find the table/i.test(message);
}

function toPublic(row: {
  client_id: string;
  pixel_id: string | null;
  dataset_id: string | null;
  ad_account_id: string | null;
  business_id: string | null;
  updated_at: string | null;
  capi_token?: string | null;
  system_user_token?: string | null;
}): BrandMetaAccount {
  return {
    client_id: row.client_id,
    pixel_id: row.pixel_id,
    dataset_id: row.dataset_id,
    ad_account_id: row.ad_account_id,
    business_id: row.business_id,
    has_capi_token: Boolean(row.capi_token),
    has_system_user_token: Boolean(row.system_user_token),
    updated_at: row.updated_at,
  };
}

export class MetaAccountsUnavailableError extends Error {
  constructor() {
    super(
      "The brand_meta_accounts table is missing. Run supabase/migrations/20260818_brand_meta_accounts.sql in the 8th-exchange-media Supabase SQL editor, then try again."
    );
    this.name = "MetaAccountsUnavailableError";
  }
}

/**
 * List stored Meta connections. Returns [] when Supabase is down or
 * the migration has not been applied — the Ads desk still renders.
 */
export async function listBrandMetaAccounts(): Promise<BrandMetaAccount[]> {
  try {
    const { data, error } = await getPortalDb()
      .from("brand_meta_accounts")
      .select(PUBLIC_COLUMNS);
    if (isMissingTable(error)) return [];
    if (error) {
      console.error("brand_meta_accounts list failed", error);
      return [];
    }
    return (data ?? []).map(toPublic);
  } catch (error) {
    console.error("brand_meta_accounts list failed", error);
    return [];
  }
}

export async function getBrandMetaAccount(clientId: string): Promise<BrandMetaAccount | null> {
  try {
    const { data, error } = await getPortalDb()
      .from("brand_meta_accounts")
      .select(PUBLIC_COLUMNS)
      .eq("client_id", clientId)
      .maybeSingle();
    if (isMissingTable(error)) return null;
    if (error) {
      console.error("brand_meta_accounts get failed", error);
      return null;
    }
    return data ? toPublic(data) : null;
  } catch (error) {
    console.error("brand_meta_accounts get failed", error);
    return null;
  }
}

export async function getBrandMetaSecrets(clientId: string): Promise<BrandMetaSecrets | null> {
  const { data, error } = await getPortalDb()
    .from("brand_meta_accounts")
    .select("capi_token, system_user_token")
    .eq("client_id", clientId)
    .maybeSingle();
  if (isMissingTable(error)) throw new MetaAccountsUnavailableError();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    capiToken: data.capi_token ?? null,
    systemUserToken: data.system_user_token ?? null,
  };
}

export async function upsertBrandMetaAccount(
  clientId: string,
  fields: {
    pixelId?: string | null;
    datasetId?: string | null;
    adAccountId?: string | null;
    businessId?: string | null;
    capiToken?: string | null;
    systemUserToken?: string | null;
  }
): Promise<BrandMetaAccount> {
  const existing = await getPortalDb()
    .from("brand_meta_accounts")
    .select(PUBLIC_COLUMNS)
    .eq("client_id", clientId)
    .maybeSingle();

  if (isMissingTable(existing.error)) throw new MetaAccountsUnavailableError();

  const update: Record<string, unknown> = {
    client_id: clientId,
    updated_at: new Date().toISOString(),
  };
  if (fields.pixelId !== undefined) update.pixel_id = fields.pixelId;
  if (fields.datasetId !== undefined) update.dataset_id = fields.datasetId;
  if (fields.adAccountId !== undefined) update.ad_account_id = fields.adAccountId;
  if (fields.businessId !== undefined) update.business_id = fields.businessId;
  if (fields.capiToken !== undefined) update.capi_token = fields.capiToken;
  if (fields.systemUserToken !== undefined) update.system_user_token = fields.systemUserToken;

  const { data, error } = await getPortalDb()
    .from("brand_meta_accounts")
    .upsert(update, { onConflict: "client_id" })
    .select(PUBLIC_COLUMNS)
    .single();

  if (isMissingTable(error)) throw new MetaAccountsUnavailableError();
  if (error) throw new Error(error.message);
  return toPublic(data!);
}

export async function deleteBrandMetaAccount(clientId: string): Promise<void> {
  const { error } = await getPortalDb().from("brand_meta_accounts").delete().eq("client_id", clientId);
  if (isMissingTable(error)) throw new MetaAccountsUnavailableError();
  if (error) throw new Error(error.message);
}
