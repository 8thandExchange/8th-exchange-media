import crypto from "node:crypto";
import type { GrowthCampaign, GrowthOpportunity } from "@/lib/growth/types";
import type {
  CaptionSetContent,
  CreativeArtifactType,
  CreativeContent,
  CreativeProject,
  CreativeRightsAsset,
  HookSetContent,
  ProductionBriefContent,
  ProductionType,
  RepurposedContent,
  ScriptContent,
  SeoBriefContent,
  ShotListContent,
  StoryboardContent,
  ThumbnailBriefContent,
} from "@/lib/production/types";

export const CREATIVE_RECIPE_VERSION = "2026-08-v3";
export const CREATIVE_QA_VERSION = "2026-08-v3";

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortValue(item)])
    );
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function contentHash(value: unknown): string {
  return crypto.createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function compact(value: string, limit: number): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length <= limit) return cleaned;
  const slice = cleaned.slice(0, limit - 1);
  return `${slice.slice(0, slice.lastIndexOf(" ") || slice.length)}…`;
}

function publicLine(value: string): string {
  return compact(
    value
      .replace(/\b(we found|the evidence showed|documented|rule_key)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim(),
    160
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

function secondsFor(value: string): number {
  const words = value.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 2.45));
}

function trackedUrl(destination: string, channel: string, projectKey: string): string {
  const url = new URL(destination);
  if (!url.searchParams.has("utm_source")) url.searchParams.set("utm_source", channel);
  if (!url.searchParams.has("utm_medium")) url.searchParams.set("utm_medium", "creative_production");
  if (!url.searchParams.has("utm_campaign")) {
    url.searchParams.set("utm_campaign", `production-${projectKey.slice(0, 8)}`);
  }
  return url.toString();
}

export interface CreativePackageInput {
  campaign: GrowthCampaign;
  opportunity: GrowthOpportunity | null;
  productionType: ProductionType;
  targetDurationSeconds: number;
  brandKeywords: string[];
  internalLinks?: Array<{ id: string; url: string; title: string | null }>;
}

export interface GeneratedArtifact {
  artifactType: CreativeArtifactType;
  title: string;
  schemaKey: string;
  sortOrder: number;
  content: CreativeContent;
  required: boolean;
}

export function generateCreativePackage(input: CreativePackageInput): GeneratedArtifact[] {
  const { campaign, opportunity } = input;
  const evidence = {
    opportunityId: opportunity?.id ?? null,
    title: opportunity?.title ?? campaign.name,
    finding: campaign.brief.evidence.finding,
    observed: campaign.brief.evidence.observed,
    pageUrl: campaign.brief.evidence.pageUrl ?? null,
  };
  const brief: ProductionBriefContent = {
    objective: campaign.objective,
    audience: campaign.audience,
    offer: campaign.offer,
    evidence,
    messageHierarchy: campaign.brief.messageHierarchy,
    guardrails: campaign.brief.guardrails,
    primaryCta: campaign.primary_cta,
    destinationUrl: campaign.destination_url,
    deliverables: [
      `${input.targetDurationSeconds}-second master`,
      "Three platform cutdowns",
      "Caption and thumbnail package",
      "Shot plan and storyboard",
      "SEO distribution brief",
    ],
  };

  const hooks: HookSetContent = {
    hooks: [
      {
        id: "hook-problem",
        framework: "problem",
        spokenText: compact(
          `If ${campaign.audience} cannot see the next step, they are already gone.`,
          180
        ),
        onScreenText: "If the next step is unclear, they leave.",
        intendedEmotion: "recognition",
        estimatedSeconds: 4,
        selected: true,
      },
      {
        id: "hook-question",
        framework: "question",
        spokenText: compact(
          `What would change if ${campaign.audience} understood ${campaign.offer} in a single look?`,
          180
        ),
        onScreenText: "What if the value was obvious?",
        intendedEmotion: "curiosity",
        estimatedSeconds: 4,
        selected: false,
      },
      {
        id: "hook-contrarian",
        framework: "contrarian",
        spokenText: "More content is not the work. A cleaner decision is.",
        onScreenText: "More content is not the work.",
        intendedEmotion: "surprise",
        estimatedSeconds: 4,
        selected: false,
      },
      {
        id: "hook-proof",
        framework: "proof",
        spokenText: compact(
          `We are not guessing. One page condition is getting in the way: ${publicLine(campaign.brief.evidence.finding)}`,
          190
        ),
        onScreenText: "One condition. One fix.",
        intendedEmotion: "confidence",
        estimatedSeconds: 5,
        selected: false,
      },
      {
        id: "hook-demonstration",
        framework: "demonstration",
        spokenText: `Here is the path we want ${campaign.audience} to take — without the extra thinking.`,
        onScreenText: "Show the path.",
        intendedEmotion: "interest",
        estimatedSeconds: 4,
        selected: false,
      },
    ],
  };

  const selectedHook = hooks.hooks.find((hook) => hook.selected)!;
  const rawBeats = [
    {
      id: "beat-hook",
      role: "hook" as const,
      spokenCopy: selectedHook.spokenText,
      onScreenCopy: selectedHook.onScreenText,
      visualIntent: "Direct-to-camera, then a quiet lockup. No stock smile. No kinetic junk.",
    },
    {
      id: "beat-problem",
      role: "problem" as const,
      spokenCopy: compact(
        `${campaign.audience} should not have to hunt. ${publicLine(campaign.brief.evidence.finding)}.`,
        230
      ),
      onScreenCopy: "The path is working too hard.",
      visualIntent: "Show the real moment of hesitation — the page, the lobby, the phone — not a recreation of 'confusion'.",
    },
    {
      id: "beat-proof",
      role: "proof" as const,
      spokenCopy: `The fix is specific: ${compact(opportunity?.recommended_action ?? campaign.brief.messageHierarchy[2] ?? campaign.objective, 210)}`,
      onScreenCopy: "One specific fix.",
      visualIntent: "Screen capture or a real demonstration. Annotate lightly. Do not stage results.",
    },
    {
      id: "beat-solution",
      role: "solution" as const,
      spokenCopy: `${campaign.offer} gives ${campaign.audience} a practical path to ${campaign.objective.toLowerCase()}.`,
      onScreenCopy: compact(campaign.offer, 70),
      visualIntent: "The people and the work. Hands, tools, rooms that actually exist.",
    },
    {
      id: "beat-cta",
      role: "cta" as const,
      spokenCopy: `${campaign.primary_cta}. That is the next step.`,
      onScreenCopy: campaign.primary_cta,
      visualIntent: "Hold a finished end card long enough to read. Logo small. Type large. No extra words.",
    },
  ];
  const naturalDuration = rawBeats.reduce((sum, beat) => sum + secondsFor(beat.spokenCopy), 0);
  const durationRatio = input.targetDurationSeconds / Math.max(naturalDuration, 1);
  const script: ScriptContent = {
    format: input.productionType,
    targetDurationSeconds: input.targetDurationSeconds,
    selectedHookId: selectedHook.id,
    beats: rawBeats.map((beat) => ({
      ...beat,
      estimatedSeconds: Math.max(2, Math.round(secondsFor(beat.spokenCopy) * durationRatio)),
    })),
    disclaimers: [
      "Use only verified client claims and approved customer results.",
      "Generated concept imagery is reference-only until rights are cleared.",
    ],
  };

  const shots: ShotListContent = {
    shots: script.beats.flatMap((beat, index) => {
      const primary = {
        id: `shot-${beat.id}`,
        beatId: beat.id,
        shotNumber: index * 2 + 1,
        framing:
          beat.role === "hook" || beat.role === "cta"
            ? ("talking_head" as const)
            : beat.role === "proof"
              ? ("screen" as const)
              : ("medium" as const),
        subject: beat.role === "proof" ? "Documented evidence or product experience" : "Primary spokesperson",
        action: beat.visualIntent,
        location: beat.role === "proof" ? "Screen capture or working environment" : "Primary brand location",
        audio: "voiceover" as const,
        equipment: "Camera, stable support, key light, clean microphone",
        props: beat.role === "solution" ? ["Product, process, or deliverable"] : [],
        talent: ["Approved spokesperson"],
        estimatedSeconds: beat.estimatedSeconds,
        priority: "required" as const,
      };
      if (!["problem", "solution"].includes(beat.role)) return [primary];
      return [
        primary,
        {
          id: `shot-${beat.id}-broll`,
          beatId: beat.id,
          shotNumber: index * 2 + 2,
          framing: "detail" as const,
          subject: beat.role === "problem" ? "The friction in context" : "The work in progress",
          action: "Capture a real, specific detail that supports the narration without duplicating it.",
          location: "Client environment",
          audio: "ambient" as const,
          equipment: "Camera or phone, stabilized",
          props: [],
          talent: [],
          estimatedSeconds: Math.min(4, beat.estimatedSeconds),
          priority: "optional" as const,
        },
      ];
    }),
  };

  const storyboard: StoryboardContent = {
    frames: shots.shots.map((shot, index) => ({
      id: `frame-${shot.id}`,
      shotId: shot.id,
      frameNumber: index + 1,
      compositionNote: `${shot.framing.replace("_", " ")} composition of ${shot.subject}. ${shot.action}`,
      overlayText: script.beats.find((beat) => beat.id === shot.beatId)?.onScreenCopy ?? "",
      conceptOnly: true,
    })),
  };

  const primaryKeyword =
    input.brandKeywords[0] ??
    opportunity?.title.toLowerCase().replace(/[^a-z0-9 ]/g, "") ??
    campaign.offer.toLowerCase();
  const seo: SeoBriefContent = {
    primaryKeyword: {
      term: compact(primaryKeyword, 80),
      source: input.brandKeywords[0] ? "approved brand kit" : "Growth OS campaign evidence",
    },
    secondaryKeywords: input.brandKeywords.slice(1, 7).map((term) => ({
      term,
      source: "approved brand kit",
    })),
    searchIntent: "commercial",
    audienceQuestion: `How can ${campaign.audience} achieve ${campaign.objective.toLowerCase()}?`,
    proposedSlug: slugify(campaign.offer),
    titleOptions: [
      compact(`${campaign.offer} for ${campaign.audience}`, 60),
      compact(`${campaign.objective}: A practical guide`, 60),
      compact(`${opportunity?.title ?? campaign.name} | ${campaign.offer}`, 60),
    ],
    metaDescriptions: [
      compact(`${campaign.offer} helps ${campaign.audience} move toward ${campaign.objective.toLowerCase()}. ${campaign.primary_cta}.`, 155),
      compact(`See the evidence, approach, and next step behind ${campaign.offer}. Built for ${campaign.audience}.`, 155),
    ],
    outline: [
      { level: 2, heading: "The problem the evidence revealed", purpose: "Connect the page finding to audience friction." },
      { level: 2, heading: `What ${campaign.audience} actually needs`, purpose: "Frame the desired outcome without exaggeration." },
      { level: 2, heading: `How ${campaign.offer} works`, purpose: "Explain the mechanism and process." },
      { level: 2, heading: "Proof and practical expectations", purpose: "Use only sourced proof and transparent limitations." },
      { level: 2, heading: "The next step", purpose: `Lead naturally to ${campaign.primary_cta}.` },
    ],
    internalLinks: (input.internalLinks ?? []).slice(0, 5).map((page) => ({
      url: page.url,
      anchor: page.title || "related resource",
      sourceAuditPageId: page.id,
    })),
    schemaRecommendations: ["Organization", "Service", "FAQPage when visible FAQs are present"],
    faqQuestions: [
      `Who is ${campaign.offer} designed for?`,
      `What happens after I ${campaign.primary_cta.toLowerCase()}?`,
      "What information or access is needed to begin?",
      "How will progress be measured?",
    ],
  };

  const captions: CaptionSetContent = {
    variants: campaign.channels.flatMap((channel) =>
      campaign.brief.posts.map((post) => ({
        key: `${post.key}-${channel}`,
        channel,
        copy: post.variants[channel] ?? post.summary,
        cta: campaign.primary_cta,
        trackedUrl: trackedUrl(campaign.destination_url, channel, campaign.id),
        altText: post.altText,
      }))
    ),
  };

  const thumbnail: ThumbnailBriefContent = {
    headline: compact(campaign.brief.posts[1]?.graphicHeadline ?? campaign.offer, 62),
    visualFocus: "One expressive human or tangible proof point—not a generic collage.",
    composition: "Subject on one third, high-contrast headline on the open side, logo subordinate.",
    contrastPlan: "Use the frozen brand palette with WCAG-readable headline contrast.",
    altText: `${campaign.name}: ${compact(opportunity?.title ?? campaign.offer, 110)}`,
  };

  const repurposed: RepurposedContent = {
    derivatives: [
      { key: "reel", format: "reel", purpose: "Primary awareness and conversion asset", sourceBeatIds: script.beats.map((beat) => beat.id), copy: campaign.brief.posts[0]?.summary ?? campaign.objective },
      { key: "story", format: "story", purpose: "Fast hook and action", sourceBeatIds: ["beat-hook", "beat-cta"], copy: `${selectedHook.onScreenText} ${campaign.primary_cta}.` },
      { key: "carousel", format: "carousel", purpose: "Explain the evidence and intervention", sourceBeatIds: ["beat-problem", "beat-proof", "beat-solution"], copy: campaign.brief.messageHierarchy.join(" → ") },
      { key: "email", format: "email", purpose: "Nurture interested prospects", sourceBeatIds: ["beat-problem", "beat-solution", "beat-cta"], copy: `${campaign.brief.evidence.finding}\n\n${campaign.offer}\n\n${campaign.primary_cta}: ${campaign.destination_url}` },
      { key: "article", format: "article", purpose: "Search and sales enablement", sourceBeatIds: script.beats.map((beat) => beat.id), copy: seo.outline.map((item) => item.heading).join("\n") },
      { key: "sales", format: "sales_talking_points", purpose: "Keep sales language aligned", sourceBeatIds: ["beat-problem", "beat-proof", "beat-solution"], copy: campaign.brief.messageHierarchy.join("\n") },
    ],
  };

  return [
    { artifactType: "production_brief", title: "Production Brief", schemaKey: "production-brief", sortOrder: 10, content: brief, required: true },
    { artifactType: "hook_set", title: "Hook Library", schemaKey: "hook-set", sortOrder: 20, content: hooks, required: true },
    { artifactType: "script", title: "Script Lab", schemaKey: "timed-script", sortOrder: 30, content: script, required: true },
    { artifactType: "shot_list", title: "Shot Plan", schemaKey: "shot-list", sortOrder: 40, content: shots, required: true },
    { artifactType: "storyboard", title: "Storyboard", schemaKey: "storyboard", sortOrder: 50, content: storyboard, required: true },
    { artifactType: "seo_brief", title: "SEO Brief", schemaKey: "seo-brief", sortOrder: 60, content: seo, required: true },
    { artifactType: "caption_set", title: "Channel Copy", schemaKey: "caption-set", sortOrder: 70, content: captions, required: true },
    { artifactType: "thumbnail_brief", title: "Thumbnail Brief", schemaKey: "thumbnail-brief", sortOrder: 80, content: thumbnail, required: true },
    { artifactType: "repurposed_content", title: "Repurposing Matrix", schemaKey: "repurposing", sortOrder: 90, content: repurposed, required: false },
  ];
}

export interface QaFinding {
  ruleKey: string;
  severity: "blocking" | "warning" | "advisory";
  status: "passed" | "failed";
  message: string;
  evidence: Record<string, unknown>;
}

function artifactContent<T extends CreativeContent>(
  artifacts: Array<{ artifactType: CreativeArtifactType; content: CreativeContent }>,
  type: CreativeArtifactType
): T | null {
  return (artifacts.find((artifact) => artifact.artifactType === type)?.content as T | undefined) ?? null;
}

export function runCreativeQa(input: {
  project: Pick<CreativeProject, "primary_cta" | "destination_url" | "target_duration_seconds" | "channels">;
  artifacts: Array<{ artifactType: CreativeArtifactType; content: CreativeContent }>;
  rights: CreativeRightsAsset[];
}): QaFinding[] {
  const brief = artifactContent<ProductionBriefContent>(input.artifacts, "production_brief");
  const hooks = artifactContent<HookSetContent>(input.artifacts, "hook_set");
  const script = artifactContent<ScriptContent>(input.artifacts, "script");
  const shots = artifactContent<ShotListContent>(input.artifacts, "shot_list");
  const storyboard = artifactContent<StoryboardContent>(input.artifacts, "storyboard");
  const seo = artifactContent<SeoBriefContent>(input.artifacts, "seo_brief");
  const captions = artifactContent<CaptionSetContent>(input.artifacts, "caption_set");
  const duration = script?.beats.reduce((sum, beat) => sum + beat.estimatedSeconds, 0) ?? 0;
  const requiredBeatIds = new Set(script?.beats.map((beat) => beat.id) ?? []);
  const coveredBeatIds = new Set(shots?.shots.filter((shot) => shot.priority === "required").map((shot) => shot.beatId) ?? []);
  const pendingRights = input.rights.filter((asset) => asset.asset_type !== "reference" && asset.status !== "cleared");
  const expiredRights = input.rights.filter(
    (asset) => asset.expires_at && new Date(asset.expires_at).getTime() < Date.now()
  );
  const scopeViolations = input.rights.filter(
    (asset) =>
      asset.status === "cleared" &&
      asset.allowed_channels.length > 0 &&
      input.project.channels.some((channel) => !asset.allowed_channels.includes(channel))
  );

  const findings: QaFinding[] = [
    {
      ruleKey: "brief-complete",
      severity: "blocking",
      status: brief?.objective && brief.audience && brief.offer && brief.primaryCta ? "passed" : "failed",
      message: "Production brief includes objective, audience, offer, and CTA.",
      evidence: { hasBrief: Boolean(brief) },
    },
    {
      ruleKey: "hook-selection",
      severity: "blocking",
      status: hooks && hooks.hooks.length >= 3 && hooks.hooks.filter((hook) => hook.selected).length === 1 ? "passed" : "failed",
      message: "Hook library has at least three options and exactly one selected hook.",
      evidence: { count: hooks?.hooks.length ?? 0, selected: hooks?.hooks.filter((hook) => hook.selected).length ?? 0 },
    },
    {
      ruleKey: "script-duration",
      severity: "blocking",
      status:
        duration >= input.project.target_duration_seconds * 0.75 &&
        duration <= input.project.target_duration_seconds * 1.25
          ? "passed"
          : "failed",
      message: `Script timing stays within 25% of the ${input.project.target_duration_seconds}-second target.`,
      evidence: { estimatedSeconds: duration, targetSeconds: input.project.target_duration_seconds },
    },
    {
      ruleKey: "shot-coverage",
      severity: "blocking",
      status: [...requiredBeatIds].every((id) => coveredBeatIds.has(id)) ? "passed" : "failed",
      message: "Every script beat has a required shot.",
      evidence: { beats: requiredBeatIds.size, covered: coveredBeatIds.size },
    },
    {
      ruleKey: "storyboard-coverage",
      severity: "blocking",
      status:
        shots &&
        storyboard &&
        shots.shots.every((shot) => storyboard.frames.some((frame) => frame.shotId === shot.id))
          ? "passed"
          : "failed",
      message: "Every planned shot has a storyboard frame.",
      evidence: { shots: shots?.shots.length ?? 0, frames: storyboard?.frames.length ?? 0 },
    },
    {
      ruleKey: "claims-guardrail",
      severity: "blocking",
      status: brief?.guardrails.some((rule) => /claim|fabricat|guarantee/i.test(rule)) ? "passed" : "failed",
      message: "The package retains explicit unsupported-claim guardrails.",
      evidence: { guardrailCount: brief?.guardrails.length ?? 0 },
    },
    {
      ruleKey: "destination",
      severity: "blocking",
      status: (() => {
        try {
          return ["http:", "https:"].includes(new URL(input.project.destination_url).protocol) ? "passed" : "failed";
        } catch {
          return "failed";
        }
      })(),
      message: "The distribution destination is a valid public web URL.",
      evidence: { destination: input.project.destination_url },
    },
    {
      ruleKey: "rights-clearance",
      severity: "blocking",
      status: pendingRights.length === 0 && expiredRights.length === 0 ? "passed" : "failed",
      message: "Every registered production asset is cleared and unexpired.",
      evidence: { pending: pendingRights.map((asset) => asset.label), expired: expiredRights.map((asset) => asset.label) },
    },
    {
      ruleKey: "rights-channel-scope",
      severity: "blocking",
      status: scopeViolations.length === 0 ? "passed" : "failed",
      message: "Cleared asset licenses cover every selected distribution channel.",
      evidence: {
        channels: input.project.channels,
        invalidAssets: scopeViolations.map((asset) => ({
          label: asset.label,
          allowedChannels: asset.allowed_channels,
        })),
      },
    },
    {
      ruleKey: "seo-metadata",
      severity: "warning",
      status:
        seo &&
        seo.titleOptions.every((title) => title.length <= 60) &&
        seo.metaDescriptions.every((description) => description.length <= 160)
          ? "passed"
          : "failed",
      message: "SEO title and description options stay within preferred lengths.",
      evidence: {
        titleLengths: seo?.titleOptions.map((title) => title.length) ?? [],
        descriptionLengths: seo?.metaDescriptions.map((description) => description.length) ?? [],
      },
    },
    {
      ruleKey: "channel-copy",
      severity: "blocking",
      status:
        captions && input.project.channels.every((channel) => captions.variants.some((item) => item.channel === channel))
          ? "passed"
          : "failed",
      message: "Every selected channel has tracked copy and accessible alt text.",
      evidence: { channels: input.project.channels },
    },
  ];
  return findings;
}
