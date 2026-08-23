import type { BrandSnapshot, CampaignPostDraft, GrowthOpportunity } from "@/lib/growth/types";

export interface CampaignCopyInput {
  opportunity: GrowthOpportunity;
  brand: BrandSnapshot;
  objective: string;
  audience: string;
  offer: string;
  primaryCta: string;
  destinationUrl: string;
  channels: string[];
}

const AUDIT_VOICE =
  /\b(we found|gap:|evidence showed|documented|recognized cta|http \d{3}|rule_key|audit)\b/i;

export function trimSentence(value: string, limit: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  const clipped = cleaned.slice(0, limit - 1);
  const atWord = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, atWord > 12 ? atWord : clipped.length)}…`;
}

export function breakDisplayLines(text: string, maxLineChars = 18): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  if (words.length <= 2 || text.length <= maxLineChars) return [words.join(" ")];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (current && next.length > maxLineChars && lines.length < 2) {
      lines.push(current);
      current = word;
      continue;
    }
    current = next;
  }
  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function publicFriction(ruleKey: string): { headline: string; kicker: string; line: string } {
  switch (ruleKey) {
    case "missing-cta":
      return {
        headline: "Make the next step obvious.",
        kicker: "The friction",
        line: "the next step is easy to miss",
      };
    case "missing-low-friction-capture":
      return {
        headline: "Give interest a place to land.",
        kicker: "The friction",
        line: "there is no simple way to stay in the conversation",
      };
    case "missing-title":
    case "h1-structure":
      return {
        headline: "Name the work clearly.",
        kicker: "The signal",
        line: "the page does not name the work clearly",
      };
    case "missing-description":
    case "duplicate-descriptions":
    case "duplicate-titles":
      return {
        headline: "Say one thing well.",
        kicker: "The signal",
        line: "the message repeats itself instead of deciding",
      };
    case "thin-content":
      return {
        headline: "Earn the click that follows.",
        kicker: "The substance",
        line: "the page does not give enough to act on",
      };
    case "missing-og-image":
      return {
        headline: "Look finished before the click.",
        kicker: "The first impression",
        line: "shared links arrive without a finished image",
      };
    case "missing-analytics":
      return {
        headline: "Measure what you ask for.",
        kicker: "The readout",
        line: "the work is running without a clear readout",
      };
    case "missing-structured-data":
    case "missing-image-alt":
      return {
        headline: "Help the right people find it.",
        kicker: "The discovery",
        line: "the page is harder to find than it should be",
      };
    case "broken-internal-links":
    case "page-unavailable":
    case "noindex":
      return {
        headline: "Do not lose the people already looking.",
        kicker: "The path",
        line: "part of the path is broken or hidden",
      };
    default:
      return {
        headline: "Remove the friction.",
        kicker: "The work",
        line: "the path from interest to action is unclear",
      };
  }
}

function insightFor(category: string): { headline: string; kicker: string; line: string } {
  switch (category) {
    case "seo":
      return {
        headline: "Be found for the right reason.",
        kicker: "The principle",
        line: "Discovery only matters when the page can finish the thought.",
      };
    case "measurement":
      return {
        headline: "What gets measured gets chosen.",
        kicker: "The principle",
        line: "A clearer readout makes the next decision cheaper.",
      };
    case "content":
      return {
        headline: "Useful pages create useful demand.",
        kicker: "The principle",
        line: "People stay when the page answers the question they arrived with.",
      };
    default:
      return {
        headline: "Clarity creates momentum.",
        kicker: "The principle",
        line: "Good marketing removes uncertainty before it asks for trust.",
      };
  }
}

function offerHeadline(offer: string): string {
  const cleaned = offer.replace(/\s+/g, " ").trim().replace(/[.]+$/, "");
  return trimmedTitle(cleaned, 46);
}

function trimmedTitle(value: string, limit: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  return trimSentence(cleaned, limit).replace(/…$/, "");
}

function trackedUrl(destination: string, channel: string, campaignKey: string): string {
  const tracked = new URL(destination);
  if (!tracked.searchParams.has("utm_source")) tracked.searchParams.set("utm_source", channel);
  if (!tracked.searchParams.has("utm_medium")) {
    tracked.searchParams.set("utm_medium", "organic_social");
  }
  if (!tracked.searchParams.has("utm_campaign")) {
    tracked.searchParams.set("utm_campaign", `growth-${campaignKey.slice(0, 8)}`);
  }
  return tracked.toString();
}

function channelCopy(
  channel: string,
  paragraphs: string[],
  cta: string,
  destination: string,
  campaignKey: string
): string {
  const body = paragraphs.filter(Boolean).join("\n\n");
  const url = trackedUrl(destination, channel, campaignKey);
  if (channel === "x" || channel === "twitter") {
    return trimSentence(`${paragraphs[0] ?? body} ${cta}: ${url}`, 275);
  }
  if (channel === "instagram") {
    return `${body}\n\n${cta}. Link in bio.`;
  }
  if (channel === "linkedin") {
    return `${body}\n\n${cta}\n${destination}`;
  }
  return `${body}\n\n${cta}: ${url}`;
}

export function writeCampaignPosts(input: CampaignCopyInput): CampaignPostDraft[] {
  const friction = publicFriction(input.opportunity.rule_key);
  const insight = insightFor(input.opportunity.category);
  const offer = offerHeadline(input.offer);
  const audience = input.audience.replace(/\s+/g, " ").trim();
  const cta = input.primaryCta.replace(/\s+/g, " ").trim();

  const problemSummary = [
    `${audience} decide in seconds. If ${friction.line}, the right people leave — even when the offer is right.`,
    `We are putting one clear path in front of them.`,
  ];
  const insightSummary = [
    insight.line,
    `For ${input.brand.name}, that means a cleaner decision: ${trimSentence(input.opportunity.recommended_action, 160)}`,
  ];
  const offerSummary = [
    `${offer} is built for ${audience}.`,
    `The aim is ${input.objective.replace(/\s+/g, " ").trim().replace(/[.]$/, "")}. If that is the outcome you need, the next step is ready.`,
  ];

  return [
    makePost({
      key: "problem",
      angle: "Name the friction",
      paragraphs: problemSummary,
      graphicHeadline: friction.headline,
      graphicKicker: friction.kicker,
      graphicSupporting: audience,
      template: "statement",
      input,
    }),
    makePost({
      key: "insight",
      angle: "State the principle",
      paragraphs: insightSummary,
      graphicHeadline: insight.headline,
      graphicKicker: insight.kicker,
      graphicSupporting: input.brand.tagline,
      template: "insight",
      input,
    }),
    makePost({
      key: "offer",
      angle: "Make the ask",
      paragraphs: offerSummary,
      graphicHeadline: offer,
      graphicKicker: "The offer",
      graphicSupporting: cta,
      template: "offer",
      input,
    }),
  ];
}

function makePost(input: {
  key: string;
  angle: string;
  paragraphs: string[];
  graphicHeadline: string;
  graphicKicker: string;
  graphicSupporting: string;
  template: CampaignPostDraft["assetTemplate"];
  input: CampaignCopyInput;
}): CampaignPostDraft {
  const summary = input.paragraphs.join(" ");
  return {
    key: input.key,
    angle: input.angle,
    summary,
    variants: Object.fromEntries(
      input.input.channels.map((channel) => [
        channel,
        channelCopy(
          channel,
          input.paragraphs,
          input.input.primaryCta,
          input.input.destinationUrl,
          input.input.opportunity.id
        ),
      ])
    ),
    assetTemplate: input.template,
    graphicHeadline: trimSentence(input.graphicHeadline, 92),
    graphicKicker: trimSentence(input.graphicKicker, 38),
    graphicSupporting: trimSentence(input.graphicSupporting, 72),
    altText: `${input.input.brand.name} graphic: ${trimSentence(input.graphicHeadline, 130)}`,
  };
}

export function assertPublicVoice(value: string): boolean {
  return !AUDIT_VOICE.test(value);
}

export function publicOpportunityLine(opportunity: Pick<GrowthOpportunity, "rule_key">): string {
  return publicFriction(opportunity.rule_key).line;
}
