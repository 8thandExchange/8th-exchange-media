/**
 * Go High Level (LeadConnector) integration.
 *
 * Uses a Private Integration token (GHL_API_TOKEN) scoped to the agency's
 * sub-account plus that sub-account's location id (GHL_LOCATION_ID).
 * All calls are fire-and-forget from our routes: a GHL outage must never
 * break the user-facing flow, so callers should .catch and log.
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

function ghlConfig(): { token: string; locationId: string } | null {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) return null;
  return { token, locationId };
}

export interface GhlContactInput {
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  website?: string;
  source?: string;
  tags?: string[];
  notes?: string;
}

/**
 * Upsert a contact in GHL. Returns the contact id, or null when the
 * integration is not configured or the API call fails (callers log).
 */
export async function pushContactToGhl(input: GhlContactInput): Promise<string | null> {
  const config = ghlConfig();
  if (!config) return null;

  const [firstName, ...restName] = input.name.trim().split(/\s+/);
  const response = await fetch(`${GHL_BASE}/contacts/upsert`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      locationId: config.locationId,
      firstName,
      lastName: restName.join(" ") || undefined,
      email: input.email,
      phone: input.phone || undefined,
      companyName: input.companyName || undefined,
      website: input.website || undefined,
      source: input.source ?? "8emedia.com",
      tags: input.tags ?? [],
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`GHL upsert failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = (await response.json()) as { contact?: { id?: string } };
  const contactId = data.contact?.id ?? null;

  if (contactId && input.notes) {
    await fetch(`${GHL_BASE}/contacts/${contactId}/notes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        Version: GHL_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body: input.notes.slice(0, 5000) }),
    }).catch(() => {
      // Notes are best-effort; the contact itself is what matters.
    });
  }

  return contactId;
}
