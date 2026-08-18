/**
 * Agency Meta connection — env only, same split as GHL.
 * Client pixels and ad accounts live in brand_meta_accounts (Supabase).
 * Never put a client's pixel on 8emedia.com.
 */

export const META_GRAPH_VERSION = "v21.0";
export const META_GRAPH_BASE = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

export interface AgencyMetaConfig {
  pixelId: string | null;
  capiToken: string | null;
  adAccountId: string | null;
  businessId: string | null;
  systemUserToken: string | null;
  domainVerify: string | null;
  testEventCode: string | null;
}

function trimEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getAgencyMetaConfig(): AgencyMetaConfig {
  return {
    pixelId: trimEnv("META_PIXEL_ID") ?? trimEnv("NEXT_PUBLIC_META_PIXEL_ID"),
    capiToken: trimEnv("META_CAPI_ACCESS_TOKEN"),
    adAccountId: trimEnv("META_AD_ACCOUNT_ID"),
    businessId: trimEnv("META_BUSINESS_ID"),
    systemUserToken: trimEnv("META_SYSTEM_USER_TOKEN"),
    domainVerify: trimEnv("NEXT_PUBLIC_META_DOMAIN_VERIFY"),
    testEventCode: trimEnv("META_CAPI_TEST_EVENT_CODE"),
  };
}

/** Normalize "123" or "act_123" to the Graph API act_ form. */
export function formatAdAccountId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed.replace(/^act_/i, "")}`;
}

export function adsManagerUrl(adAccountId: string | null): string {
  if (!adAccountId) return "https://adsmanager.facebook.com/adsmanager";
  const numeric = formatAdAccountId(adAccountId).replace(/^act_/, "");
  return `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${numeric}`;
}

export function eventsManagerUrl(pixelId: string | null): string {
  if (!pixelId) return "https://business.facebook.com/events_manager";
  return `https://business.facebook.com/events_manager2/list/pixel/${pixelId}`;
}

export function pixelIdLooksValid(pixelId: string): boolean {
  return /^\d{5,20}$/.test(pixelId.trim());
}
