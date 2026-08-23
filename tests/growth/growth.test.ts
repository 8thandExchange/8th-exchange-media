import { describe, expect, it } from "vitest";
import { ImageResponse } from "next/og";
import { crawlWebsite, isPublicIp, summarizeAudit } from "@/lib/growth/audit";
import { generateCampaignBrief } from "@/lib/growth/campaign";
import { assertPublicVoice, breakDisplayLines } from "@/lib/growth/copy";
import { loadGrowthAssetFonts } from "@/lib/growth/fonts";
import { renderGrowthAsset } from "@/lib/growth/graphics";
import { calculateCommercialMetrics, calculateMetricResult } from "@/lib/growth/reporting";
import { priorityScore, scoreAudit } from "@/lib/growth/scoring";
import type {
  AuditPageInput,
  BrandSnapshot,
  GrowthMetric,
  GrowthOpportunity,
  GrowthAsset,
} from "@/lib/growth/types";

function page(overrides: Partial<AuditPageInput> = {}): AuditPageInput {
  return {
    url: "https://example.com/",
    path: "/",
    http_status: 200,
    content_type: "text/html",
    title: "Example",
    meta_description: "A useful description",
    canonical_url: "https://example.com/",
    h1s: ["A clear headline"],
    word_count: 800,
    facts: {
      hasForm: true,
      hasPrimaryCta: true,
      primaryCtas: ["Get started"],
      hasEmailCapture: true,
      hasAnalytics: true,
      hasOpenGraphImage: true,
      hasStructuredData: true,
      hasViewport: true,
      isNoIndex: false,
      internalLinks: [],
      externalLinks: [],
      brokenLinks: [],
      images: 2,
      imagesMissingAlt: 0,
    },
    text_excerpt: "Useful copy",
    content_hash: "hash",
    error: null,
    ...overrides,
  };
}

describe("audit network safety", () => {
  it("rejects private and reserved addresses", () => {
    expect(isPublicIp("127.0.0.1")).toBe(false);
    expect(isPublicIp("10.2.3.4")).toBe(false);
    expect(isPublicIp("192.168.1.2")).toBe(false);
    expect(isPublicIp("169.254.10.2")).toBe(false);
    expect(isPublicIp("::1")).toBe(false);
    expect(isPublicIp("fd00::1")).toBe(false);
  });

  it("accepts public addresses", () => {
    expect(isPublicIp("8.8.8.8")).toBe(true);
    expect(isPublicIp("1.1.1.1")).toBe(true);
    expect(isPublicIp("2606:4700:4700::1111")).toBe(true);
  });
});

const liveAudit = process.env.RUN_LIVE_AUDIT === "1" ? it : it.skip;
liveAudit(
  "audits the live 8E website through the production-safe crawler",
  async () => {
    const result = await crawlWebsite("https://8emedia.com", 5);
    expect(result.pages.length).toBeGreaterThanOrEqual(1);
    expect(result.pages[0].http_status).toBe(200);
    expect(result.summary.healthyPages).toBeGreaterThanOrEqual(1);
  },
  60_000
);

describe("deterministic opportunity scoring", () => {
  it("uses the documented impact-confidence-effort formula", () => {
    expect(priorityScore(5, 5, 2)).toBe(80);
    expect(priorityScore(3, 4, 3)).toBe(28.8);
  });

  it("links every recommendation to evidence", () => {
    const pages = [
      page({
        title: null,
        h1s: [],
        facts: {
          ...page().facts,
          hasPrimaryCta: false,
          hasAnalytics: false,
          hasEmailCapture: false,
        },
      }),
    ];
    const summary = summarizeAudit(pages);
    const opportunities = scoreAudit(pages, summary);
    expect(opportunities.some((item) => item.rule_key === "missing-title")).toBe(true);
    expect(opportunities.some((item) => item.rule_key === "missing-cta")).toBe(true);
    expect(opportunities.some((item) => item.rule_key === "missing-analytics")).toBe(true);
    expect(opportunities.every((item) => Object.keys(item.evidence).length > 0)).toBe(true);
  });
});

