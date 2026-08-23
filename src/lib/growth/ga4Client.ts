/**
 * The two network calls the GA4 sync makes: mint an access token from a
 * service-account key, then run a report. Everything else lives in
 * `@/lib/growth/ga4` as pure functions.
 *
 * `fetch` and the clock are injected so the whole path can be exercised in
 * tests without a network or a real Google key.
 */
import { createSign } from "node:crypto";
import {
  GA4_TOKEN_URL,
  buildJwtClaims,
  buildRunReportRequest,
  buildSigningInput,
  base64Url,
  parseServiceAccountKey,
  runReportUrl,
  type Ga4Period,
  type Ga4RunReportResponse,
  type ServiceAccountKey,
} from "@/lib/growth/ga4";

export interface Ga4Deps {
  fetch: typeof globalThis.fetch;
  nowSeconds: () => number;
}

export const defaultGa4Deps: Ga4Deps = {
  fetch: (...args) => globalThis.fetch(...args),
  nowSeconds: () => Math.floor(Date.now() / 1000),
};

/** Sign the JWT assertion Google exchanges for an access token. */
export function signAssertion(key: ServiceAccountKey, nowSeconds: number): string {
  const signingInput = buildSigningInput(buildJwtClaims(key.clientEmail, nowSeconds));
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  return `${signingInput}.${base64Url(signer.sign(key.privateKey))}`;
}

/**
 * Truncate a Google error body before it reaches a log or an API response.
 *
 * These bodies echo request details back, and the request carries the service
 * account's identity. The status code plus a short excerpt is enough to debug
 * without writing the whole thing somewhere it will outlive the incident.
 */
function briefly(body: string): string {
  const collapsed = body.replace(/\s+/g, " ").trim();
  return collapsed.length > 200 ? `${collapsed.slice(0, 200)}…` : collapsed;
}

export async function fetchAccessToken(
  rawServiceAccountJson: string | undefined,
  deps: Ga4Deps = defaultGa4Deps
): Promise<string> {
  const key = parseServiceAccountKey(rawServiceAccountJson);
  const assertion = signAssertion(key, deps.nowSeconds());

  const response = await deps.fetch(GA4_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });

  if (!response.ok) {
    throw new Error(
      `GA4 token request failed (${response.status}): ${briefly(await response.text())}`
    );
  }

  const payload = (await response.json()) as { access_token?: unknown };
  if (typeof payload.access_token !== "string" || payload.access_token.length === 0) {
    throw new Error("GA4 token response did not contain an access_token");
  }
  return payload.access_token;
}

export async function runReport(
  propertyId: string,
  metrics: readonly string[],
  period: Ga4Period,
  accessToken: string,
  deps: Ga4Deps = defaultGa4Deps
): Promise<Ga4RunReportResponse> {
  // Both of these validate before any request goes out: buildRunReportRequest
  // checks the metric allowlist and the period, runReportUrl checks the id.
  const body = buildRunReportRequest(metrics, period);
  const url = runReportUrl(propertyId);

  const response = await deps.fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `GA4 runReport failed (${response.status}): ${briefly(await response.text())}`
    );
  }

  return (await response.json()) as Ga4RunReportResponse;
}
