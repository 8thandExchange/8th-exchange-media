/**
 * Go High Level (LeadConnector) integration.
 *
 * Every call is scoped to a sub-account: a Private Integration token plus
 * that sub-account's location id (a GhlAuth). The agency's own sub-account
 * comes from env (GHL_API_TOKEN / GHL_LOCATION_ID); client sub-accounts
 * come from their portal_clients row (see getClientGhlAuth in portal/service).
 * Contact pushes are fire-and-forget from our routes: a GHL outage must
 * never break the user-facing flow, so callers should .catch and log.
 */

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

/** Credentials for one GHL sub-account (location). */
export interface GhlAuth {
  token: string;
  locationId: string;
}

/** The agency's own sub-account, from env. Null when not configured. */
export function agencyGhlAuth(): GhlAuth | null {
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
export async function pushContactToGhl(
  input: GhlContactInput,
  auth?: GhlAuth
): Promise<string | null> {
  const config = auth ?? agencyGhlAuth();
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

function requireGhlAuth(auth?: GhlAuth): GhlAuth {
  const config = auth ?? agencyGhlAuth();
  if (!config) {
    throw new Error("GHL_API_TOKEN and GHL_LOCATION_ID must be configured");
  }
  return config;
}

function ghlHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Version: GHL_VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function listSocialAccounts(auth?: GhlAuth): Promise<{
  accounts: GhlSocialAccount[];
  groups: unknown[];
}> {
  const { token, locationId } = requireGhlAuth(auth);
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

/**
 * GHL requires every post to be attributed to a location user, and a
 * Private Integration token has no user of its own — so we attribute to
 * the first user in the location. Needs the "View Users" scope on the PIT.
 */
async function firstLocationUserId(auth: GhlAuth): Promise<string> {
  const response = await fetch(`${GHL_BASE}/users/?locationId=${auth.locationId}`, {
    headers: ghlHeaders(auth.token),
    cache: "no-store",
  });
  if (response.status === 401) {
    throw new Error(
      'GHL rejected the user lookup — the Private Integration token is missing the "View Users" scope. Add it under Settings → Private Integrations in that sub-account, then retry.'
    );
  }
  if (!response.ok) {
    throw new Error(`GHL users fetch failed (${response.status})`);
  }
  const data = (await response.json()) as { users?: { id?: string }[] };
  const userId = data.users?.find((u) => u.id)?.id;
  if (!userId) {
    throw new Error("This GHL location has no users to attribute the post to");
  }
  return userId;
}

export async function createSocialPost(input: {
  summary: string;
  accountIds: string[];
  mediaUrls?: string[];
  /** ISO timestamp; when set, status becomes "scheduled". */
  scheduleDate?: string;
  status?: "draft" | "scheduled" | "published";
}, auth?: GhlAuth): Promise<unknown> {
  const config = requireGhlAuth(auth);
  const { token, locationId } = config;

  const body: Record<string, unknown> = {
    accountIds: input.accountIds,
    summary: input.summary,
    type: "post",
    status: input.status ?? (input.scheduleDate ? "scheduled" : "draft"),
    userId: await firstLocationUserId(config),
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

export async function listSocialPosts(auth?: GhlAuth): Promise<GhlSocialPost[]> {
  const { token, locationId } = requireGhlAuth(auth);

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
