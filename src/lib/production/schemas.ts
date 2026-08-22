import { z } from "zod";
import type {
  CreativeArtifactType,
  CreativeContent,
} from "@/lib/production/types";

const productionBriefSchema = z.object({
  objective: z.string().min(3).max(1000),
  audience: z.string().min(3).max(1000),
  offer: z.string().min(2).max(1000),
  evidence: z.record(z.string(), z.unknown()),
  messageHierarchy: z.array(z.string().min(1).max(1000)).min(1).max(20),
  guardrails: z.array(z.string().min(1).max(1000)).min(1).max(50),
  primaryCta: z.string().min(1).max(200),
  destinationUrl: z.string().url(),
  deliverables: z.array(z.string().min(1).max(300)).min(1).max(50),
});

const hookSetSchema = z.object({
  hooks: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        framework: z.enum(["problem", "contrarian", "question", "proof", "demonstration"]),
        spokenText: z.string().min(2).max(700),
        onScreenText: z.string().max(120),
        intendedEmotion: z.string().min(1).max(100),
        estimatedSeconds: z.number().int().min(1).max(60),
        selected: z.boolean(),
      })
    )
    .min(3)
    .max(20),
});

const scriptSchema = z.object({
  format: z.enum(["short_video", "long_video", "photo_campaign", "article", "mixed"]),
  targetDurationSeconds: z.number().int().min(10).max(3600),
  selectedHookId: z.string().min(1).max(100),
  beats: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        role: z.enum(["hook", "problem", "proof", "solution", "cta"]),
        spokenCopy: z.string().min(1).max(2000),
        onScreenCopy: z.string().max(200),
        visualIntent: z.string().min(1).max(1200),
        estimatedSeconds: z.number().int().min(1).max(600),
      })
    )
    .min(3)
    .max(40),
  disclaimers: z.array(z.string().max(1000)).max(30),
});

const shotListSchema = z.object({
  shots: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        beatId: z.string().min(1).max(100),
        shotNumber: z.number().int().min(1).max(500),
        framing: z.enum(["wide", "medium", "close", "detail", "screen", "talking_head"]),
        subject: z.string().min(1).max(500),
        action: z.string().min(1).max(1200),
        location: z.string().max(500),
        audio: z.enum(["sync", "voiceover", "music", "ambient"]),
        equipment: z.string().max(500),
        props: z.array(z.string().max(200)).max(50),
        talent: z.array(z.string().max(200)).max(50),
        estimatedSeconds: z.number().min(0.5).max(600),
        priority: z.enum(["required", "optional"]),
      })
    )
    .min(1)
    .max(500),
});

const storyboardSchema = z.object({
  frames: z
    .array(
      z.object({
        id: z.string().min(1).max(100),
        shotId: z.string().min(1).max(100),
        frameNumber: z.number().int().min(1).max(500),
        compositionNote: z.string().min(1).max(1500),
        overlayText: z.string().max(200),
        conceptImageUrl: z.string().url().optional(),
        conceptOnly: z.boolean(),
      })
    )
    .min(1)
    .max(500),
});

const seoBriefSchema = z.object({
  primaryKeyword: z.object({ term: z.string().min(1).max(100), source: z.string().min(1).max(200) }),
  secondaryKeywords: z.array(z.object({ term: z.string().min(1).max(100), source: z.string().min(1).max(200) })).max(30),
  searchIntent: z.enum(["informational", "commercial", "transactional", "local"]),
  audienceQuestion: z.string().min(3).max(500),
  proposedSlug: z.string().min(1).max(100),
  titleOptions: z.array(z.string().min(1).max(100)).min(1).max(20),
  metaDescriptions: z.array(z.string().min(1).max(300)).min(1).max(20),
  outline: z.array(z.object({ level: z.union([z.literal(2), z.literal(3)]), heading: z.string().min(1).max(200), purpose: z.string().min(1).max(500) })).min(1).max(100),
  internalLinks: z.array(z.object({ url: z.string().url(), anchor: z.string().min(1).max(200), sourceAuditPageId: z.string().optional() })).max(30),
  schemaRecommendations: z.array(z.string().min(1).max(100)).max(20),
  faqQuestions: z.array(z.string().min(1).max(300)).max(30),
});

const captionSetSchema = z.object({
  variants: z.array(z.object({
    key: z.string().min(1).max(160),
    channel: z.string().min(1).max(80),
    copy: z.string().min(1).max(10000),
    cta: z.string().min(1).max(200),
    trackedUrl: z.string().url(),
    altText: z.string().min(1).max(500),
  })).min(1).max(200),
});

const thumbnailSchema = z.object({
  headline: z.string().min(1).max(100),
  visualFocus: z.string().min(1).max(1000),
  composition: z.string().min(1).max(1000),
  contrastPlan: z.string().min(1).max(1000),
  altText: z.string().min(1).max(500),
});

const repurposedSchema = z.object({
  derivatives: z.array(z.object({
    key: z.string().min(1).max(100),
    format: z.enum(["reel", "story", "carousel", "email", "article", "sales_talking_points"]),
    purpose: z.string().min(1).max(500),
    sourceBeatIds: z.array(z.string().min(1).max(100)).min(1).max(50),
    copy: z.string().min(1).max(20000),
  })).min(1).max(100),
});

const schemas: Record<CreativeArtifactType, z.ZodType> = {
  production_brief: productionBriefSchema,
  hook_set: hookSetSchema,
  script: scriptSchema,
  shot_list: shotListSchema,
  storyboard: storyboardSchema,
  seo_brief: seoBriefSchema,
  caption_set: captionSetSchema,
  thumbnail_brief: thumbnailSchema,
  repurposed_content: repurposedSchema,
};

export function parseCreativeContent(
  type: CreativeArtifactType,
  value: unknown
): CreativeContent {
  return schemas[type].parse(value) as CreativeContent;
}
