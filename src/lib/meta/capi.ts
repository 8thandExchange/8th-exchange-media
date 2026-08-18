import { createHash, randomUUID } from "crypto";
import { getAgencyMetaConfig, META_GRAPH_BASE } from "@/lib/meta/config";

/**
 * Meta Conversions API — server-side twin of the browser Pixel.
 * Browser events stay consent-gated; CAPI fires on first-party form
 * submits (the visitor just handed us the lead). Same event_id on both
 * sides so Events Manager can dedupe.
 */

export type MetaStandardEvent = "Lead" | "Contact" | "CompleteRegistration" | "PageView";

export interface CapiUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface CapiEventInput {
  eventName: MetaStandardEvent;
  eventId?: string;
  eventSourceUrl?: string;
  user: CapiUserData;
  customData?: Record<string, string | number | boolean | undefined>;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Digits only; 10-digit US numbers get a leading 1. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `1${digits}`;
  return digits;
}

function hashIfPresent(value: string | undefined, normalize: (v: string) => string): string[] {
  if (!value?.trim()) return [];
  return [sha256(normalize(value))];
}

export function newMetaEventId(): string {
  return randomUUID();
}

export function readMetaClickIds(request: Request): { fbp?: string; fbc?: string } {
  const cookie = request.headers.get("cookie") ?? "";
  const fbp = cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1];
  const fbc = cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1];
  return {
    ...(fbp ? { fbp: decodeURIComponent(fbp) } : {}),
    ...(fbc ? { fbc: decodeURIComponent(fbc) } : {}),
  };
}

export function clientIpFrom(request: Request): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return undefined;
  return forwarded.split(",")[0]?.trim() || undefined;
}

/**
 * Send one CAPI event for the agency pixel. Never throws — a Meta
 * outage must not take down contact or onboarding.
 */
export async function sendAgencyCapiEvent(input: CapiEventInput): Promise<{ eventId: string; sent: boolean }> {
  const eventId = input.eventId ?? newMetaEventId();
  const { pixelId, capiToken, testEventCode } = getAgencyMetaConfig();

  if (!pixelId || !capiToken) {
    return { eventId, sent: false };
  }

  const userData: Record<string, unknown> = {};
  const em = hashIfPresent(input.user.email, normalizeEmail);
  const ph = hashIfPresent(input.user.phone, normalizePhone);
  const fn = hashIfPresent(input.user.firstName, (v) => v.trim().toLowerCase());
  const ln = hashIfPresent(input.user.lastName, (v) => v.trim().toLowerCase());
  if (em.length) userData.em = em;
  if (ph.length) userData.ph = ph;
  if (fn.length) userData.fn = fn;
  if (ln.length) userData.ln = ln;
  if (input.user.clientIp) userData.client_ip_address = input.user.clientIp;
  if (input.user.userAgent) userData.client_user_agent = input.user.userAgent;
  if (input.user.fbp) userData.fbp = input.user.fbp;
  if (input.user.fbc) userData.fbc = input.user.fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: eventId,
        event_source_url: input.eventSourceUrl,
        user_data: userData,
        ...(input.customData ? { custom_data: input.customData } : {}),
      },
    ],
  };
  if (testEventCode) payload.test_event_code = testEventCode;

  try {
    const response = await fetch(`${META_GRAPH_BASE}/${pixelId}/events?access_token=${capiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text();
      console.error(`Meta CAPI failed (${response.status}): ${body.slice(0, 400)}`);
      return { eventId, sent: false };
    }
    return { eventId, sent: true };
  } catch (error) {
    console.error("Meta CAPI request failed", error);
    return { eventId, sent: false };
  }
}
