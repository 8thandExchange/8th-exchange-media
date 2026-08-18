/**
 * Meta Marketing API + Conversions API.
 *
 * Every call is scoped to one brand's credentials (a MetaAuth). The
 * agency comes from env or the agency row in brand_meta_connections;
 * clients come from their own row. Callers must resolve the brand first
 * via resolveMetaAuth — posting a client's ads to 8E's ad account (or
 * the reverse) is the sharpest edge in this file.
 *
 * A Meta outage must never break a public form: CAPI helpers catch and
 * log. Staff routes surface the Graph error verbatim so someone can act.
 */

import { createHash } from "crypto";

const GRAPH = "https://graph.facebook.com/v21.0";

export interface MetaAuth {
  accessToken: string;
  adAccountId: string;
  pixelId?: string | null;
  businessId?: string | null;
  pageId?: string | null;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: string;
  created_time?: string;
}

export interface MetaPixel {
  id: string;
  name?: string;
}

export interface CapiEventInput {
  eventName: "Lead" | "Contact" | "CompleteRegistration" | "SubmitApplication";
  eventId: string;
  eventSourceUrl?: string;
  email?: string;
  phone?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  customData?: Record<string, string | number | undefined>;
  testEventCode?: string;
}

export class MetaApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "MetaApiError";
  }
}

export function normalizeAdAccountId(id: string): string {
  const trimmed = id.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}

export function hashPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const e164 = digits.length === 10 ? `1${digits}` : digits;
  return sha256(e164);
}

function graphErrorMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const err = (body as { error?: Record<string, unknown> }).error;
  if (!err) return fallback;
  const user = typeof err.error_user_msg === "string" ? err.error_user_msg : "";
  const title = typeof err.error_user_title === "string" ? err.error_user_title : "";
  const message = typeof err.message === "string" ? err.message : "";
  const combined = [title, user || message].filter(Boolean).join(" — ");
  return combined || fallback;
}

