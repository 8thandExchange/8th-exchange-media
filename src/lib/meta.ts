/**
 * Meta (Facebook) Marketing API + Conversions API.
 *
 * Same scoping rule as GHL: every call belongs to one brand. The agency
 * account comes from env; client accounts come from portal_clients
 * (see resolveMetaAuth). Meta owns Ads Manager, billing, and review —
 * this module is a thin remote control: verify the connection, install a
 * Pixel, list campaigns, open a paused campaign, and send CAPI events.
 *
 * Tokens are server-only and must never reach the browser.
 */

import crypto from "crypto";
import {
  CAPI_EVENT_NAMES,
  META_CAMPAIGN_OBJECTIVES,
  type CapiEventName,
  type MetaCampaignObjective,
} from "@/lib/meta-constants";

export {
  CAPI_EVENT_NAMES,
  META_CAMPAIGN_OBJECTIVES,
  type CapiEventName,
  type MetaCampaignObjective,
} from "@/lib/meta-constants";

const GRAPH_VERSION = "v22.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface MetaAuth {
  accessToken: string;
  adAccountId: string;
  pixelId?: string | null;
  businessId?: string | null;
}

export interface MetaAdAccount {
  id: string;
  name?: string;
  account_status?: number;
  currency?: string;
  timezone_name?: string;
  disable_reason?: number;
}

export interface MetaPixel {
  id: string;
  name?: string;
  is_unavailable?: boolean;
}

export interface MetaCampaign {
  id: string;
  name?: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  updated_time?: string;
}

/** Agency Meta account from env. Null when the token or ad account is missing. */
export function agencyMetaAuth(): MetaAuth | null {
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();
  const adAccountId = process.env.META_AD_ACCOUNT_ID?.trim();
  if (!accessToken || !adAccountId) return null;
  return {
    accessToken,
    adAccountId: normalizeAdAccountId(adAccountId),
    pixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null,
    businessId: process.env.META_BUSINESS_ID?.trim() || null,
  };
}

/**
 * CAPI only needs a Pixel id + token. Ad account is not required, so
 * events can flow as soon as NEXT_PUBLIC_META_PIXEL_ID is set.
 */
export function agencyCapiAuth(): MetaAuth | null {
  const accessToken =
    process.env.META_CAPI_ACCESS_TOKEN?.trim() || process.env.META_ACCESS_TOKEN?.trim();
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (!accessToken || !pixelId) return null;
  return {
    accessToken,
    adAccountId: process.env.META_AD_ACCOUNT_ID?.trim() || "",
    pixelId,
    businessId: process.env.META_BUSINESS_ID?.trim() || null,
  };
}

export function agencyPixelId(): string | null {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null;
}

export function normalizeAdAccountId(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

function graphHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

function describeMetaFailure(status: number, body: string, where: string): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string; error_user_msg?: string; error_user_title?: string };
    };
    const user = parsed.error?.error_user_msg;
    const title = parsed.error?.error_user_title;
    const message = parsed.error?.message;
    const detail = [title, user || message].filter(Boolean).join(" — ");
    if (detail) return `Meta ${where} failed (${status}): ${detail}`;
  } catch {
    // fall through
  }
  return `Meta ${where} failed (${status}). Check the access token and ad account id — agency values live in Vercel → 8th-exchange-media → Settings → Environment Variables; client values live on the client page.`;
}

async function graphGet<T>(path: string, token: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", token);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  const response = await fetch(url, { headers: graphHeaders(), cache: "no-store" });
  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(describeMetaFailure(response.status, text, path));
  }
  return (text ? JSON.parse(text) : {}) as T;
}

