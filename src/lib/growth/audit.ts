import "server-only";

import crypto from "node:crypto";
import dns from "node:dns/promises";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { load } from "cheerio";
import type { AuditPageFacts, AuditPageInput, AuditSummary } from "@/lib/growth/types";

const MAX_RESPONSE_BYTES = 2_000_000;
const REQUEST_TIMEOUT_MS = 12_000;
const USER_AGENT = "8E-Growth-Audit/1.0 (+https://8emedia.com)";
const CTA_PATTERN =
  /\b(contact|book|schedule|get started|request|learn more|download|subscribe|sign up|start|buy|shop|call|quote|apply|join|reserve|discover)\b/i;

interface SafeResponse {
  url: URL;
  status: number;
  contentType: string;
  body: string;
}

export interface CrawlResult {
  pages: AuditPageInput[];
  summary: AuditSummary;
  partial: boolean;
  warnings: string[];
}

function isForbiddenIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) return true;
  const [a, b] = octets;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isForbiddenIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.")
  );
}

export function isPublicIp(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) return !isForbiddenIpv4(address);
  if (version === 6) return !isForbiddenIpv6(address);
  return false;
}

function normalizeTarget(input: string): URL {
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https websites can be audited");
  }
  if (url.username || url.password) throw new Error("Website URLs cannot contain credentials");
  if (url.port && !["80", "443"].includes(url.port)) {
    throw new Error("Website URLs must use port 80 or 443");
  }
  url.hash = "";
  return url;
}

async function resolvePublicAddress(hostname: string): Promise<{
  address: string;
  family: 4 | 6;
}> {
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  const publicRecord = records.find((record) => isPublicIp(record.address));
  if (!publicRecord || records.some((record) => !isPublicIp(record.address))) {
    throw new Error(`Audit blocked: ${hostname} resolves to a private or reserved network`);
  }
  return { address: publicRecord.address, family: publicRecord.family as 4 | 6 };
}

async function requestOnce(url: URL): Promise<SafeResponse> {
  const pinned = await resolvePublicAddress(url.hostname);
  const client = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const request = client.request(
      url,
      {
        method: "GET",
        headers: {
          Accept: "text/html,application/xhtml+xml,application/xml,text/plain;q=0.8,*/*;q=0.2",
          "Accept-Encoding": "identity",
          "User-Agent": USER_AGENT,
        },
        servername: url.hostname,
        lookup: (_hostname, options, callback) => {
          if (typeof options === "object" && options.all) {
            callback(null, [pinned]);
          } else {
            callback(null, pinned.address, pinned.family);
          }
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        const location = response.headers.location;
        if (status >= 300 && status < 400 && location) {
          response.resume();
          reject(Object.assign(new Error("REDIRECT"), { location }));
          return;
        }

        let size = 0;
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            request.destroy(new Error("Response exceeded the 2 MB audit limit"));
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          resolve({
            url,
            status,
            contentType: String(response.headers["content-type"] ?? ""),
            body: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Website request timed out"));
    });
    request.on("error", reject);
    request.end();
  });
}

async function safeRequest(input: URL, redirects = 0): Promise<SafeResponse> {
  if (redirects > 4) throw new Error("Website redirected too many times");
  const url = normalizeTarget(input.toString());
  try {
    return await requestOnce(url);
  } catch (error) {
    const redirect = error as Error & { location?: string };
    if (redirect.message !== "REDIRECT" || !redirect.location) throw error;
    const destination = normalizeTarget(new URL(redirect.location, url).toString());
    return safeRequest(destination, redirects + 1);
  }
}

function cleanText(value: string | undefined): string | null {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, 600) : null;
}

function sameOriginUrl(raw: string, pageUrl: URL, siteOrigin: string): string | null {
  try {
    const next = new URL(raw, pageUrl);
    next.hash = "";
    if (next.origin !== siteOrigin || !["http:", "https:"].includes(next.protocol)) return null;
    if (/\.(?:pdf|jpe?g|png|gif|webp|svg|zip|mp4|mov|mp3|docx?|xlsx?)$/i.test(next.pathname)) {
      return null;
    }
    next.search = "";
    return next.toString();
  } catch {
    return null;
  }
}

