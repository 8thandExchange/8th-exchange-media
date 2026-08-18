/**
 * Meta (Facebook / Instagram) ads plumbing.
 *
 * Two jobs, deliberately split:
 *   1. Measurement — Pixel (browser) + Conversions API (server). Required
 *      before any spend; this is the Dataset that ads optimize against.
 *   2. Marketing API — read campaigns from an ad account. Creating and
 *      spending from this app is a later slice; it needs a reviewed Meta
 *      app with ads_management, which 8E does not have yet.
 *
 * Agency credentials live in env (same pattern as GHL). Client credentials
 * live in brand_ads_connections and are resolved by lib/ads/connections.
 * Never load a client's Pixel on 8emedia.com — that mixes audiences.
 */

import { createHash } from "crypto";
import { SITE_URL } from "@/lib/site";

const GRAPH_VERSION = "v22.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export interface MetaAuth {
  pixelId: string;
  capiToken?: string | null;
  adsToken?: string | null;
  adAccountId?: string | null;
  businessId?: string | null;
  pageId?: string | null;
}

/** Agency (8emedia.com) credentials from env. Tokens never go to the browser. */
export function agencyMetaAuth(): MetaAuth | null {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
  if (!pixelId) return null;
  return {
    pixelId,
    capiToken: process.env.META_CAPI_ACCESS_TOKEN?.trim() || null,
    adsToken: process.env.META_ADS_ACCESS_TOKEN?.trim() || process.env.META_CAPI_ACCESS_TOKEN?.trim() || null,
    adAccountId: process.env.META_AD_ACCOUNT_ID?.trim() || null,
    businessId: process.env.META_BUSINESS_ID?.trim() || null,
    pageId: process.env.META_PAGE_ID?.trim() || null,
  };
}

export function agencyMetaPublicStatus(): {
  pixelId: string | null;
  hasCapiToken: boolean;
  hasAdsToken: boolean;
  adAccountId: string | null;
  businessId: string | null;
  domainVerification: string | null;
  testEventCode: string | null;
} {
  const auth = agencyMetaAuth();
  return {
    pixelId: auth?.pixelId ?? null,
    hasCapiToken: Boolean(auth?.capiToken),
    hasAdsToken: Boolean(auth?.adsToken),
    adAccountId: auth?.adAccountId ?? null,
    businessId: auth?.businessId ?? null,
    domainVerification: process.env.NEXT_PUBLIC_META_DOMAIN_VERIFICATION?.trim() || null,
    testEventCode: process.env.META_PIXEL_TEST_EVENT_CODE?.trim() || null,
  };
}

export function normalizeAdAccountId(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Meta wants digits only, with country code. Bare 10-digit US numbers get a 1. */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) {
      const value = rest.join("=").trim();
      return value || undefined;
    }
  }
  return undefined;
}

function clientIp(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || undefined;
  return request.headers.get("x-real-ip")?.trim() || undefined;
}

export interface CapiEventInput {
  eventName: "Lead" | "PageView" | "CompleteRegistration" | "Contact" | "Schedule";
  eventId: string;
  sourceUrl?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  request?: Request;
  customData?: Record<string, string | number | boolean>;
  testEventCode?: string;
  auth?: MetaAuth;
}

interface GraphErrorBody {
  error?: { message?: string; error_user_msg?: string; code?: number };
}

