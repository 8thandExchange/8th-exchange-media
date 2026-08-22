import type { BrandSnapshot, GrowthCampaign, GrowthOpportunity } from "@/lib/growth/types";

export type CreativeProjectStatus =
  | "planning"
  | "in_production"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "released"
  | "completed"
  | "archived";

export type ProductionType =
  | "short_video"
  | "long_video"
  | "photo_campaign"
  | "article"
  | "mixed";

export type CreativeArtifactType =
  | "production_brief"
  | "hook_set"
  | "script"
  | "shot_list"
  | "storyboard"
  | "seo_brief"
  | "caption_set"
  | "thumbnail_brief"
  | "repurposed_content";

export interface CreativeProject {
  id: string;
  client_id: string | null;
  growth_campaign_id: string | null;
  name: string;
  production_type: ProductionType;
  status: CreativeProjectStatus;
  objective: string;
  audience: string;
  offer: string;
  primary_cta: string;
  destination_url: string;
  channels: string[];
  target_duration_seconds: number;
  brand_snapshot: BrandSnapshot;
  source_manifest: Record<string, unknown>;
  client_visible: boolean;
  owner_label: string;
  due_at: string | null;
  lock_version: number;
  review_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreativeArtifact {
  id: string;
  project_id: string;
  artifact_type: CreativeArtifactType;
  title: string;
  state: "working" | "in_review" | "approved" | "changes_requested" | "superseded" | "archived";
  current_revision_id: string | null;
  selected_revision_id: string | null;
  required: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreativeArtifactRevision {
  id: string;
  artifact_id: string;
  revision_number: number;
  schema_key: string;
  schema_version: number;
  content: CreativeContent;
  content_hash: string;
  generation_method: "rules" | "ai_refinement" | "manual" | "import";
  generation_run_id: string | null;
  created_by: string;
  created_at: string;
}

export interface HookIdea {
  id: string;
  framework: "problem" | "contrarian" | "question" | "proof" | "demonstration";
  spokenText: string;
  onScreenText: string;
  intendedEmotion: string;
  estimatedSeconds: number;
  selected: boolean;
}

export interface HookSetContent {
  hooks: HookIdea[];
}

export interface ScriptBeat {
  id: string;
  role: "hook" | "problem" | "proof" | "solution" | "cta";
  spokenCopy: string;
  onScreenCopy: string;
  visualIntent: string;
  estimatedSeconds: number;
}

export interface ScriptContent {
  format: ProductionType;
  targetDurationSeconds: number;
  selectedHookId: string;
  beats: ScriptBeat[];
  disclaimers: string[];
}

export interface Shot {
  id: string;
  beatId: string;
  shotNumber: number;
  framing: "wide" | "medium" | "close" | "detail" | "screen" | "talking_head";
  subject: string;
  action: string;
  location: string;
  audio: "sync" | "voiceover" | "music" | "ambient";
  equipment: string;
  props: string[];
  talent: string[];
  estimatedSeconds: number;
  priority: "required" | "optional";
}

export interface ShotListContent {
  shots: Shot[];
}

export interface StoryboardFrame {
  id: string;
  shotId: string;
  frameNumber: number;
  compositionNote: string;
  overlayText: string;
  conceptImageUrl?: string;
  conceptOnly: boolean;
}

export interface StoryboardContent {
  frames: StoryboardFrame[];
}

export interface SeoOutlineItem {
  level: 2 | 3;
  heading: string;
  purpose: string;
}

export interface SeoBriefContent {
  primaryKeyword: { term: string; source: string };
  secondaryKeywords: Array<{ term: string; source: string }>;
  searchIntent: "informational" | "commercial" | "transactional" | "local";
  audienceQuestion: string;
  proposedSlug: string;
  titleOptions: string[];
  metaDescriptions: string[];
  outline: SeoOutlineItem[];
  internalLinks: Array<{ url: string; anchor: string; sourceAuditPageId?: string }>;
  schemaRecommendations: string[];
  faqQuestions: string[];
}

export interface CaptionVariant {
  key: string;
  channel: string;
  copy: string;
  cta: string;
  trackedUrl: string;
  altText: string;
}

export interface CaptionSetContent {
  variants: CaptionVariant[];
}

export interface ThumbnailBriefContent {
  headline: string;
  visualFocus: string;
  composition: string;
  contrastPlan: string;
  altText: string;
}

export interface ProductionBriefContent {
  objective: string;
  audience: string;
  offer: string;
  evidence: Record<string, unknown>;
  messageHierarchy: string[];
  guardrails: string[];
  primaryCta: string;
  destinationUrl: string;
  deliverables: string[];
}

export interface RepurposedContent {
  derivatives: Array<{
    key: string;
    format: "reel" | "story" | "carousel" | "email" | "article" | "sales_talking_points";
    purpose: string;
    sourceBeatIds: string[];
    copy: string;
  }>;
}

export type CreativeContent =
  | ProductionBriefContent
  | HookSetContent
  | ScriptContent
  | ShotListContent
  | StoryboardContent
  | SeoBriefContent
  | CaptionSetContent
  | ThumbnailBriefContent
  | RepurposedContent;

export interface CreativeReview {
  id: string;
  project_id: string;
  revision_id: string;
  gate_key: string;
  decision: "approved" | "changes_requested" | "rejected" | "waived";
  reviewer_type: "staff" | "client";
  reviewer_id: string | null;
  reviewer_label: string;
  note: string | null;
  content_hash: string;
  created_at: string;
}

export interface CreativeRightsAsset {
  id: string;
  project_id: string;
  client_id: string | null;
  label: string;
  asset_type:
    | "b_roll"
    | "logo"
    | "product"
    | "location"
    | "talent_release"
    | "music"
    | "sfx"
    | "graphic"
    | "reference"
    | "final_master";
  source_url: string;
  owner_name: string;
  rights_basis: "client_owned" | "stock" | "work_for_hire" | "editorial" | "licensed" | "unknown";
  status: "pending" | "cleared" | "restricted" | "expired" | "revoked";
  allowed_channels: string[];
  allowed_territories: string[];
  modification_allowed: boolean;
  valid_from: string | null;
  expires_at: string | null;
  evidence_url: string | null;
  restrictions: string | null;
  cleared_by: string | null;
  cleared_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreativeQaResult {
  id: string;
  qa_run_id: string;
  rule_key: string;
  severity: "blocking" | "warning" | "advisory";
  status: "passed" | "failed" | "waived";
  message: string;
  evidence: Record<string, unknown>;
}

export interface CreativeQaRun {
  id: string;
  project_id: string;
  ruleset_version: string;
  status: "passed" | "failed";
  created_at: string;
  completed_at: string;
  results: CreativeQaResult[];
}

export interface ArtifactWithRevision {
  artifact: CreativeArtifact;
  currentRevision: CreativeArtifactRevision;
  selectedRevision: CreativeArtifactRevision | null;
  revisions: CreativeArtifactRevision[];
}

export interface CreativeProjectBundle {
  project: CreativeProject;
  campaign: GrowthCampaign | null;
  opportunity: GrowthOpportunity | null;
  artifacts: ArtifactWithRevision[];
  rights: CreativeRightsAsset[];
  reviews: CreativeReview[];
  qaRuns: CreativeQaRun[];
}
