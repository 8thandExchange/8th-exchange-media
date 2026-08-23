import "server-only";

import { getPortalDb } from "@/lib/portal/db";
import {
  buildMeasurementRows,
  collectGa4Metrics,
  readReportTotals,
  type Ga4Period,
  type Ga4SyncableMetric,
} from "@/lib/growth/ga4";
import { defaultGa4Deps, fetchAccessToken, runReport, type Ga4Deps } from "@/lib/growth/ga4Client";

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export interface Ga4SyncResult {
  /** Measurements written. Zero when no metric on the campaign maps to GA4. */
  written: number;
  /** GA4 metric names actually requested, for the caller to echo back. */
  metrics: string[];
  period: Ga4Period;
}

/**
 * Pull one period of GA4 numbers into a campaign's measurements.
 *
 * The campaign, not the client, is the unit of work: a client can be running
 * several campaigns whose metrics have different GA4 mappings, and the property
 * is resolved through whichever client owns this campaign.
 *
 * Idempotent by construction. growth_measurements is unique on
 * (metric_id, period_start, period_end, source), so re-running the same window
 * updates the rows in place. That matters because the natural way to operate
 * this is a nightly job that re-pulls a trailing window — GA4 keeps revising
 * recent numbers for 24-48 hours, so the last run's values are expected to
 * change, not to duplicate.
 */
export async function syncCampaignGa4Measurements(
  campaignId: string,
  period: Ga4Period,
  deps: Ga4Deps = defaultGa4Deps
): Promise<Ga4SyncResult> {
  const db = getPortalDb();

  const { data: campaign, error: campaignError } = await db
    .from("growth_campaigns")
    .select("id, client_id")
    .eq("id", campaignId)
    .maybeSingle();
  throwIfError(campaignError);
  if (!campaign) throw new Error("Campaign not found");
  if (!campaign.client_id) {
    // growth_campaigns.client_id is nullable — internal 8E campaigns have no
    // client and therefore no GA4 property to read.
    throw new Error("This campaign is not attached to a client, so it has no GA4 property");
  }

  const { data: property, error: propertyError } = await db
    .from("growth_ga4_properties")
    .select("property_id")
    .eq("client_id", campaign.client_id)
    .maybeSingle();
  throwIfError(propertyError);
  if (!property) {
    throw new Error("This client has no GA4 property configured");
  }

  const { data: metricRows, error: metricsError } = await db
    .from("growth_metrics")
    .select("id, key, ga4_metric")
    .eq("campaign_id", campaignId)
    .not("ga4_metric", "is", null);
  throwIfError(metricsError);

  const metrics = (metricRows ?? []) as Ga4SyncableMetric[];
  const ga4Metrics = collectGa4Metrics(metrics);
  if (ga4Metrics.length === 0) {
    // Not an error: a campaign whose metrics are all hand-maintained simply has
    // nothing to sync, and a nightly job should not fail on that.
    return { written: 0, metrics: [], period };
  }

  const accessToken = await fetchAccessToken(process.env.GA4_SERVICE_ACCOUNT_JSON, deps);
  const report = await runReport(property.property_id, ga4Metrics, period, accessToken, deps);
  const totals = readReportTotals(report, ga4Metrics);
  const rows = buildMeasurementRows(metrics, totals, period);

  const { error: writeError } = await db
    .from("growth_measurements")
    .upsert(rows, { onConflict: "metric_id,period_start,period_end,source" });
  throwIfError(writeError);

  return { written: rows.length, metrics: ga4Metrics, period };
}