describe("campaign generation", () => {
  it("produces three bounded posts and preserves evidence", () => {
    const opportunity = {
      id: "opp",
      client_id: null,
      audit_id: "audit",
      audit_page_id: null,
      audit_page_url: "https://example.com/",
      fingerprint: "fp",
      rule_key: "missing-cta",
      category: "conversion",
      title: "Give the page a decisive next step",
      description: "No recognizable action was found.",
      recommended_action: "Add one primary action.",
      evidence: { recognizedCtas: [] },
      impact: 5,
      confidence: 4,
      effort: 2,
      priority_score: 64,
      status: "open",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } satisfies GrowthOpportunity;
    const brand: BrandSnapshot = {
      name: "Example Company",
      tagline: "Useful work",
      primary: "#111111",
      secondary: "#ffffff",
      accent: "#cc9900",
      background: "#ffffff",
      foreground: "#111111",
      headingFont: "Georgia",
      bodyFont: "Arial",
      voiceTone: "Clear and direct",
    };
    const brief = generateCampaignBrief({
      opportunity,
      brand,
      objective: "Increase qualified inquiries",
      audience: "Local business owners",
      offer: "A practical growth assessment",
      primaryCta: "Book an assessment",
      destinationUrl: "https://example.com/contact",
      channels: ["facebook", "linkedin"],
    });
    expect(brief.posts).toHaveLength(3);
    expect(brief.evidence.observed).toEqual({ recognizedCtas: [] });
    expect(brief.posts.every((post) => post.variants.facebook)).toBe(true);
    expect(brief.posts[0].variants.facebook).toContain("utm_campaign=growth-opp");
    expect(brief.guardrails.some((rule) => rule.includes("guaranteed"))).toBe(true);
    expect(brief.posts.every((post) => assertPublicVoice(post.summary))).toBe(true);
    expect(brief.posts.every((post) => assertPublicVoice(post.graphicHeadline))).toBe(true);
    expect(brief.posts[0].graphicHeadline.split(/\s+/).length).toBeLessThanOrEqual(8);
    expect(brief.posts[1].graphicHeadline).toBe("Clarity creates momentum.");
    expect(brief.posts[2].graphicHeadline).toBe("A practical growth assessment");
  });

  it("breaks headlines for display instead of wrapping as a paragraph", () => {
    expect(breakDisplayLines("Make the next step obvious.", 16)).toEqual([
      "Make the next",
      "step obvious.",
    ]);
  });

  it("loads the house fonts used by rendered graphics", async () => {
    const fonts = await loadGrowthAssetFonts();
    expect(fonts.map((font) => [font.name, font.weight])).toEqual([
      ["Playfair Display", 600],
      ["Hanken Grotesk", 400],
      ["Hanken Grotesk", 600],
    ]);
    expect(fonts.every((font) => font.data.byteLength > 1000)).toBe(true);
  });

  it("renders the generated creative system as PNG", async () => {
    const asset = {
      id: "asset",
      campaign_id: "campaign",
      template_key: "statement",
      format: "square",
      content: {
        kicker: "What the evidence showed",
        headline: "Clarity creates momentum.",
        supportingText: "A useful campaign insight",
      },
      brand_snapshot: {
        name: "Example Company",
        tagline: "Useful work",
        primary: "#0b1b3d",
        secondary: "#f4efe3",
        accent: "#c9a84c",
        background: "#f4efe3",
        foreground: "#0b1b3d",
        headingFont: "Georgia",
        bodyFont: "Arial",
        voiceTone: "Clear and direct",
      },
      alt_text: "Example Company graphic: Clarity creates momentum.",
      status: "draft",
      public_token: "token",
      version: 1,
      approved_at: null,
      created_at: new Date().toISOString(),
    } satisfies GrowthAsset;
    const fonts = await loadGrowthAssetFonts();
    for (const template_key of ["statement", "insight", "offer"] as const) {
      const response = new ImageResponse(renderGrowthAsset({ ...asset, template_key }), {
        width: 300,
        height: 300,
        fonts,
      });
      const bytes = new Uint8Array(await response.arrayBuffer());
      expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    }
  });

  it("renders full-size 8E house lockups for visual review", async () => {
    const { writeFile, mkdir } = await import("node:fs/promises");
    const fonts = await loadGrowthAssetFonts();
    const house = {
      name: "8th & Exchange Media",
      tagline: "Make the signal impossible to ignore.",
      primary: "#0B1B3D",
      secondary: "#F4EFE3",
      accent: "#C5A059",
      background: "#F4EFE3",
      foreground: "#0B1B3D",
      headingFont: "Playfair Display",
      bodyFont: "Hanken Grotesk",
      voiceTone: "Editorial",
    };
    await mkdir("/tmp/growth-samples", { recursive: true });
    for (const template_key of ["statement", "insight", "offer"] as const) {
      const response = new ImageResponse(
        renderGrowthAsset({
          id: template_key,
          campaign_id: "campaign",
          template_key,
          format: "square",
          alt_text: "8E review graphic",
          status: "draft",
          public_token: "token",
          version: 1,
          approved_at: null,
          created_at: new Date().toISOString(),
          brand_snapshot: house,
          content: {
            kicker: template_key === "offer" ? "The offer" : template_key === "insight" ? "The principle" : "The friction",
            headline:
              template_key === "offer"
                ? "A practical growth assessment"
                : template_key === "insight"
                  ? "Clarity creates momentum."
                  : "Make the next step obvious.",
            supportingText: template_key === "offer" ? "Book an assessment" : house.tagline,
            cta: "Book an assessment",
          },
        }),
        { width: 1080, height: 1080, fonts }
      );
      await writeFile(`/tmp/growth-samples/${template_key}.png`, Buffer.from(await response.arrayBuffer()));
    }
  });
});

describe("measurement", () => {
  const metric = {
    id: "metric",
    campaign_id: "campaign",
    key: "qualified_leads",
    label: "Qualified leads",
    unit: "count",
    currency: null,
    direction: "increase",
    baseline_value: 10,
    target_value: 20,
    baseline_start: null,
    baseline_end: null,
    created_at: new Date().toISOString(),
  } satisfies GrowthMetric;

  it("calculates progress without implying attribution", () => {
    const result = calculateMetricResult(metric, [
      {
        id: "measurement",
        metric_id: metric.id,
        period_start: "2026-08-01",
        period_end: "2026-08-31",
        value: 15,
        source: "manual",
        evidence_url: null,
        notes: null,
        created_at: new Date().toISOString(),
      },
    ]);
    expect(result.changePercent).toBe(50);
    expect(result.progressPercent).toBe(50);
    expect(result.targetMet).toBe(false);
  });

  it("does not divide by zero", () => {
    const commercial = calculateCommercialMetrics({ spend: 100, leads: 0, revenue: 400 });
    expect(commercial.costPerLead).toBeNull();
    expect(commercial.returnOnAdSpend).toBe(4);
  });
});