async function graph<T>(
  auth: Pick<MetaAuth, "accessToken">,
  path: string,
  init?: { method?: string; search?: Record<string, string>; body?: Record<string, unknown> }
): Promise<T> {
  const method = init?.method ?? "GET";
  const url = new URL(`${GRAPH}/${path.replace(/^\//, "")}`);
  if (init?.search) {
    for (const [key, value] of Object.entries(init.search)) {
      if (value) url.searchParams.set(key, value);
    }
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${auth.accessToken}`,
  };
  let body: string | undefined;
  if (method !== "GET" && init?.body) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(init.body);
  }

  const response = await fetch(url.toString(), { method, headers, body });
  const json = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    throw new MetaApiError(
      graphErrorMessage(json, `Meta Graph error (${response.status})`),
      response.status
    );
  }
  return json as T;
}

/** Prove a token + ad account pair works before we store it. */
export async function verifyAdAccount(auth: MetaAuth): Promise<{ name: string; id: string }> {
  const account = await graph<{ name?: string; account_id?: string; id?: string }>(
    auth,
    normalizeAdAccountId(auth.adAccountId),
    { search: { fields: "name,account_id,account_status" } }
  );
  return {
    name: account.name ?? "Ad account",
    id: account.account_id ?? account.id ?? auth.adAccountId,
  };
}

export async function listPixels(auth: MetaAuth): Promise<MetaPixel[]> {
  const data = await graph<{ data?: MetaPixel[] }>(auth, `${normalizeAdAccountId(auth.adAccountId)}/adspixels`, {
    search: { fields: "id,name", limit: "25" },
  });
  return data.data ?? [];
}

export async function createPixel(auth: MetaAuth, name: string): Promise<MetaPixel> {
  const trimmed = name.trim().slice(0, 80) || "8E Media";
  return graph<MetaPixel>(auth, `${normalizeAdAccountId(auth.adAccountId)}/adspixels`, {
    method: "POST",
    body: { name: trimmed },
  });
}

export async function listCampaigns(auth: MetaAuth): Promise<MetaCampaign[]> {
  const data = await graph<{ data?: MetaCampaign[] }>(
    auth,
    `${normalizeAdAccountId(auth.adAccountId)}/campaigns`,
    {
      search: {
        fields: "id,name,status,effective_status,objective,daily_budget,created_time",
        limit: "25",
      },
    }
  );
  return data.data ?? [];
}

export interface CreateCampaignInput {
  name: string;
  destinationUrl: string;
  dailyBudgetUsd: number;
  primaryText: string;
  headline: string;
  objective: "OUTCOME_TRAFFIC" | "OUTCOME_LEADS";
  specialAdCategories?: string[];
}

/**
 * Campaign + ad set + link ad, always PAUSED. Staff turn spend on in
 * Ads Manager after they look at targeting and creative.
 */
export async function createPausedCampaign(
  auth: MetaAuth,
  input: CreateCampaignInput
): Promise<{ campaignId: string; adSetId: string; adId: string }> {
  if (!auth.pageId) {
    throw new MetaApiError(
      "Add the Facebook Page ID on the connection — Business settings → Accounts → Pages. Link ads need a Page.",
      400
    );
  }

  const url = new URL(input.destinationUrl.trim());
  const dailyBudgetCents = Math.round(input.dailyBudgetUsd * 100);
  if (!Number.isFinite(dailyBudgetCents) || dailyBudgetCents < 100) {
    throw new MetaApiError("Daily budget must be at least $1.00", 400);
  }

  const special = (input.specialAdCategories ?? []).filter(Boolean);
  const campaign = await graph<{ id: string }>(auth, `${normalizeAdAccountId(auth.adAccountId)}/campaigns`, {
    method: "POST",
    body: {
      name: input.name.trim(),
      objective: input.objective,
      status: "PAUSED",
      special_ad_categories: special,
    },
  });

  const adSetBody: Record<string, unknown> = {
    name: `${input.name.trim()} — ad set`,
    campaign_id: campaign.id,
    daily_budget: dailyBudgetCents,
    billing_event: "IMPRESSIONS",
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: { geo_locations: { countries: ["US"] } },
    status: "PAUSED",
  };

  if (input.objective === "OUTCOME_LEADS") {
    if (!auth.pixelId) {
      throw new MetaApiError(
        "Leads campaigns need a Pixel ID on the connection — create one on this page, or switch the objective to Website traffic.",
        400
      );
    }
    adSetBody.optimization_goal = "OFFSITE_CONVERSIONS";
    adSetBody.destination_type = "WEBSITE";
    adSetBody.promoted_object = {
      pixel_id: auth.pixelId,
      custom_event_type: "LEAD",
    };
  } else {
    adSetBody.optimization_goal = "LINK_CLICKS";
    adSetBody.destination_type = "WEBSITE";
  }

  const adSet = await graph<{ id: string }>(auth, `${normalizeAdAccountId(auth.adAccountId)}/adsets`, {
    method: "POST",
    body: adSetBody,
  });

  const creative = await graph<{ id: string }>(auth, `${normalizeAdAccountId(auth.adAccountId)}/adcreatives`, {
    method: "POST",
    body: {
      name: `${input.name.trim()} — creative`,
      object_story_spec: {
        page_id: auth.pageId,
        link_data: {
          link: url.toString(),
          message: input.primaryText.trim(),
          name: input.headline.trim(),
          call_to_action: { type: "LEARN_MORE", value: { link: url.toString() } },
        },
      },
    },
  });

  const ad = await graph<{ id: string }>(auth, `${normalizeAdAccountId(auth.adAccountId)}/ads`, {
    method: "POST",
    body: {
      name: `${input.name.trim()} — ad`,
      adset_id: adSet.id,
      creative: { creative_id: creative.id },
      status: "PAUSED",
    },
  });

  return { campaignId: campaign.id, adSetId: adSet.id, adId: ad.id };
}

export function clientHintsFromRequest(request: Request): {
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
} {
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || undefined;
  const userAgent = request.headers.get("user-agent") || undefined;
  const cookie = request.headers.get("cookie") ?? "";
  const fbp = cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];
  const fbc = cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
  return { clientIp, userAgent, fbp, fbc };
}

/**
 * Server-side conversion. Returns false when the brand has no pixel/token
 * or Meta rejects the payload — callers log and move on.
 */
export async function sendCapiEvent(auth: MetaAuth, input: CapiEventInput): Promise<boolean> {
  if (!auth.pixelId || !auth.accessToken) return false;

  const userData: Record<string, string> = {};
  if (input.email) userData.em = hashEmail(input.email);
  if (input.phone) userData.ph = hashPhone(input.phone);
  if (input.clientIp) userData.client_ip_address = input.clientIp;
  if (input.userAgent) userData.client_user_agent = input.userAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  const event: Record<string, unknown> = {
    event_name: input.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    action_source: "website",
    user_data: userData,
  };
  if (input.eventSourceUrl) event.event_source_url = input.eventSourceUrl;
  if (input.customData) {
    const custom: Record<string, string | number> = {};
    for (const [key, value] of Object.entries(input.customData)) {
      if (value !== undefined) custom[key] = value;
    }
    if (Object.keys(custom).length) event.custom_data = custom;
  }

  const body: Record<string, unknown> = { data: [event] };
  if (input.testEventCode?.trim()) body.test_event_code = input.testEventCode.trim();

  await graph(auth, `${auth.pixelId}/events`, { method: "POST", body });
  return true;
}

/** Agency credentials from env — used when no agency row exists yet. */
export function agencyMetaFromEnv(): MetaAuth | null {
  const accessToken = process.env.META_ACCESS_TOKEN?.trim();
  const adAccountId = process.env.META_AD_ACCOUNT_ID?.trim();
  if (!accessToken || !adAccountId) return null;
  return {
    accessToken,
    adAccountId,
    pixelId: process.env.META_PIXEL_ID?.trim() || process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null,
    businessId: process.env.META_BUSINESS_ID?.trim() || null,
    pageId: process.env.META_PAGE_ID?.trim() || null,
  };
}

export function agencyPublicPixelFromEnv(): string {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || process.env.META_PIXEL_ID?.trim() || "";
}

export function agencyDomainVerifyFromEnv(): string {
  return process.env.NEXT_PUBLIC_META_DOMAIN_VERIFY?.trim() || "";
}