function analyzeHtml(response: SafeResponse, siteOrigin: string): AuditPageInput {
  const $ = load(response.body);
  const hasStructuredData = $('script[type="application/ld+json"]').length > 0;
  $("script, style, noscript, template, svg").remove();

  const pageUrl = response.url;
  const title = cleanText($("title").first().text());
  const description = cleanText($('meta[name="description"]').attr("content"));
  const canonical = cleanText($('link[rel="canonical"]').attr("href"));
  const h1s = $("h1")
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter((value): value is string => Boolean(value))
    .slice(0, 8);

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const words = bodyText ? bodyText.split(/\s+/).filter(Boolean) : [];
  const ctas = $("a, button, input[type=submit]")
    .map((_, element) => {
      const node = $(element);
      return cleanText(node.text() || node.attr("value") || node.attr("aria-label"));
    })
    .get()
    .filter((value): value is string => Boolean(value) && CTA_PATTERN.test(value))
    .slice(0, 12);

  const internal = new Set<string>();
  const external = new Set<string>();
  $("a[href]").each((_, element) => {
    const raw = $(element).attr("href");
    if (!raw || /^(?:mailto:|tel:|javascript:)/i.test(raw)) return;
    try {
      const candidate = new URL(raw, pageUrl);
      candidate.hash = "";
      if (!["http:", "https:"].includes(candidate.protocol)) return;
      if (candidate.origin === siteOrigin) {
        const normalized = sameOriginUrl(candidate.toString(), pageUrl, siteOrigin);
        if (normalized) internal.add(normalized);
      } else {
        external.add(candidate.toString());
      }
    } catch {
      // Invalid links are ignored here; malformed hrefs are not safely requestable.
    }
  });

  const images = $("img");
  const analyticsHtml = response.body.toLowerCase();
  const facts: AuditPageFacts = {
    hasForm: $("form").length > 0,
    hasPrimaryCta: ctas.length > 0,
    primaryCtas: ctas,
    hasEmailCapture:
      $('input[type="email"]').length > 0 ||
      $("form").text().toLowerCase().includes("newsletter") ||
      $("form").text().toLowerCase().includes("subscribe"),
    hasAnalytics:
      analyticsHtml.includes("googletagmanager.com") ||
      analyticsHtml.includes("gtag(") ||
      analyticsHtml.includes("connect.facebook.net") ||
      analyticsHtml.includes("plausible.io") ||
      analyticsHtml.includes("analytics"),
    hasOpenGraphImage: Boolean($('meta[property="og:image"]').attr("content")),
    hasStructuredData,
    hasViewport: Boolean($('meta[name="viewport"]').attr("content")),
    isNoIndex: /(?:^|,|\s)noindex(?:,|\s|$)/i.test(
      $('meta[name="robots"]').attr("content") ?? ""
    ),
    internalLinks: [...internal],
    externalLinks: [...external].slice(0, 100),
    brokenLinks: [],
    images: images.length,
    imagesMissingAlt: images.filter((_, image) => !$(image).attr("alt")?.trim()).length,
  };

  return {
    url: response.url.toString(),
    path: response.url.pathname || "/",
    http_status: response.status,
    content_type: response.contentType,
    title,
    meta_description: description,
    canonical_url: canonical ? new URL(canonical, response.url).toString() : null,
    h1s,
    word_count: words.length,
    facts,
    text_excerpt: cleanText(bodyText)?.slice(0, 1200) ?? null,
    content_hash: crypto.createHash("sha256").update(bodyText).digest("hex"),
    error: response.status >= 400 ? `HTTP ${response.status}` : null,
  };
}

function parseSitemap(xml: string, origin: string): string[] {
  const urls: string[] = [];
  for (const match of xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/gi)) {
    try {
      const url = new URL(match[1].replace(/&amp;/g, "&"));
      if (url.origin === origin) {
        url.hash = "";
        url.search = "";
        urls.push(url.toString());
      }
    } catch {
      // Ignore malformed sitemap entries.
    }
  }
  return urls;
}

function robotsAllows(robots: string, path: string): boolean {
  const lines = robots.split(/\r?\n/);
  let applies = false;
  const disallowed: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/#.*$/, "").trim();
    const [key, ...parts] = line.split(":");
    const value = parts.join(":").trim();
    if (key?.toLowerCase() === "user-agent") applies = value === "*";
    if (applies && key?.toLowerCase() === "disallow" && value) disallowed.push(value);
  }
  return !disallowed.some((entry) => path.startsWith(entry));
}

