/**
 * Pure GA4 Data API logic: request assembly, response mapping, credential
 * parsing. No network, no database, no `server-only` — everything here is a
 * function of its arguments so the whole surface is testable without hitting
 * Google.
 *
 * Deliberately dependency-free. The official `@google-analytics/data` client
 * pulls in gRPC, which is a poor fit for the serverless runtime this deploys
 * to and a large supply-chain surface for what amounts to two HTTPS calls
 * (mint a token, run a report). The REST API is stable and public.
 */

/**
 * GA4 metrics the Growth OS is allowed to read.
 *
 * An allowlist rather than free text for two reasons. It keeps a typo in the
 * database from becoming a confusing 400 from Google at sync time, and it
 * keeps arbitrary operator-supplied strings out of the request body — GA4
 * metric names accept expressions, so an unvalidated field is a place where
 * someone could ask the API for something nobody reviewed.
 *
 * Everything here is an aggregate traffic count. Nothing user-scoped, and
 * nothing that could carry an identifier.
 */
export const GA4_ALLOWED_METRICS = [
  "activeUsers",
  "newUsers",
  "sessions",
  "engagedSessions",
  "screenPageViews",
  "conversions",
  "eventCount",
  "userEngagementDuration",
] as const;

export type Ga4MetricName = (typeof GA4_ALLOWED_METRICS)[number];

export function isGa4MetricName(value: string): value is Ga4MetricName {
  return (GA4_ALLOWED_METRICS as readonly string[]).includes(value);
}

/** A closed date range, inclusive on both ends, as GA4 expects it. */
export interface Ga4Period {
  startDate: string;
  endDate: string;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GA4 accepts relative tokens like "7daysAgo" and "today" in date ranges. We
 * only ever send absolute dates, so that a measurement row's period_start and
 * period_end describe exactly the window that produced the number — a row that
 * says "last 7 days" is meaningless once it is a week old.
 */
export function assertAbsolutePeriod(period: Ga4Period): void {
  if (!ISO_DATE.test(period.startDate) || !ISO_DATE.test(period.endDate)) {
    throw new Error("GA4 periods must be absolute YYYY-MM-DD dates");
  }
  if (period.endDate < period.startDate) {
    throw new Error("A GA4 period must end on or after it starts");
  }
}

export interface Ga4RunReportRequest {
  dateRanges: Ga4Period[];
  metrics: Array<{ name: string }>;
  limit: number;
}

/**
 * Build the runReport body for a set of metrics over one period.
 *
 * No `dimensions` — the report is a single totals row for the window. Adding a
 * dimension would fan the response out into many rows and change what a
 * measurement means, so it is left out rather than defaulted.
 */
export function buildRunReportRequest(
  metrics: readonly string[],
  period: Ga4Period
): Ga4RunReportRequest {
  assertAbsolutePeriod(period);
  if (metrics.length === 0) {
    throw new Error("A GA4 report needs at least one metric");
  }
  const unknown = metrics.filter((name) => !isGa4MetricName(name));
  if (unknown.length > 0) {
    throw new Error(`Unsupported GA4 metric(s): ${[...new Set(unknown)].sort().join(", ")}`);
  }
  return {
    dateRanges: [{ startDate: period.startDate, endDate: period.endDate }],
    // De-duplicated: two growth_metrics may map to the same GA4 metric, and
    // GA4 rejects a request that names one twice.
    metrics: [...new Set(metrics)].map((name) => ({ name })),
    limit: 1,
  };
}

/** The subset of the runReport response this module reads. */
export interface Ga4RunReportResponse {
  metricHeaders?: Array<{ name?: string }>;
  rows?: Array<{ metricValues?: Array<{ value?: string }> }>;
}

/**
 * Read a totals report into `metric name -> number`.
 *
 * An empty `rows` is a legitimate answer, not an error: GA4 returns no rows for
 * a window with no traffic. That is reported as zero for every requested
 * metric, because "we measured and it was nothing" is a real data point, and
 * skipping the row would leave a gap indistinguishable from a failed sync.
 */
export function readReportTotals(
  response: Ga4RunReportResponse,
  requested: readonly string[]
): Map<string, number> {
  const wanted = [...new Set(requested)];
  const row = response.rows?.[0];
  if (!row) return new Map(wanted.map((name) => [name, 0]));

  const headers = response.metricHeaders ?? [];
  const totals = new Map<string, number>();

  for (const name of wanted) {
    const index = headers.findIndex((header) => header.name === name);
    if (index === -1) {
      throw new Error(`GA4 response is missing the requested metric "${name}"`);
    }
    const raw = row.metricValues?.[index]?.value;
    const parsed = Number(raw);
    if (raw === undefined || !Number.isFinite(parsed)) {
      throw new Error(`GA4 returned a non-numeric value for "${name}": ${String(raw)}`);
    }
    totals.set(name, parsed);
  }

  return totals;
}

/** A growth_metrics row, reduced to what the sync needs. */
export interface Ga4SyncableMetric {
  id: string;
  key: string;
  ga4_metric: string | null;
}

export interface Ga4MeasurementRow {
  metric_id: string;
  period_start: string;
  period_end: string;
  value: number;
  source: "ga4";
  recorded_by: string;
  notes: string;
}

/**
 * Turn GA4 totals into rows for growth_measurements.
 *
 * Metrics with a null `ga4_metric` are skipped rather than defaulted — they are
 * the hand-maintained ones (CAC, member count, revenue from Stripe), and
 * writing an analytics number over them would corrupt the campaign's reporting
 * in a way that is very hard to spot after the fact.
 *
 * `recorded_by` marks the writer so a synced row is distinguishable from a
 * staff entry in the audit trail. Combined with the unique constraint on
 * (metric_id, period_start, period_end, source), re-running a sync for the same
 * window updates in place instead of accumulating duplicates.
 */
export function buildMeasurementRows(
  metrics: readonly Ga4SyncableMetric[],
  totals: ReadonlyMap<string, number>,
  period: Ga4Period,
  recordedBy = "ga4-sync"
): Ga4MeasurementRow[] {
  assertAbsolutePeriod(period);
  const rows: Ga4MeasurementRow[] = [];

  for (const metric of metrics) {
    if (!metric.ga4_metric) continue;
    const value = totals.get(metric.ga4_metric);
    if (value === undefined) {
      throw new Error(`No GA4 total was fetched for metric "${metric.key}"`);
    }
    rows.push({
      metric_id: metric.id,
      period_start: period.startDate,
      period_end: period.endDate,
      value,
      source: "ga4",
      recorded_by: recordedBy,
      notes: `Synced from GA4 metric ${metric.ga4_metric}`,
    });
  }

  return rows;
}

/** Collect the distinct GA4 metric names a set of growth_metrics needs. */
export function collectGa4Metrics(metrics: readonly Ga4SyncableMetric[]): string[] {
  const names = metrics
    .map((metric) => metric.ga4_metric)
    .filter((name): name is string => Boolean(name));
  return [...new Set(names)];
}

export interface ServiceAccountKey {
  clientEmail: string;
  privateKey: string;
}

/**
 * Parse the service-account JSON Google hands you when you create a key.
 *
 * Read from an environment variable, which means the private key's newlines
 * have usually been escaped somewhere along the way (Vercel's UI does this).
 * An unescaped `\n` in a PEM body makes the key unparseable with an error that
 * points at crypto rather than at configuration, so it is normalised here.
 */
export function parseServiceAccountKey(raw: string | undefined): ServiceAccountKey {
  if (!raw) {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is not configured");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is not valid JSON");
  }