async function graphFetch<T>(
  path: string,
  token: string,
  init?: RequestInit
): Promise<T> {
  const url = path.startsWith("http") ? path : `${GRAPH_BASE}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as T & GraphErrorBody;
  if (!response.ok || body.error) {
    const message =
      body.error?.error_user_msg ||
      body.error?.message ||
      `Meta Graph API failed (${response.status})`;
    throw new Error(message);
  }
  return body;
}

/**
 * Send one Conversions API event. Failures are the caller's to swallow —
 * a Meta outage must never take down a form or a staff page.
 */
export async function sendMetaCapiEvent(input: CapiEventInput): Promise<{ eventsReceived: number }> {
  const auth = input.auth ?? agencyMetaAuth();
  if (!auth?.pixelId) {
    throw new Error(
      "No Meta Pixel / Dataset ID is set. Create the Pixel in Events Manager, then add NEXT_PUBLIC_META_PIXEL_ID in Vercel → 8th-exchange-media → Settings → Environment Variables."
    );
  }
  if (!auth.capiToken) {
    throw new Error(
      "META_CAPI_ACCESS_TOKEN is not set. In Events Manager open the Dataset → Settings → Generate access token, then add that token in Vercel as META_CAPI_ACCESS_TOKEN (server-only, not NEXT_PUBLIC)."
    );
  }

  const userData: Record<string, string | string[]> = {};
  if (input.email) userData.em = [sha256(normalizeEmail(input.email))];
  if (input.phone) {
    const phone = normalizePhone(input.phone);
    if (phone) userData.ph = [sha256(phone)];
  }
  if (input.firstName) userData.fn = [sha256(input.firstName.trim().toLowerCase())];
  if (input.lastName) userData.ln = [sha256(input.lastName.trim().toLowerCase())];

  if (input.request) {
    const ip = clientIp(input.request);
    const ua = input.request.headers.get("user-agent");
    const cookie = input.request.headers.get("cookie");
    if (ip) userData.client_ip_address = ip;
    if (ua) userData.client_user_agent = ua;
    const fbp = readCookie(cookie, "_fbp");
    const fbc = readCookie(cookie, "_fbc");
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.sourceUrl ?? SITE_URL,
        user_data: userData,
        ...(input.customData ? { custom_data: input.customData } : {}),
      },
    ],
    access_token: auth.capiToken,
  };

  const testCode = input.testEventCode?.trim() || process.env.META_PIXEL_TEST_EVENT_CODE?.trim();
  if (testCode) payload.test_event_code = testCode;

  const result = await graphFetch<{ events_received?: number }>(
    `/${auth.pixelId}/events`,
    auth.capiToken,
    { method: "POST", body: JSON.stringify(payload) }
  );

  return { eventsReceived: result.events_received ?? 0 };
}

export interface MetaProbe {
  pixel: { ok: boolean; name?: string; error?: string };
  adAccount: { ok: boolean; name?: string; status?: number; currency?: string; error?: string };
}

/** Cheap reads that prove a Pixel / ad-account token pair actually works. */
export async function probeMetaConnection(auth: MetaAuth): Promise<MetaProbe> {
  const probe: MetaProbe = {
    pixel: { ok: false },
    adAccount: { ok: false },
  };

  const readToken = auth.capiToken || auth.adsToken;
  if (auth.pixelId && readToken) {
    try {
      const pixel = await graphFetch<{ name?: string }>(
        `/${auth.pixelId}?fields=name,id`,
        readToken
      );
      probe.pixel = { ok: true, name: pixel.name };
    } catch (error) {
      probe.pixel = {
        ok: false,
        error: error instanceof Error ? error.message : "Pixel lookup failed",
      };
    }
  } else if (auth.pixelId) {
    probe.pixel = {
      ok: false,
      error:
        "Pixel ID is set but no access token is. Add META_CAPI_ACCESS_TOKEN (Events Manager → Dataset → Settings → Generate access token).",
    };
  } else {
    probe.pixel = {
      ok: false,
      error: "No Pixel / Dataset ID yet. Create it in Events Manager first.",
    };
  }

  const adsToken = auth.adsToken || auth.capiToken;
  if (auth.adAccountId && adsToken) {
    try {
      const account = await graphFetch<{
        name?: string;
        account_status?: number;
        currency?: string;
      }>(
        `/${normalizeAdAccountId(auth.adAccountId)}?fields=name,account_status,currency`,
        adsToken
      );
      probe.adAccount = {
        ok: true,
        name: account.name,
        status: account.account_status,
        currency: account.currency,
      };
    } catch (error) {
      probe.adAccount = {
        ok: false,
        error: error instanceof Error ? error.message : "Ad account lookup failed",
      };
    }
  } else if (auth.adAccountId) {
    probe.adAccount = {
      ok: false,
      error:
        "Ad account ID is set but no token can read it. A CAPI token from Events Manager often cannot; use a System User token with ads_read as META_ADS_ACCESS_TOKEN.",
    };
  } else {
    probe.adAccount = {
      ok: false,
      error:
        "No META_AD_ACCOUNT_ID. Create the ad account inside the Business Portfolio, then add the numeric id (with or without the act_ prefix).",
    };
  }

  return probe;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effectiveStatus?: string;
  objective?: string;
  dailyBudget?: string;
  lifetimeBudget?: string;
  createdTime?: string;
}

export async function listMetaCampaigns(auth: MetaAuth): Promise<MetaCampaign[]> {
  const token = auth.adsToken || auth.capiToken;
  if (!auth.adAccountId) {
    throw new Error(
      "No Meta ad account ID. Add META_AD_ACCOUNT_ID (agency) or save the client's ad account on their client page."
    );
  }
  if (!token) {
    throw new Error(
      "No Meta access token that can read ads. Add META_ADS_ACCESS_TOKEN (System User, ads_read) in Vercel."
    );
  }

  const data = await graphFetch<{
    data?: Array<{
      id: string;
      name: string;
      status: string;
      effective_status?: string;
      objective?: string;
      daily_budget?: string;
      lifetime_budget?: string;
      created_time?: string;
    }>;
  }>(
    `/${normalizeAdAccountId(auth.adAccountId)}/campaigns?fields=id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time&limit=25`,
    token
  );

  return (data.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    effectiveStatus: row.effective_status,
    objective: row.objective,
    dailyBudget: row.daily_budget,
    lifetimeBudget: row.lifetime_budget,
    createdTime: row.created_time,
  }));
}

/** Format Meta's integer-cents budget fields for the staff table. */
export function formatMetaBudget(cents?: string, currency = "USD"): string {
  if (!cents) return "—";
  const amount = Number(cents) / 100;
  if (!Number.isFinite(amount)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export function readClientEventId(body: unknown): string {
  if (body && typeof body === "object" && "eventId" in body) {
    const value = (body as { eventId?: unknown }).eventId;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed && trimmed.length <= 80) return trimmed;
    }
  }
  return crypto.randomUUID();
}

/**
 * Form-submit Lead. Never throws — a Meta outage must not take the form down.
 * No-ops when the agency Pixel is not configured yet.
 */
export async function captureAgencyLead(input: {
  eventId: string;
  sourceUrl: string;
  email?: string;
  phone?: string;
  name?: string;
  request: Request;
  contentName: string;
}): Promise<void> {
  const auth = agencyMetaAuth();
  if (!auth?.pixelId || !auth.capiToken) return;

  const [firstName, ...rest] = (input.name ?? "").trim().split(/\s+/);
  try {
    await sendMetaCapiEvent({
      eventName: "Lead",
      eventId: input.eventId,
      sourceUrl: input.sourceUrl,
      email: input.email,
      phone: input.phone,
      firstName: firstName || undefined,
      lastName: rest.join(" ") || undefined,
      request: input.request,
      customData: { content_name: input.contentName },
    });
  } catch (error) {
    console.error("Meta CAPI Lead failed", error);
  }
}
