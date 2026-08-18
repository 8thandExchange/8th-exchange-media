import { formatAdAccountId, META_GRAPH_BASE } from "@/lib/meta/config";

export interface MetaCampaign {
  id: string;
  name: string;
  status: string;
  effectiveStatus: string;
  objective: string | null;
  updatedTime: string | null;
}

export interface MetaAccountInsights {
  spend: string;
  impressions: string;
  clicks: string;
  cpc: string;
  ctr: string;
}

export interface MetaAdsSnapshot {
  campaigns: MetaCampaign[];
  insights: MetaAccountInsights | null;
}

function graphErrorMessage(status: number, body: string): string {
  let parsed: { error?: { message?: string; error_user_msg?: string } } = {};
  try {
    parsed = JSON.parse(body) as typeof parsed;
  } catch {
    /* use raw body */
  }
  const detail = parsed.error?.error_user_msg || parsed.error?.message || body.slice(0, 280);

  if (status === 190 || /session has expired|invalid oauth/i.test(detail)) {
    return `Meta rejected the system-user token (${detail}). Generate a new token in Business Settings → Users → System users with ads_read, then set META_SYSTEM_USER_TOKEN (agency) or replace the token on the client page.`;
  }
  if (/permission/i.test(detail) || status === 403) {
    return `Meta token is missing ads_read (or the system user is not assigned to this ad account): ${detail}`;
  }
  if (status === 400 && /unknown path/i.test(detail)) {
    return `That ad account id is not a Meta ad account. Use the number from Ads Manager (act_…) — ${detail}`;
  }
  return `Meta Ads API failed (${status}): ${detail}`;
}

async function graphGet<T>(path: string, token: string): Promise<T> {
  const response = await fetch(`${META_GRAPH_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(graphErrorMessage(response.status, text));
  }
  return JSON.parse(text) as T;
}

/**
 * Live campaign list + last-30-day account insights.
 * Throws with a staff-actionable message; callers should catch and degrade.
 */
export async function listMetaCampaigns(
  adAccountId: string,
  systemUserToken: string
): Promise<MetaAdsSnapshot> {
  const act = formatAdAccountId(adAccountId);
  const fields = "id,name,status,effective_status,objective,updated_time";

  const [campaignsRes, insightsRes] = await Promise.all([
    graphGet<{ data?: Array<Record<string, string>> }>(
      `/${act}/campaigns?fields=${fields}&limit=25`,
      systemUserToken
    ),
    graphGet<{ data?: Array<Record<string, string>> }>(
      `/${act}/insights?fields=spend,impressions,clicks,cpc,ctr&date_preset=last_30d`,
      systemUserToken
    ).catch(() => ({ data: [] })),
  ]);

  const campaigns: MetaCampaign[] = (campaignsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    effectiveStatus: row.effective_status ?? row.status,
    objective: row.objective ?? null,
    updatedTime: row.updated_time ?? null,
  }));

  const insightRow = insightsRes.data?.[0];
  const insights: MetaAccountInsights | null = insightRow
    ? {
        spend: insightRow.spend ?? "0",
        impressions: insightRow.impressions ?? "0",
        clicks: insightRow.clicks ?? "0",
        cpc: insightRow.cpc ?? "0",
        ctr: insightRow.ctr ?? "0",
      }
    : null;

  return { campaigns, insights };
}
