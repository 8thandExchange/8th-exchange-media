/**
 * Browser-side Meta helpers. Safe to import from client components —
 * no tokens, no server imports.
 */

export function newMetaEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  const fbq = (window as Window & { fbq?: Fbq }).fbq;
  return typeof fbq === "function" ? fbq : null;
}

/** Fire a Pixel Lead that shares event_id with the Conversions API call. */
export function trackMetaLead(eventId: string, extra?: Record<string, unknown>): void {
  const fbq = getFbq();
  if (!fbq) return;
  fbq("track", "Lead", extra ?? {}, { eventID: eventId });
}