async function graphPost<T>(
  path: string,
  token: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = new URL(`${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", token);
  const response = await fetch(url, {
    method: "POST",
    headers: graphHeaders(),
    body: JSON.stringify(body),
  });
  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(describeMetaFailure(response.status, text, path));
  }
  return (text ? JSON.parse(text) : {}) as T;
}

export async function getAdAccount(auth: MetaAuth): Promise<MetaAdAccount> {
  return graphGet<MetaAdAccount>(`/${normalizeAdAccountId(auth.adAccountId)}`, auth.accessToken, {
    fields: "id,name,account_status,currency,timezone_name,disable_reason",
  });
}

export async function listPixels(auth: MetaAuth): Promise<MetaPixel[]> {
  const data = await graphGet<{ data?: MetaPixel[] }>(
    `/${normalizeAdAccountId(auth.adAccountId)}/adspixels`,
    auth.accessToken,
    { fields: "id,name,is_unavailable", limit: "50" }
  );
  return data.data ?? [];
}

export async function createPixel(auth: MetaAuth, name: string): Promise<MetaPixel> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("A Pixel name is required — e.g. “8E Media — 8emedia.com”.");
  }
  return graphPost<MetaPixel>(
    `/${normalizeAdAccountId(auth.adAccountId)}/adspixels`,
    auth.accessToken,
    { name: trimmed.slice(0, 100) }
  );
}

export async function listCampaigns(auth: MetaAuth): Promise<MetaCampaign[]> {
  const data = await graphGet<{ data?: MetaCampaign[] }>(
    `/${normalizeAdAccountId(auth.adAccountId)}/campaigns`,
    auth.accessToken,
    {
      fields: "id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time,updated_time",
      limit: "25",
    }
  );
  return data.data ?? [];
}

export async function createPausedCampaign(
  auth: MetaAuth,
  input: { name: string; objective: MetaCampaignObjective }
): Promise<{ id: string }> {
  const name = input.name.trim();
  if (!name) throw new Error("Campaign name is required");
  const allowed = META_CAMPAIGN_OBJECTIVES.some((item) => item.value === input.objective);
  if (!allowed) {
    throw new Error("Pick a Meta campaign objective from the list on the Ads page.");
  }
  return graphPost<{ id: string }>(
    `/${normalizeAdAccountId(auth.adAccountId)}/campaigns`,
    auth.accessToken,
    {
      name: name.slice(0, 200),
      objective: input.objective,
      status: "PAUSED",
      special_ad_categories: [],
    }
  );
}

export interface MetaConnectionReport {
  account: MetaAdAccount;
  pixels: MetaPixel[];
  pixel: MetaPixel | null;
}

/** Prove a token + ad account work, and surface any pixels already on it. */
export async function verifyMetaConnection(auth: MetaAuth): Promise<MetaConnectionReport> {
  const [account, pixels] = await Promise.all([getAdAccount(auth), listPixels(auth)]);
  const configuredId = auth.pixelId?.trim() || null;
  const pixel = configuredId
    ? pixels.find((item) => item.id === configuredId) ?? { id: configuredId }
    : (pixels[0] ?? null);
  return { account, pixels, pixel };
}

export function hashForCapi(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function hashPhoneForCapi(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  const e164 = digits.length === 10 ? `1${digits}` : digits;
  return hashForCapi(e164);
}

export interface CapiUserData {
  email?: string;
  phone?: string;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
}

export interface CapiEventInput {
  eventName: CapiEventName;
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: "website" | "system_generated" | "other";
  user?: CapiUserData;
}

function capiAccessToken(auth: MetaAuth): string {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim() || auth.accessToken;
}

/**
 * Send one Conversions API event. Returns false when Pixel or token is
 * missing so callers can fire-and-forget without taking a page down.
 */
export async function sendCapiEvent(
  input: CapiEventInput,
  auth?: MetaAuth | null
): Promise<boolean> {
  const config = auth ?? agencyCapiAuth();
  const pixelId = config?.pixelId?.trim();
  if (!config || !pixelId) return false;

  const user = input.user ?? {};
  const userData: Record<string, string> = {};
  if (user.email) userData.em = hashForCapi(user.email);
  if (user.phone) {
    const ph = hashPhoneForCapi(user.phone);
    if (ph) userData.ph = ph;
  }
  if (user.clientIpAddress) userData.client_ip_address = user.clientIpAddress;
  if (user.clientUserAgent) userData.client_user_agent = user.clientUserAgent;
  if (user.fbp) userData.fbp = user.fbp;
  if (user.fbc) userData.fbc = user.fbc;

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    action_source: input.actionSource ?? "website",
    user_data: userData,
  };
  if (input.eventId) event.event_id = input.eventId;
  if (input.eventSourceUrl) event.event_source_url = input.eventSourceUrl;

  const body: Record<string, unknown> = { data: [event] };
  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  if (testCode) body.test_event_code = testCode;

  const url = new URL(`${GRAPH_BASE}/${pixelId}/events`);
  url.searchParams.set("access_token", capiAccessToken(config));

  const response = await fetch(url, {
    method: "POST",
    headers: graphHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(describeMetaFailure(response.status, text, "CAPI /events"));
  }
  return true;
}

export function isAllowedCapiEvent(name: string): name is CapiEventName {
  return (CAPI_EVENT_NAMES as readonly string[]).includes(name);
}

export function formatAccountStatus(status?: number): string {
  switch (status) {
    case 1:
      return "Active";
    case 2:
      return "Disabled";
    case 3:
      return "Unsettled";
    case 7:
      return "Pending risk review";
    case 8:
      return "Pending settlement";
    case 9:
      return "In grace period";
    case 100:
      return "Pending closure";
    case 101:
      return "Closed";
    case 201:
      return "Any active";
    case 202:
      return "Any closed";
    default:
      return status != null ? `Status ${status}` : "Unknown";
  }
}
