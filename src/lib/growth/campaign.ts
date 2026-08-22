import type {
  BrandSnapshot,
  CampaignBrief,
  CampaignPostDraft,
  GrowthOpportunity,
} from "@/lib/growth/types";

export interface CampaignGenerationInput {
  opportunity: GrowthOpportunity;
  brand: BrandSnapshot;
  objective: string;
  audience: string;
  offer: string;
  primaryCta: string;
  destinationUrl: string;
  channels: string[];
}

function trimSentence(value: string, limit: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  const clipped = cleaned.slice(0, limit - 1);
  return `${clipped.slice(0, clipped.lastIndexOf(" ") || clipped.length)}…`;
}

function channelVariant(
  channel: string,
  summary: string,
  cta: string,
  destination: string
): string {
  const base = `${summary}\n\n${cta}: ${destination}`;
  if (channel === "x" || channel === "twitter") return trimSentence(base, 275);
  if (channel === "linkedin") return `${summary}\n\n${cta}: ${destination}`;
  if (channel === "instagram") return `${summary}\n\n${cta}. Link in bio.`;
  return base;
}

function makePost(
  key: string,
  angle: string,
  summary: string,
  graphicHeadline: string,
  graphicKicker: string,
  template: CampaignPostDraft["assetTemplate"],
  input: CampaignGenerationInput
): CampaignPostDraft {
  return {
    key,
    angle,
    summary,
    variants: Object.fromEntries(
      input.channels.map((channel) => [
        channel,
        channelVariant(channel, summary, input.primaryCta, input.destinationUrl),
      ])
    ),
    assetTemplate: template,
    graphicHeadline: trimSentence(graphicHeadline, 92),
    graphicKicker: trimSentence(graphicKicker, 38),
    altText: `${input.brand.name} graphic: ${trimSentence(graphicHeadline, 130)}`,
  };
}

export function generateCampaignBrief(input: CampaignGenerationInput): CampaignBrief {
  const finding = input.opportunity.description;
  const action = input.opportunity.recommended_action;
  const proofBoundary =
    "Use only claims present in approved brand materials or evidence supplied by the client.";
  const voice = input.brand.voiceTone;

  const posts = [
    makePost(
      "problem",
      "Evidence and problem",
      `${input.audience} should not have to work to understand the next step. We found a specific gap: ${trimSentence(
        finding,
        260
      )} We are addressing it with a clearer path built around ${input.objective.toLowerCase()}.`,
      input.opportunity.title,
      "What the evidence showed",
      "statement",
      input
    ),
    makePost(
      "insight",
      "Educational insight",
      `Good marketing removes uncertainty. A strong experience connects the visitor's need, the proof they require, and one useful next action. For ${input.brand.name}, that means: ${trimSentence(
        action,
        300
      )}`,
      "Clarity creates momentum.",
      "The useful principle",
      "insight",
      input
    ),
    makePost(
      "offer",
      "Offer and action",
      `${input.offer} is designed for ${input.audience}. The goal is simple: ${input.objective}. If that is the outcome you need, the next step is ready.`,
      input.offer,
      input.primaryCta,
      "offer",
      input
    ),
  ];

  return {
    evidence: {
      finding,
      pageUrl: input.opportunity.audit_page_url,
      observed: input.opportunity.evidence,
    },
    hypothesis: `If ${input.brand.name} presents “${input.offer}” to ${input.audience} with a clearer ${input.primaryCta.toLowerCase()} path, then the selected conversion metric should improve because the campaign directly resolves the documented “${input.opportunity.title}” gap.`,
    messageHierarchy: [
      input.objective,
      input.offer,
      input.opportunity.recommended_action,
      input.primaryCta,
    ],
    guardrails: [
      proofBoundary,
      `Maintain this voice: ${voice}.`,
      ...(input.brand.sourceKit?.voiceDonts ?? []).map((item) => `Avoid: ${item}`),
      "Do not imply guaranteed outcomes or fabricate customer results.",
      "Do not publish until the exact campaign and post versions are approved.",
    ],
    deliverables: [
      ...posts.map((post) => `Social post: ${post.angle}`),
      "Three square campaign graphics",
      "Channel-specific copy variants",
      "Tracked destination URL and performance baseline",
    ],
    posts,
    measurementPlan: {
      metricKey: "qualified_leads",
      metricLabel: "Qualified leads",
      unit: "count",
      direction: "increase",
      rationale:
        "Qualified leads connect the campaign action to commercial intent without overstating downstream revenue attribution.",
    },
  };
}
