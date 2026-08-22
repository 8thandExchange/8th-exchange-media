import { describe, expect, it } from "vitest";
import {
  canonicalJson,
  contentHash,
  generateCreativePackage,
  runCreativeQa,
} from "@/lib/production/generation";
import { CREATIVE_TRANSITIONS } from "@/lib/production/service";
import type { GrowthCampaign, GrowthOpportunity } from "@/lib/growth/types";
import type {
  CreativeProject,
  CreativeRightsAsset,
  ScriptContent,
  ShotListContent,
  StoryboardContent,
} from "@/lib/production/types";

const campaign: GrowthCampaign = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  client_id: null,
  opportunity_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  name: "Clarity Campaign",
  status: "approved",
  objective: "Increase qualified inquiries",
  audience: "Local business owners",
  offer: "A practical Growth Map",
  primary_cta: "Book a Growth Map",
  destination_url: "https://example.com/growth-map",
  channels: ["facebook", "instagram", "linkedin"],
  social_account_ids: [],
  brief: {
    evidence: {
      finding: "Visitors could not find a clear next action.",
      pageUrl: "https://example.com/",
      observed: { recognizedCtas: [] },
    },
    hypothesis: "A clearer decision path should increase qualified inquiries.",
    messageHierarchy: [
      "Increase qualified inquiries",
      "A practical Growth Map",
      "Add one decisive next action",
      "Book a Growth Map",
    ],
    guardrails: [
      "Use only verified claims.",
      "Do not fabricate customer results or guarantee outcomes.",
    ],
    deliverables: ["Three posts"],
    posts: [
      {
        key: "problem",
        angle: "Problem",
        summary: "A clear next step removes uncertainty.",
        variants: {
          facebook: "A clear next step removes uncertainty.",
          instagram: "A clear next step removes uncertainty.",
          linkedin: "A clear next step removes uncertainty.",
        },
        assetTemplate: "statement",
        graphicHeadline: "Clarity creates momentum.",
        graphicKicker: "The evidence",
        altText: "Clarity creates momentum.",
      },
      {
        key: "insight",
        angle: "Insight",
        summary: "Good marketing removes uncertainty.",
        variants: {
          facebook: "Good marketing removes uncertainty.",
          instagram: "Good marketing removes uncertainty.",
          linkedin: "Good marketing removes uncertainty.",
        },
        assetTemplate: "insight",
        graphicHeadline: "Remove uncertainty.",
        graphicKicker: "The principle",
        altText: "Remove uncertainty.",
      },
      {
        key: "offer",
        angle: "Offer",
        summary: "The Growth Map creates a practical next step.",
        variants: {
          facebook: "The Growth Map creates a practical next step.",
          instagram: "The Growth Map creates a practical next step.",
          linkedin: "The Growth Map creates a practical next step.",
        },
        assetTemplate: "offer",
        graphicHeadline: "A practical Growth Map",
        graphicKicker: "Book now",
        altText: "A practical Growth Map",
      },
    ],
    measurementPlan: {
      metricKey: "qualified_leads",
      metricLabel: "Qualified leads",
      unit: "count",
      direction: "increase",
      rationale: "Commercial intent",
    },
  },
  brief_version: 1,
  generator: "rules",
  generation_meta: {},
  client_visible: true,
  review_note: null,
  approved_by: "staff",
  approved_at: "2026-08-22T00:00:00.000Z",
  created_at: "2026-08-22T00:00:00.000Z",
  updated_at: "2026-08-22T00:00:00.000Z",
};

const opportunity: GrowthOpportunity = {
  id: campaign.opportunity_id!,
  client_id: null,
  audit_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  audit_page_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  audit_page_url: "https://example.com/",
  fingerprint: "fingerprint",
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
  status: "selected",
  created_at: "2026-08-22T00:00:00.000Z",
  updated_at: "2026-08-22T00:00:00.000Z",
};

function generated() {
  return generateCreativePackage({
    campaign,
    opportunity,
    productionType: "short_video",
    targetDurationSeconds: 30,
    brandKeywords: ["marketing strategy", "Augusta marketing"],
    internalLinks: [
      {
        id: opportunity.audit_page_id!,
        url: opportunity.audit_page_url!,
        title: "Growth Map",
      },
    ],
  });
}

