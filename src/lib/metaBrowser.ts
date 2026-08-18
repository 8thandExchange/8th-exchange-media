"use client";

/**
 * Browser-side Meta helpers. Dedupes with Conversions API via event_id.
 * No-ops when the visitor declined cookies (fbq never loaded).
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function newMetaEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function trackMetaBrowser(
  event: "Lead" | "Contact" | "CompleteRegistration" | "SubmitApplication",
  eventId: string
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, {}, { eventID: eventId });
}
