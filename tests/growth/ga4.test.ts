import { describe, expect, it } from "vitest";
import { createVerify, generateKeyPairSync } from "node:crypto";
import {
  GA4_SCOPE,
  GA4_TOKEN_URL,
  base64Url,
  buildJwtClaims,
  buildMeasurementRows,
  buildRunReportRequest,
  buildSigningInput,
  collectGa4Metrics,
  isGa4MetricName,
  parseServiceAccountKey,
  readReportTotals,
  runReportUrl,
  type Ga4Period,
  type Ga4SyncableMetric,
} from "@/lib/growth/ga4";
import { fetchAccessToken, runReport, signAssertion } from "@/lib/growth/ga4Client";

const PERIOD: Ga4Period = { startDate: "2026-08-01", endDate: "2026-08-31" };

/** A throwaway RSA key so the signing path is exercised for real, not mocked. */
const { privateKey, publicKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

function metric(overrides: Partial<Ga4SyncableMetric> = {}): Ga4SyncableMetric {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    key: "sessions",
    ga4_metric: "sessions",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("metric allowlist", () => {
  it("accepts the aggregate traffic metrics", () => {
    expect(isGa4MetricName("sessions")).toBe(true);
    expect(isGa4MetricName("activeUsers")).toBe(true);
  });

  it("rejects anything not on the list", () => {
    expect(isGa4MetricName("userId")).toBe(false);
    expect(isGa4MetricName("sessions;drop")).toBe(false);
  });

  it("refuses to build a request naming an unlisted metric", () => {
    expect(() => buildRunReportRequest(["sessions", "customEvent:pii"], PERIOD)).toThrow(
      /Unsupported GA4 metric/
    );
  });

  it("names every offender once, sorted, so the message is actionable", () => {
    expect(() => buildRunReportRequest(["zeta", "alpha", "zeta"], PERIOD)).toThrow(
      /alpha, zeta/
    );
  });
});

describe("request assembly", () => {
  it("sends one absolute date range and no dimensions", () => {
    const request = buildRunReportRequest(["sessions"], PERIOD);
    expect(request.dateRanges).toEqual([PERIOD]);
    expect(request).not.toHaveProperty("dimensions");
    expect(request.limit).toBe(1);
  });

  it("de-duplicates metrics, since GA4 rejects a repeated name", () => {
    const request = buildRunReportRequest(["sessions", "sessions", "newUsers"], PERIOD);
    expect(request.metrics).toEqual([{ name: "sessions" }, { name: "newUsers" }]);
  });

  it("rejects GA4's relative date tokens", () => {
    // "7daysAgo" is valid to GA4 but would make a stored period meaningless.
    expect(() =>
      buildRunReportRequest(["sessions"], { startDate: "7daysAgo", endDate: "today" })
    ).toThrow(/absolute YYYY-MM-DD/);
  });

  it("rejects a backwards period", () => {
    expect(() =>
      buildRunReportRequest(["sessions"], { startDate: "2026-08-31", endDate: "2026-08-01" })
    ).toThrow(/end on or after/);
  });

  it("rejects an empty metric list", () => {
    expect(() => buildRunReportRequest([], PERIOD)).toThrow(/at least one metric/);
  });

  it("refuses a non-numeric property id before it reaches a URL", () => {
    expect(() => runReportUrl("../../admin")).toThrow(/must be numeric/);
    expect(runReportUrl("123456")).toBe(
      "https://analyticsdata.googleapis.com/v1beta/properties/123456:runReport"
    );
  });
});

describe("reading totals", () => {
  it("maps values by header position, not by request order", () => {
    const totals = readReportTotals(
      {
        // Headers deliberately in the opposite order to the request.
        metricHeaders: [{ name: "newUsers" }, { name: "sessions" }],
        rows: [{ metricValues: [{ value: "7" }, { value: "42" }] }],
      },
      ["sessions", "newUsers"]
    );
    expect(totals.get("sessions")).toBe(42);
    expect(totals.get("newUsers")).toBe(7);
  });

  it("treats a no-traffic window as zero rather than a gap", () => {
    const totals = readReportTotals({ rows: [] }, ["sessions", "newUsers"]);
    expect(totals.get("sessions")).toBe(0);
    expect(totals.get("newUsers")).toBe(0);
  });

  it("throws when a requested metric is absent from the response", () => {
    expect(() =>
      readReportTotals(
        { metricHeaders: [{ name: "sessions" }], rows: [{ metricValues: [{ value: "1" }] }] },
        ["sessions", "newUsers"]
      )
    ).toThrow(/missing the requested metric "newUsers"/);
  });

  it("throws on a non-numeric value instead of silently storing NaN", () => {
    expect(() =>
      readReportTotals(
        { metricHeaders: [{ name: "sessions" }], rows: [{ metricValues: [{ value: "n/a" }] }] },
        ["sessions"]
      )
    ).toThrow(/non-numeric value/);
  });
});

describe("measurement rows", () => {
  it("skips hand-maintained metrics so a sync cannot overwrite them", () => {
    const rows = buildMeasurementRows(
      [
        metric({ id: "a", key: "sessions", ga4_metric: "sessions" }),
        metric({ id: "b", key: "cac", ga4_metric: null }),
      ],
      new Map([["sessions", 42]]),
      PERIOD
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.metric_id).toBe("a");
  });

  it("stamps source and recorded_by so synced rows are distinguishable", () => {
    const [row] = buildMeasurementRows([metric()], new Map([["sessions", 42]]), PERIOD);
    expect(row?.source).toBe("ga4");
    expect(row?.recorded_by).toBe("ga4-sync");
    expect(row?.period_start).toBe(PERIOD.startDate);
    expect(row?.period_end).toBe(PERIOD.endDate);
  });

  it("throws rather than writing a row with no fetched total", () => {
    expect(() => buildMeasurementRows([metric()], new Map(), PERIOD)).toThrow(
      /No GA4 total was fetched/
    );
  });

  it("collects distinct GA4 names across metrics", () => {
    expect(
      collectGa4Metrics([
        metric({ id: "a", ga4_metric: "sessions" }),
        metric({ id: "b", ga4_metric: "sessions" }),
        metric({ id: "c", ga4_metric: null }),
        metric({ id: "d", ga4_metric: "newUsers" }),
      ])
    ).toEqual(["sessions", "newUsers"]);
  });
});

describe("service-account credentials", () => {
  it("un-escapes newlines mangled by env-var storage", () => {
    const raw = JSON.stringify({
      client_email: "sync@example.iam.gserviceaccount.com",
      private_key: "-----BEGIN PRIVATE KEY-----\\nAAAA\\n-----END PRIVATE KEY-----\\n",
    });
    expect(parseServiceAccountKey(raw).privateKey).toContain("\n");
    expect(parseServiceAccountKey(raw).privateKey).not.toContain("\\n");
  });

  it("names the missing field rather than failing later in crypto", () => {
    expect(() => parseServiceAccountKey(undefined)).toThrow(/not configured/);
    expect(() => parseServiceAccountKey("{oops")).toThrow(/not valid JSON/);
    expect(() => parseServiceAccountKey(JSON.stringify({ private_key: "k" }))).toThrow(
      /missing client_email/
    );
    expect(() => parseServiceAccountKey(JSON.stringify({ client_email: "a@b" }))).toThrow(
      /missing private_key/
    );
  });
});

describe("JWT assertion", () => {
  const claims = buildJwtClaims("sync@example.iam.gserviceaccount.com", 1_800_000_000);

  it("requests read-only analytics scope for the token endpoint", () => {
    expect(claims.scope).toBe(GA4_SCOPE);
    expect(claims.aud).toBe(GA4_TOKEN_URL);
    expect(claims.exp - claims.iat).toBe(3600);
  });

  it("uses base64url, not base64", () => {
    // 0xFB 0xFF encodes to "+/8=" in standard base64 — one of each character
    // that base64url has to replace or strip, so this covers all three rules.
    expect(Buffer.from([0xfb, 0xff]).toString("base64")).toBe("+/8=");
    expect(base64Url(Buffer.from([0xfb, 0xff]))).toBe("-_8");
  });

  it("produces a signature Google's public key would verify", () => {
    const assertion = signAssertion(
      { clientEmail: "sync@example.iam.gserviceaccount.com", privateKey },
      1_800_000_000
    );
    const [header, payload, signature] = assertion.split(".");
    expect(header && payload && signature).toBeTruthy();

    const verifier = createVerify("RSA-SHA256");
    verifier.update(`${header}.${payload}`);
    verifier.end();
    const signatureBytes = Buffer.from(
      signature!.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    );
    expect(verifier.verify(publicKey, signatureBytes)).toBe(true);

    // And the payload is the claims we built, not something re-derived.
    expect(JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"))).toEqual(claims);
    expect(buildSigningInput(claims)).toBe(`${header}.${payload}`);
  });
});

describe("token exchange", () => {
  const serviceAccountJson = JSON.stringify({
    client_email: "sync@example.iam.gserviceaccount.com",
    private_key: privateKey,
  });

  it("posts a jwt-bearer grant and returns the token", async () => {
    let seenUrl: string | undefined;
    let seenBody: string | undefined;

    const token = await fetchAccessToken(serviceAccountJson, {
      nowSeconds: () => 1_800_000_000,
      fetch: async (input, init) => {
        seenUrl = String(input);
        seenBody = String(init?.body);
        return jsonResponse({ access_token: "ya29.test" });
      },
    });

    expect(token).toBe("ya29.test");
    expect(seenUrl).toBe(GA4_TOKEN_URL);
    const form = new URLSearchParams(seenBody!);
    expect(form.get("grant_type")).toBe("urn:ietf:params:oauth:grant-type:jwt-bearer");
    expect(form.get("assertion")?.split(".")).toHaveLength(3);
  });

  it("surfaces the status and does not dump the whole error body", async () => {
    const noisy = "x".repeat(5000);
    await expect(
      fetchAccessToken(serviceAccountJson, {
        nowSeconds: () => 1_800_000_000,
        fetch: async () => new Response(noisy, { status: 401 }),
      })
    ).rejects.toThrow(/GA4 token request failed \(401\)/);

    await expect(
      fetchAccessToken(serviceAccountJson, {
        nowSeconds: () => 1_800_000_000,
        fetch: async () => new Response(noisy, { status: 401 }),
      })
    ).rejects.toThrow(/…$/);
  });

  it("rejects a 200 that carries no access_token", async () => {
    await expect(
      fetchAccessToken(serviceAccountJson, {
        nowSeconds: () => 1_800_000_000,
        fetch: async () => jsonResponse({ expires_in: 3600 }),
      })
    ).rejects.toThrow(/did not contain an access_token/);
  });
});

describe("runReport", () => {
  it("sends the bearer token and the assembled body to the property URL", async () => {
    let seenUrl: string | undefined;
    let seenInit: RequestInit | undefined;

    const response = await runReport("123456", ["sessions"], PERIOD, "ya29.test", {
      nowSeconds: () => 1_800_000_000,
      fetch: async (input, init) => {
        seenUrl = String(input);
        seenInit = init;
        return jsonResponse({
          metricHeaders: [{ name: "sessions" }],
          rows: [{ metricValues: [{ value: "42" }] }],
        });
      },
    });

    expect(seenUrl).toBe(runReportUrl("123456"));
    expect((seenInit?.headers as Record<string, string>).authorization).toBe("Bearer ya29.test");
    expect(JSON.parse(String(seenInit?.body))).toEqual(buildRunReportRequest(["sessions"], PERIOD));
    expect(readReportTotals(response, ["sessions"]).get("sessions")).toBe(42);
  });

  it("validates before making a request at all", async () => {
    let called = false;
    const deps = {
      nowSeconds: () => 1_800_000_000,
      fetch: async () => {
        called = true;
        return jsonResponse({});
      },
    };

    await expect(runReport("123456", ["notAMetric"], PERIOD, "t", deps)).rejects.toThrow(
      /Unsupported GA4 metric/
    );
    await expect(runReport("not-numeric", ["sessions"], PERIOD, "t", deps)).rejects.toThrow(
      /must be numeric/
    );
    expect(called).toBe(false);
  });
});