describe("Creative Production recipes", () => {
  it("generates the complete deterministic production package", () => {
    const artifacts = generated();
    expect(artifacts.map((item) => item.artifactType)).toEqual([
      "production_brief",
      "hook_set",
      "script",
      "shot_list",
      "storyboard",
      "seo_brief",
      "caption_set",
      "thumbnail_brief",
      "repurposed_content",
    ]);
    expect(contentHash(artifacts)).toBe(contentHash(generated()));
  });

  it("canonicalizes object keys before hashing", () => {
    expect(canonicalJson({ b: 2, a: 1 })).toBe(canonicalJson({ a: 1, b: 2 }));
    expect(contentHash({ b: 2, a: 1 })).toBe(contentHash({ a: 1, b: 2 }));
  });

  it("retains script-to-shot-to-storyboard lineage", () => {
    const artifacts = generated();
    const script = artifacts.find((item) => item.artifactType === "script")!.content as ScriptContent;
    const shots = artifacts.find((item) => item.artifactType === "shot_list")!.content as ShotListContent;
    const storyboard = artifacts.find((item) => item.artifactType === "storyboard")!.content as StoryboardContent;
    expect(script.beats.every((beat) => shots.shots.some((shot) => shot.beatId === beat.id))).toBe(true);
    expect(shots.shots.every((shot) => storyboard.frames.some((frame) => frame.shotId === shot.id))).toBe(true);
    expect(storyboard.frames.every((frame) => frame.conceptOnly)).toBe(true);
  });

  it("never invents SEO volume or rankings", () => {
    const seo = generated().find((item) => item.artifactType === "seo_brief")!.content;
    expect(JSON.stringify(seo)).not.toMatch(/searchVolume|difficulty|ranking/i);
    expect(JSON.stringify(seo)).toContain("approved brand kit");
  });
});

describe("Creative Production governance", () => {
  const project = {
    id: "project",
    client_id: null,
    growth_campaign_id: campaign.id,
    name: "Production",
    production_type: "short_video",
    status: "in_production",
    objective: campaign.objective,
    audience: campaign.audience,
    offer: campaign.offer,
    primary_cta: campaign.primary_cta,
    destination_url: campaign.destination_url,
    channels: campaign.channels,
    target_duration_seconds: 30,
    brand_snapshot: {
      name: "Example",
      tagline: "Useful work",
      primary: "#0b1b3d",
      secondary: "#f4efe3",
      accent: "#c9a84c",
      background: "#f4efe3",
      foreground: "#0b1b3d",
      headingFont: "Georgia",
      bodyFont: "Arial",
      voiceTone: "Clear",
    },
    source_manifest: {},
    client_visible: false,
    owner_label: "8E Studio",
    due_at: null,
    lock_version: 1,
    review_note: null,
    approved_by: null,
    approved_at: null,
    created_by: "staff",
    created_at: "2026-08-22T00:00:00.000Z",
    updated_at: "2026-08-22T00:00:00.000Z",
  } satisfies CreativeProject;

  it("passes deterministic pre-production QA for a complete package", () => {
    const artifacts = generated().map((item) => ({
      artifactType: item.artifactType,
      content: item.content,
    }));
    const results = runCreativeQa({ project, artifacts, rights: [] });
    expect(results.filter((item) => item.severity === "blocking" && item.status === "failed")).toEqual([]);
  });

  it("blocks pending or expired production rights", () => {
    const rights = [
      {
        id: "rights",
        project_id: project.id,
        client_id: null,
        label: "Music track",
        asset_type: "music",
        source_url: "https://example.com/music.mp3",
        owner_name: "Composer",
        rights_basis: "licensed",
        status: "pending",
        allowed_channels: campaign.channels,
        allowed_territories: ["United States"],
        modification_allowed: true,
        valid_from: null,
        expires_at: null,
        evidence_url: null,
        restrictions: null,
        cleared_by: null,
        cleared_at: null,
        created_at: "2026-08-22T00:00:00.000Z",
        updated_at: "2026-08-22T00:00:00.000Z",
      },
    ] satisfies CreativeRightsAsset[];
    const results = runCreativeQa({
      project,
      artifacts: generated().map((item) => ({
        artifactType: item.artifactType,
        content: item.content,
      })),
      rights,
    });
    expect(results.find((item) => item.ruleKey === "rights-clearance")?.status).toBe("failed");
  });

  it("rejects illegal project transitions", () => {
    expect(CREATIVE_TRANSITIONS.planning).toContain("in_production");
    expect(CREATIVE_TRANSITIONS.planning).not.toContain("approved");
    expect(CREATIVE_TRANSITIONS.approved).toEqual(["released", "archived"]);
  });
});
