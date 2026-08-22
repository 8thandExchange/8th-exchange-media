import type { BrandKit } from "@/lib/portal/service";

export type AuditStatus = "running" | "completed" | "partial" | "failed";
export type OpportunityStatus = "open" | "selected" | "dismissed" | "completed";
export type CampaignStatus =
  | "draft"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "active"
  | "completed"
  | "archived";
export type AssetTemplate = "statement" | "insight" | "offer";
export type AssetFormat = "square" | "portrait" | "story";

export interface AuditPageFacts {
  hasForm: boolean;
  hasPrimaryCta: boolean;
  primaryCtas: string[];
  hasEmailCapture: boolean;
  hasAnalytics: boolean;
  hasOpenGraphImage: boolean;
  hasStructuredData: boolean;
  hasViewport: boolean;
  isNoIndex: boolean;
  internalLinks: string[];
  externalLinks: string[];
  brokenLinks: string[];
  images: number;
  imagesMissingAlt: number;
}

export interface AuditPageInput {
  url: string;
  path: string;
  http_status: number | null;
  content_type: string | null;
  title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  h1s: string[];
  word_count: number;
  facts: AuditPageFacts;
  text_excerpt: string | null;
  content_hash: string | null;
  error: string | null;
}

export interface GrowthAudit {
  id: string;
  client_id: string | null;
  website_url: string;
  status: AuditStatus;
  ruleset_version: string;
  max_pages: number;
  pages_scanned: number;
  summary: AuditSummary;
  error: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface GrowthAuditPage extends AuditPageInput {
  id: string;
  audit_id: string;
  fetched_at: string;
}

export interface AuditSummary {
  totalPages: number;
  healthyPages: number;
  failedPages: number;
  averageWordCount: number;
  forms: number;
  pagesWithPrimaryCta: number;
  pagesWithAnalytics: number;
  pagesWithOpenGraphImage: number;
  pagesWithStructuredData: number;
  duplicateTitles: number;
  duplicateDescriptions: number;
  completedAt: string;
}

export interface OpportunityInput {
  audit_page_url?: string;
  fingerprint: string;
  rule_key: string;
  category: string;
  title: string;
  description: string;
  recommended_action: string;
  evidence: Record<string, unknown>;
  impact: number;
  confidence: number;
  effort: number;
}

export interface GrowthOpportunity extends OpportunityInput {
  id: string;
  client_id: string | null;
  audit_id: string;
  audit_page_id: string | null;
  priority_score: number;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
}

export interface CampaignPostDraft {
  key: string;
  angle: string;
  summary: string;
  variants: Record<string, string>;
  assetTemplate: AssetTemplate;
  graphicHeadline: string;
  graphicKicker: string;
  altText: string;
}

export interface CampaignBrief {
  evidence: {
    finding: string;
    pageUrl?: string;
    observed: Record<string, unknown>;
  };
  hypothesis: string;
  messageHierarchy: string[];
  guardrails: string[];
  deliverables: string[];
  posts: CampaignPostDraft[];
  measurementPlan: {
    metricKey: string;
    metricLabel: string;
    unit: "count" | "currency" | "percent" | "ratio" | "duration";
    direction: "increase" | "decrease";
    rationale: string;
  };
}

export interface GrowthCampaign {
  id: string;
  client_id: string | null;
  opportunity_id: string | null;
  name: string;
  status: CampaignStatus;
  objective: string;
  audience: string;
  offer: string;
  primary_cta: string;
  destination_url: string;
  channels: string[];
  social_account_ids: string[];
  brief: CampaignBrief;
  brief_version: number;
  generator: "rules" | "rules+ai" | "manual";
  generation_meta: Record<string, unknown>;
  client_visible: boolean;
  review_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandSnapshot {
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  headingFont: string;
  bodyFont: string;
  voiceTone: string;
  logoUrl?: string;
  sourceKit?: BrandKit | null;
}

export interface GrowthAsset {
  id: string;
  campaign_id: string;
  template_key: AssetTemplate;
  format: AssetFormat;
  content: {
    kicker: string;
    headline: string;
    supportingText?: string;
    cta?: string;
  };
  brand_snapshot: BrandSnapshot;
  alt_text: string;
  status: "draft" | "approved" | "archived";
  public_token: string;
  version: number;
  approved_at: string | null;
  created_at: string;
}

export interface GrowthMetric {
  id: string;
  campaign_id: string;
  key: string;
  label: string;
  unit: "count" | "currency" | "percent" | "ratio" | "duration";
  currency: string | null;
  direction: "increase" | "decrease";
  baseline_value: number;
  target_value: number;
  baseline_start: string | null;
  baseline_end: string | null;
  created_at: string;
}

export interface GrowthMeasurement {
  id: string;
  metric_id: string;
  period_start: string;
  period_end: string;
  value: number;
  source: "manual" | "ghl" | "ga4" | "stripe" | "other";
  evidence_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface CampaignWithRelations {
  campaign: GrowthCampaign;
  opportunity: GrowthOpportunity | null;
  assets: GrowthAsset[];
  metrics: Array<GrowthMetric & { measurements: GrowthMeasurement[] }>;
}
