/** Fire a browser Pixel Lead that dedupes with the matching CAPI event. */
export function trackBrowserLead(eventId: string | undefined): void {
  if (!eventId || typeof window === "undefined") return;
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("track", "Lead", {}, { eventID: eventId });
  }
}
