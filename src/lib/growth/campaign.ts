import { writeCampaignPosts } from "@/lib/growth/copy";
import type { CampaignCopyInput } from "@/lib/growth/copy";
import type { CampaignBrief } from "@/lib/growth/types";

export type CampaignGenerationInput = CampaignCopyInput;

export function generateCampaignBrief(input: CampaignGenerationInput): CampaignBrief {
  const posts = writeCampaignPosts(input);

  return {
    evidence: {
      finding: input.opportunity.description,
      pageUrl: input.opportunity.audit_page_url,
      observed: input.opportunity.evidence,
    },
    hypothesis: `If ${input.brand.name} presents “${input.offer}” to ${input.audience} with a clearer ${input.primaryCta.toLowerCase()} path, then the selected conversion metric should improve because the campaign resolves the documented “${input.opportunity.title}” gap.`,
    messageHierarchy: [
      input.objective,
      input.offer,
      input.opportunity.recommended_action,
      input.primaryCta,
    ],
    guardrails: [
      "Use only claims present in approved brand materials or evidence supplied by the client.",
      `Maintain this voice: ${input.brand.voiceTone}.`,
      ...(input.brand.sourceKit?.voiceDonts ?? []).map((item) => `Avoid: ${item}`),
      "Do not imply guaranteed outcomes or fabricate customer results.",
      "Do not publish until the exact campaign and post versions are approved.",
      "Public copy must not mention audits, scores, crawlers, or internal rule keys.",
    ],
    deliverables: [
      ...posts.map((post) => `Social post: ${post.angle}`),
      "Nine editorial campaign graphics",
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
