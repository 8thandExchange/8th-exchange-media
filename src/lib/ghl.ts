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

/* ── Social Planner ─────────────────────────────── */

export interface GhlSocialAccount {
  id: string;
  name?: string;
  platform?: string;
  type?: string;
  avatar?: string;
}

export interface GhlSocialPost {
  _id?: string;
  id?: string;
  summary?: string;
  status?: string;
  scheduleDate?: string;
  createdAt?: string;
  accountIds?: string[];
  media?: { url: string }[];
}

function requireGhlConfig(): { token: string; locationId: string } {
  const token = process.env.GHL_API_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!token || !locationId) {
    throw new Error("GHL_API_TOKEN and GHL_LOCATION_ID must be configured");
  }
  return { token, locationId };
}

function ghlHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function listSocialAccounts(): Promise<{
  accounts: GhlSocialAccount[];
  groups: unknown[];
}> {
  const { token, locationId } = requireGhlConfig();
  const response = await fetch(
    `${GHL_BASE}/social-media-posting/${locationId}/accounts`,
    { headers: ghlHeaders(token), cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(`GHL accounts fetch failed (${response.status})`);
  }
  const data = (await response.json()) as {
    results?: { accounts?: GhlSocialAccount[]; groups?: unknown[] };
  };
  return {
    accounts: data.results?.accounts ?? [],
    groups: data.results?.groups ?? [],
  };
}

export async function createSocialPost(input: {
  summary: string;
  accountIds: string[];
  mediaUrls?: string[];
  /** ISO timestamp; when set, status becomes "scheduled". */
  scheduleDate?: string;
  status?: "draft" | "scheduled" | "published";
}): Promise<unknown> {
  const { token, locationId } = requireGhlConfig();

  const body: Record<string, unknown> = {
    accountIds: input.accountIds,
    summary: input.summary,
    type: "post",
    status: input.status ?? (input.scheduleDate ? "scheduled" : "draft"),
  };
  if (input.scheduleDate) body.scheduleDate = input.scheduleDate;
  if (input.mediaUrls?.length) {
    body.media = input.mediaUrls.map((url) => ({ url }));
  }

  const response = await fetch(
    `${GHL_BASE}/social-media-posting/${locationId}/posts`,
    { method: "POST", headers: ghlHeaders(token), body: JSON.stringify(body) }
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`GHL post create failed (${response.status}): ${text.slice(0, 400)}`);
  }
  return response.json();
}

export async function listSocialPosts(): Promise<GhlSocialPost[]> {
  const { token, locationId } = requireGhlConfig();

  const now = Date.now();
  const response = await fetch(
    `${GHL_BASE}/social-media-posting/${locationId}/posts/list`,
    {
      method: "POST",
      headers: ghlHeaders(token),
      body: JSON.stringify({
        type: "all",
        accounts: "",
        skip: "0",
        limit: "25",
        fromDate: new Date(now - 30 * 24 * 3600 * 1000).toISOString(),
        toDate: new Date(now + 90 * 24 * 3600 * 1000).toISOString(),
        includeUsers: "true",
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`GHL posts list failed (${response.status})`);
  }
  const data = (await response.json()) as {
    results?: { posts?: GhlSocialPost[] };
    posts?: GhlSocialPost[];
  };
  return data.results?.posts ?? data.posts ?? [];
}
