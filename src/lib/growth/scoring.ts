import crypto from "node:crypto";
import type {
  AuditPageInput,
  AuditSummary,
  OpportunityInput,
} from "@/lib/growth/types";

export const GROWTH_RULESET_VERSION = "2026-08-v1";

function fingerprint(rule: string, scope: string): string {
  return crypto.createHash("sha256").update(`${GROWTH_RULESET_VERSION}:${rule}:${scope}`).digest("hex");
}

export function priorityScore(impact: number, confidence: number, effort: number): number {
  return Math.round(impact * confidence * (6 - effort) * 8) / 10;
}

function pageOpportunity(
  page: AuditPageInput,
  input: Omit<OpportunityInput, "fingerprint" | "audit_page_url">
): OpportunityInput {
  return {
    ...input,
    audit_page_url: page.url,
    fingerprint: fingerprint(input.rule_key, page.path),
  };
}

function siteOpportunity(
  input: Omit<OpportunityInput, "fingerprint" | "audit_page_url">
): OpportunityInput {
  return { ...input, fingerprint: fingerprint(input.rule_key, "site") };
}

export function scoreAudit(
  pages: AuditPageInput[],
  summary: AuditSummary
): OpportunityInput[] {
  const opportunities: OpportunityInput[] = [];
  const healthy = pages.filter((page) => !page.error && (page.http_status ?? 500) < 400);

  for (const page of pages) {
    if (page.error || (page.http_status ?? 500) >= 400) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "page-unavailable",
          category: "conversion",
          title: `Repair unavailable page: ${page.path}`,
          description: `The page could not be reached successfully${
            page.http_status ? ` (HTTP ${page.http_status})` : ""
          }. Visitors and search engines cannot use a broken destination.`,
          recommended_action:
            "Restore the page or redirect it to the closest relevant live destination, then update every internal link that points to it.",
          evidence: { url: page.url, status: page.http_status, error: page.error },
          impact: 5,
          confidence: 5,
          effort: 2,
        })
      );
      continue;
    }

    if (page.facts.isNoIndex) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "noindex",
          category: "seo",
          title: `Confirm search exclusion on ${page.path}`,
          description:
            "The page explicitly tells search engines not to index it. If this is a revenue or discovery page, organic visitors cannot find it.",
          recommended_action:
            "Confirm the exclusion is intentional. Remove noindex from revenue and educational pages that should appear in search.",
          evidence: { url: page.url, robots: "noindex" },
          impact: 5,
          confidence: 5,
          effort: 1,
        })
      );
    }

    if (!page.title) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "missing-title",
          category: "seo",
          title: `Write a search title for ${page.path}`,
          description: "The page has no HTML title, weakening search relevance and browser usability.",
          recommended_action:
            "Add a specific title that leads with the page topic and closes with the brand name.",
          evidence: { url: page.url, title: null },
          impact: 4,
          confidence: 5,
          effort: 1,
        })
      );
    }

    if (!page.meta_description) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "missing-description",
          category: "seo",
          title: `Add a search description to ${page.path}`,
          description:
            "The page has no meta description, leaving search engines to assemble an unpredictable snippet.",
          recommended_action:
            "Write a benefit-led description with the page topic, differentiator, and next action.",
          evidence: { url: page.url, metaDescription: null },
          impact: 3,
          confidence: 5,
          effort: 1,
        })
      );
    }

    if (page.h1s.length !== 1) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "h1-structure",
          category: "content",
          title: page.h1s.length === 0 ? `Add a clear headline to ${page.path}` : `Clarify the main headline on ${page.path}`,
          description:
            page.h1s.length === 0
              ? "The page has no H1 headline that states its primary subject."
              : `The page has ${page.h1s.length} H1 headlines, making its primary message ambiguous.`,
          recommended_action:
            "Use one descriptive H1 that tells the intended visitor what this page helps them accomplish.",
          evidence: { url: page.url, h1s: page.h1s },
          impact: 4,
          confidence: 5,
          effort: 1,
        })
      );
    }

    if (!page.facts.hasPrimaryCta && page.path !== "/privacy" && page.path !== "/terms") {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "missing-cta",
          category: "conversion",
          title: `Give ${page.path} a decisive next step`,
          description:
            "No recognizable action was found. Interested visitors may finish reading without knowing how to continue.",
          recommended_action:
            "Add one primary action that matches visitor intent, then repeat it after the strongest proof or offer section.",
          evidence: { url: page.url, recognizedCtas: page.facts.primaryCtas },
          impact: 5,
          confidence: 4,
          effort: 2,
        })
      );
    }

    if (!page.facts.hasOpenGraphImage) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "missing-og-image",
          category: "distribution",
          title: `Create a branded share image for ${page.path}`,
          description:
            "The page has no Open Graph image. Shares may appear without a strong branded visual.",
          recommended_action:
            "Create a 1200×630 social card using the page promise, brand system, and an accessible image description.",
          evidence: { url: page.url, openGraphImage: null },
          impact: 3,
          confidence: 5,
          effort: 2,
        })
      );
    }

    if (!page.facts.hasStructuredData) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "missing-structured-data",
          category: "seo",
          title: `Add structured context to ${page.path}`,
          description:
            "No JSON-LD structured data was observed, limiting explicit entity and content signals for search systems.",
          recommended_action:
            "Add the most specific valid schema type for this page and validate every claim against visible page content.",
          evidence: { url: page.url, jsonLdBlocks: 0 },
          impact: 3,
          confidence: 5,
          effort: 2,
        })
      );
    }

    if (page.word_count < 250 && !["/contact", "/privacy", "/terms"].includes(page.path)) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "thin-content",
          category: "content",
          title: `Strengthen the case on ${page.path}`,
          description: `Only about ${page.word_count} visible words were observed. The page may not answer enough questions to earn trust or search visibility.`,
          recommended_action:
            "Add audience-specific problems, outcomes, proof, process, objections, and a relevant next step. Keep every section useful.",
          evidence: { url: page.url, wordCount: page.word_count },
          impact: 3,
          confidence: 3,
          effort: 3,
        })
      );
    }

    if (page.facts.imagesMissingAlt > 0) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "missing-image-alt",
          category: "accessibility",
          title: `Describe meaningful images on ${page.path}`,
          description: `${page.facts.imagesMissingAlt} of ${page.facts.images} images have no alt attribute, creating an accessibility and context gap.`,
          recommended_action:
            "Write concise descriptions for informative images and use an empty alt value for images that are purely decorative.",
          evidence: {
            url: page.url,
            images: page.facts.images,
            missingAlt: page.facts.imagesMissingAlt,
          },
          impact: 3,
          confidence: 5,
          effort: 2,
        })
      );
    }

    if (page.facts.brokenLinks.length > 0) {
      opportunities.push(
        pageOpportunity(page, {
          rule_key: "broken-internal-links",
          category: "conversion",
          title: `Repair broken paths from ${page.path}`,
          description: `${page.facts.brokenLinks.length} internal link${
            page.facts.brokenLinks.length === 1 ? "" : "s"
          } led to a failed page in this audit.`,
          recommended_action:
            "Update or remove each broken link and confirm the replacement preserves the visitor's intended next step.",
          evidence: { url: page.url, brokenLinks: page.facts.brokenLinks },
          impact: 4,
          confidence: 5,
          effort: 1,
        })
      );
    }
  }

  if (healthy.length > 0 && summary.pagesWithAnalytics === 0) {
    opportunities.push(
      siteOpportunity({
        rule_key: "missing-analytics",
        category: "measurement",
        title: "Establish a measurable conversion baseline",
        description:
          "No common analytics script was observed on the audited pages. Marketing decisions cannot be connected reliably to visitor behavior.",
        recommended_action:
          "Install consent-aware analytics, define primary conversion events, and record a baseline before launching the next campaign.",
        evidence: { pagesChecked: healthy.length, pagesWithAnalytics: 0 },
        impact: 5,
        confidence: 4,
        effort: 2,
      })
    );
  }

  if (healthy.length > 0 && !healthy.some((page) => page.facts.hasEmailCapture)) {
    opportunities.push(
      siteOpportunity({
        rule_key: "missing-low-friction-capture",
        category: "nurture",
        title: "Create a low-friction way to continue the relationship",
        description:
          "No email capture was observed. Visitors who are interested but not ready to contact or buy have no clear next step.",
        recommended_action:
          "Offer a genuinely useful guide, diagnostic, checklist, or update series and connect it to a permission-based nurture workflow.",
        evidence: { pagesChecked: healthy.length, emailCaptureForms: 0 },
        impact: 5,
        confidence: 4,
        effort: 3,
      })
    );
  }

  if (summary.duplicateTitles > 0) {
    opportunities.push(
      siteOpportunity({
        rule_key: "duplicate-titles",
        category: "seo",
        title: "Differentiate duplicate page titles",
        description: `${summary.duplicateTitles} audited pages share a title with another page, obscuring which page best answers each search intent.`,
        recommended_action:
          "Give every indexable page a unique title tied to its audience, topic, and role in the customer journey.",
        evidence: { duplicateTitlePages: summary.duplicateTitles },
        impact: 3,
        confidence: 5,
        effort: 2,
      })
    );
  }

  if (summary.duplicateDescriptions > 0) {
    opportunities.push(
      siteOpportunity({
        rule_key: "duplicate-descriptions",
        category: "seo",
        title: "Give each search result a distinct promise",
        description: `${summary.duplicateDescriptions} audited pages share a meta description with another page.`,
        recommended_action:
          "Write a distinct search snippet for each page based on its specific promise and intended next action.",
        evidence: { duplicateDescriptionPages: summary.duplicateDescriptions },
        impact: 2,
        confidence: 5,
        effort: 2,
      })
    );
  }

  return opportunities
    .sort(
      (a, b) =>
        priorityScore(b.impact, b.confidence, b.effort) -
        priorityScore(a.impact, a.confidence, a.effort)
    )
    .slice(0, 80);
}