  const record = parsed as { client_email?: unknown; private_key?: unknown };
  const clientEmail = record.client_email;
  const privateKey = record.private_key;

  if (typeof clientEmail !== "string" || clientEmail.length === 0) {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is missing client_email");
  }
  if (typeof privateKey !== "string" || privateKey.length === 0) {
    throw new Error("GA4_SERVICE_ACCOUNT_JSON is missing private_key");
  }

  return { clientEmail, privateKey: privateKey.replace(/\\n/g, "\n") };
}

export const GA4_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export interface JwtClaims {
  iss: string;
  scope: string;
  aud: string;
  iat: number;
  exp: number;
}

/**
 * Claims for the JWT exchanged for an access token.
 *
 * `nowSeconds` is a parameter rather than a `Date.now()` call so the assembled
 * claims are deterministic under test. The hour is Google's documented maximum
 * lifetime; the token is used immediately and never cached to disk.
 */
export function buildJwtClaims(clientEmail: string, nowSeconds: number): JwtClaims {
  return {
    iss: clientEmail,
    scope: GA4_SCOPE,
    aud: GA4_TOKEN_URL,
    iat: nowSeconds,
    exp: nowSeconds + 3600,
  };
}

/** base64url, per RFC 7515 — JWT segments are not plain base64. */
export function base64Url(input: string | Uint8Array): string {
  const buffer = typeof input === "string" ? Buffer.from(input, "utf8") : Buffer.from(input);
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** The `header.payload` string that gets signed. */
export function buildSigningInput(claims: JwtClaims): string {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify(claims));
  return `${header}.${payload}`;
}

/** The GA4 Data API endpoint for a property's runReport call. */
export function runReportUrl(propertyId: string): string {
  if (!/^[0-9]+$/.test(propertyId)) {
    // Mirrors the CHECK constraint on growth_ga4_properties. Enforced again
    // here because this value is interpolated into a URL.
    throw new Error(`GA4 property id must be numeric, got "${propertyId}"`);
  }
  return `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
}