function duplicateCount(values: Array<string | null>): number {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value?.trim().toLowerCase();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0);
}

export function summarizeAudit(pages: AuditPageInput[]): AuditSummary {
  const healthy = pages.filter((page) => !page.error && (page.http_status ?? 500) < 400);
  return {
    totalPages: pages.length,
    healthyPages: healthy.length,
    failedPages: pages.length - healthy.length,
    averageWordCount: healthy.length
      ? Math.round(healthy.reduce((sum, page) => sum + page.word_count, 0) / healthy.length)
      : 0,
    forms: pages.filter((page) => page.facts.hasForm).length,
    pagesWithPrimaryCta: pages.filter((page) => page.facts.hasPrimaryCta).length,
    pagesWithAnalytics: pages.filter((page) => page.facts.hasAnalytics).length,
    pagesWithOpenGraphImage: pages.filter((page) => page.facts.hasOpenGraphImage).length,
    pagesWithStructuredData: pages.filter((page) => page.facts.hasStructuredData).length,
    duplicateTitles: duplicateCount(pages.map((page) => page.title)),
    duplicateDescriptions: duplicateCount(pages.map((page) => page.meta_description)),
    completedAt: new Date().toISOString(),
  };
}

export async function crawlWebsite(input: string, maxPages = 12): Promise<CrawlResult> {
  const start = normalizeTarget(input);
  const initial = await safeRequest(start);
  const root = initial.url;
  const siteOrigin = root.origin;
  const limit = Math.max(1, Math.min(25, Math.round(maxPages)));
  const warnings: string[] = [];

  let robots = "";
  try {
    const robotsResponse = await safeRequest(new URL("/robots.txt", siteOrigin));
    if (robotsResponse.status < 400) robots = robotsResponse.body;
  } catch (error) {
    warnings.push(`robots.txt unavailable: ${error instanceof Error ? error.message : "unknown error"}`);
  }

  const queue = [root.toString()];
  try {
    const sitemapResponse = await safeRequest(new URL("/sitemap.xml", siteOrigin));
    if (sitemapResponse.status < 400) {
      queue.push(...parseSitemap(sitemapResponse.body, siteOrigin).slice(0, limit * 3));
    }
  } catch {
    // A sitemap is optional; normal same-origin discovery continues.
  }

  const seen = new Set<string>();
  const pages: AuditPageInput[] = [];
  while (queue.length > 0 && pages.length < limit) {
    const candidate = queue.shift()!;
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    const url = new URL(candidate);
    if (!robotsAllows(robots, url.pathname)) continue;

    try {
      const response = candidate === root.toString() ? initial : await safeRequest(url);
      if (!response.contentType.includes("text/html") && !response.contentType.includes("xhtml")) {
        continue;
      }
      const page = analyzeHtml(response, siteOrigin);
      pages.push(page);
      for (const link of page.facts.internalLinks) {
        if (!seen.has(link) && queue.length < limit * 5) queue.push(link);
      }
    } catch (error) {
      pages.push({
        url: candidate,
        path: url.pathname,
        http_status: null,
        content_type: null,
        title: null,
        meta_description: null,
        canonical_url: null,
        h1s: [],
        word_count: 0,
        facts: {
          hasForm: false,
          hasPrimaryCta: false,
          primaryCtas: [],
          hasEmailCapture: false,
          hasAnalytics: false,
          hasOpenGraphImage: false,
          hasStructuredData: false,
          hasViewport: false,
          isNoIndex: false,
          internalLinks: [],
          externalLinks: [],
          brokenLinks: [],
          images: 0,
          imagesMissingAlt: 0,
        },
        text_excerpt: null,
        content_hash: null,
        error: error instanceof Error ? error.message : "Page request failed",
      });
    }
  }

  const statusByUrl = new Map(pages.map((page) => [page.url, page.http_status]));
  for (const page of pages) {
    page.facts.brokenLinks = page.facts.internalLinks.filter((url) => {
      const status = statusByUrl.get(url);
      return status !== undefined && (status === null || status >= 400);
    });
  }

  if (pages.length === 0) throw new Error("The website returned no auditable HTML pages");
  const summary = summarizeAudit(pages);
  return {
    pages,
    summary,
    partial: summary.failedPages > 0 || warnings.length > 0,
    warnings,
  };
}
