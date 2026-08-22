import "server-only";

import { refineCampaignBrief } from "@/lib/growth/ai";
import { compileBrandSnapshot } from "@/lib/growth/brand";
import { generateCampaignBrief } from "@/lib/growth/campaign";
import { getPortalDb } from "@/lib/portal/db";
import { createPipelinePost } from "@/lib/portal/social";
import { getBrandKit, getClientById } from "@/lib/portal/service";
import type {
  AssetFormat,
  CampaignStatus,
  CampaignWithRelations,
  GrowthAsset,
  GrowthAudit,
  GrowthAuditPage,
  GrowthCampaign,
  GrowthMeasurement,
  GrowthMetric,
  GrowthOpportunity,
  OpportunityInput,
} from "@/lib/growth/types";

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function createAuditRecord(input: {
  clientId: string | null;
  websiteUrl: string;
  maxPages: number;
}): Promise<GrowthAudit> {
  const { data, error } = await getPortalDb()
    .from("growth_audits")
    .insert({
      client_id: input.clientId,
      website_url: input.websiteUrl,
      max_pages: input.maxPages,
      status: "running",
    })
    .select("*")
    .single();
  throwIfError(error);
  return data as GrowthAudit;
}

export async function failAudit(id: string, errorMessage: string): Promise<void> {
  const { error } = await getPortalDb()
    .from("growth_audits")
    .update({
      status: "failed",
      error: errorMessage.slice(0, 1500),
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);
  throwIfError(error);
}

export async function completeAudit(input: {
  audit: GrowthAudit;
  pages: Array<Omit<GrowthAuditPage, "id" | "audit_id" | "fetched_at">>;
  opportunities: OpportunityInput[];
  summary: GrowthAudit["summary"];
  partial: boolean;
  warnings: string[];
}): Promise<void> {
  const db = getPortalDb();
  const { data: pageRows, error: pageError } = await db
    .from("growth_audit_pages")
    .insert(input.pages.map((page) => ({ ...page, audit_id: input.audit.id })))
    .select("id,url");
  throwIfError(pageError);
  const pageIdByUrl = new Map((pageRows ?? []).map((row) => [row.url as string, row.id as string]));

  if (input.opportunities.length > 0) {
    const { error: opportunityError } = await db.from("growth_opportunities").insert(
      input.opportunities.map((opportunity) => ({
        client_id: input.audit.client_id,
        audit_id: input.audit.id,
        audit_page_id: opportunity.audit_page_url
          ? pageIdByUrl.get(opportunity.audit_page_url) ?? null
          : null,
        fingerprint: opportunity.fingerprint,
        rule_key: opportunity.rule_key,
        category: opportunity.category,
        title: opportunity.title,
        description: opportunity.description,
        recommended_action: opportunity.recommended_action,
        evidence: opportunity.evidence,
        impact: opportunity.impact,
        confidence: opportunity.confidence,
        effort: opportunity.effort,
      }))
    );
    throwIfError(opportunityError);
  }

  const { error: auditError } = await db
    .from("growth_audits")
    .update({
      status: input.partial ? "partial" : "completed",
      pages_scanned: input.pages.length,
      summary: { ...input.summary, warnings: input.warnings },
      error: input.warnings.length ? input.warnings.join("\n").slice(0, 1500) : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", input.audit.id);
  throwIfError(auditError);
}

export async function listAudits(clientId?: string | null): Promise<GrowthAudit[]> {
  let query = getPortalDb().from("growth_audits").select("*");
  if (clientId !== undefined) {
    query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(30);
  throwIfError(error);
  return (data ?? []) as GrowthAudit[];
}

export async function getAuditBundle(id: string): Promise<{
  audit: GrowthAudit;
  pages: GrowthAuditPage[];
  opportunities: GrowthOpportunity[];
}> {
  const db = getPortalDb();
  const [{ data: audit, error: auditError }, { data: pages, error: pagesError }, { data: opportunities, error: opportunitiesError }] =
    await Promise.all([
      db.from("growth_audits").select("*").eq("id", id).single(),
      db.from("growth_audit_pages").select("*").eq("audit_id", id).order("path"),
      db
        .from("growth_opportunities")
        .select("*, growth_audit_pages(url)")
        .eq("audit_id", id)
        .order("priority_score", { ascending: false }),
    ]);
  throwIfError(auditError);
  throwIfError(pagesError);
  throwIfError(opportunitiesError);
  return {
    audit: audit as GrowthAudit,
    pages: (pages ?? []) as GrowthAuditPage[],
    opportunities: (opportunities ?? []).map((row) => {
      const joined = row.growth_audit_pages as { url?: string } | null;
      const opportunity = Object.fromEntries(
        Object.entries(row).filter(([key]) => key !== "growth_audit_pages")
      );
      return { ...opportunity, audit_page_url: joined?.url } as GrowthOpportunity;
    }),
  };
}

export async function getOpportunity(id: string): Promise<GrowthOpportunity | null> {
  const { data, error } = await getPortalDb()
    .from("growth_opportunities")
    .select("*, growth_audit_pages(url)")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  if (!data) return null;
  const joined = data.growth_audit_pages as { url?: string } | null;
  const opportunity = Object.fromEntries(
    Object.entries(data).filter(([key]) => key !== "growth_audit_pages")
  );
  return { ...opportunity, audit_page_url: joined?.url } as GrowthOpportunity;
}

const ASSET_FORMATS: AssetFormat[] = ["square", "portrait", "story"];

export async function createCampaign(input: {
  opportunityId: string;
  name: string;
  objective: string;
  audience: string;
  offer: string;
  primaryCta: string;
  destinationUrl: string;
  channels: string[];
  socialAccountIds: string[];
  baselineValue: number;
  targetValue: number;
  metricLabel: string;
  metricUnit: GrowthMetric["unit"];
}): Promise<GrowthCampaign> {
  const opportunity = await getOpportunity(input.opportunityId);
  if (!opportunity) throw new Error("The selected growth opportunity no longer exists");
  const client = opportunity.client_id ? await getClientById(opportunity.client_id) : null;
  const brandKit = opportunity.client_id ? await getBrandKit(opportunity.client_id) : null;
  const brand = compileBrandSnapshot(client, brandKit);
  const deterministic = generateCampaignBrief({
    opportunity,
    brand,
    objective: input.objective,
    audience: input.audience,
    offer: input.offer,
    primaryCta: input.primaryCta,
    destinationUrl: input.destinationUrl,
    channels: input.channels,
  });
  const refinement = await refineCampaignBrief(deterministic, brand);
  const db = getPortalDb();
  const now = new Date().toISOString();

  const { data: campaign, error: campaignError } = await db
    .from("growth_campaigns")
    .insert({
      client_id: opportunity.client_id,
      opportunity_id: opportunity.id,
      name: input.name,
      objective: input.objective,
      audience: input.audience,
      offer: input.offer,
      primary_cta: input.primaryCta,
      destination_url: input.destinationUrl,
      channels: input.channels,
      social_account_ids: input.socialAccountIds,
      brief: refinement.brief,
      generator: refinement.usedAi ? "rules+ai" : "rules",
      generation_meta: refinement.meta,
    })
    .select("*")
    .single();
  throwIfError(campaignError);

  const assetRows = refinement.brief.posts.flatMap((post) =>
    ASSET_FORMATS.map((format) => ({
      campaign_id: campaign.id,
      template_key: post.assetTemplate,
      format,
      content: {
        kicker: post.graphicKicker,
        headline: post.graphicHeadline,
        supportingText: post.angle,
        cta: post.key === "offer" ? input.primaryCta : undefined,
      },
      brand_snapshot: brand,
      alt_text: post.altText,
    }))
  );
  const { error: assetsError } = await db.from("growth_assets").insert(assetRows);
  throwIfError(assetsError);

  const { error: metricError } = await db.from("growth_metrics").insert({
    campaign_id: campaign.id,
    key: refinement.brief.measurementPlan.metricKey,
    label: input.metricLabel,
    unit: input.metricUnit,
    direction: refinement.brief.measurementPlan.direction,
    baseline_value: input.baselineValue,
    target_value: input.targetValue,
    baseline_end: now.slice(0, 10),
  });
  throwIfError(metricError);

  const { error: opportunityError } = await db
    .from("growth_opportunities")
    .update({ status: "selected", updated_at: now })
    .eq("id", opportunity.id);
  throwIfError(opportunityError);
  return campaign as GrowthCampaign;
}

export async function listCampaigns(clientId?: string | null): Promise<GrowthCampaign[]> {
  let query = getPortalDb().from("growth_campaigns").select("*");
  if (clientId !== undefined) {
    query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  throwIfError(error);
  return (data ?? []) as GrowthCampaign[];
}

export async function getCampaignBundle(id: string): Promise<CampaignWithRelations> {
  const db = getPortalDb();
  const [{ data: campaign, error: campaignError }, { data: assets, error: assetsError }, { data: metrics, error: metricsError }] =
    await Promise.all([
      db.from("growth_campaigns").select("*").eq("id", id).single(),
      db.from("growth_assets").select("*").eq("campaign_id", id).order("created_at"),
      db
        .from("growth_metrics")
        .select("*, growth_measurements(*)")
        .eq("campaign_id", id)
        .order("created_at"),
    ]);
  throwIfError(campaignError);
  throwIfError(assetsError);
  throwIfError(metricsError);

  const typedCampaign = campaign as GrowthCampaign;
  const opportunity = typedCampaign.opportunity_id
    ? await getOpportunity(typedCampaign.opportunity_id)
    : null;
  return {
    campaign: typedCampaign,
    opportunity,
    assets: (assets ?? []) as GrowthAsset[],
    metrics: (metrics ?? []).map((metric) => {
      const { growth_measurements, ...row } = metric;
      return {
        ...(row as GrowthMetric),
        measurements: (growth_measurements ?? []) as GrowthMeasurement[],
      };
    }),
  };
}

const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["in_review", "archived"],
  in_review: ["approved", "changes_requested", "archived"],
  changes_requested: ["in_review", "archived"],
  approved: ["active", "archived"],
  active: ["completed", "archived"],
  completed: ["archived"],
  archived: [],
};

export async function transitionCampaign(
  id: string,
  next: CampaignStatus,
  note?: string
): Promise<GrowthCampaign> {
  const bundle = await getCampaignBundle(id);
  const current = bundle.campaign.status;
  if (!TRANSITIONS[current].includes(next)) {
    throw new Error(`Campaign cannot move from ${current} to ${next}`);
  }
  if (next === "in_review") {
    if (!bundle.opportunity || bundle.metrics.length === 0 || bundle.assets.length === 0) {
      throw new Error("Campaign review requires audit evidence, graphics, a baseline, and a target");
    }
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    status: next,
    review_note: note?.trim() || null,
    updated_at: now,
  };
  if (next === "approved") {
    patch.approved_by = "staff";
    patch.approved_at = now;
    patch.client_visible = true;
  }

  const db = getPortalDb();
  const { data, error } = await db
    .from("growth_campaigns")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  throwIfError(error);

  if (next === "approved") {
    const { error: assetError } = await db
      .from("growth_assets")
      .update({ status: "approved", approved_at: now })
      .eq("campaign_id", id)
      .eq("status", "draft");
    throwIfError(assetError);
  }
  return data as GrowthCampaign;
}

function appBaseUrl(): string {
  const explicit = process.env.APP_BASE_URL?.replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}

export async function launchCampaign(id: string): Promise<{ created: number }> {
  const bundle = await getCampaignBundle(id);
  if (!["approved", "active"].includes(bundle.campaign.status)) {
    throw new Error("Approve the campaign before creating publishing drafts");
  }
  const squareAssets = bundle.assets.filter(
    (asset) => asset.status === "approved" && asset.format === "square"
  );
  let created = 0;
  for (const post of bundle.campaign.brief.posts) {
    const asset = squareAssets.find((candidate) => candidate.template_key === post.assetTemplate);
    try {
      await createPipelinePost({
        clientId: bundle.campaign.client_id,
        summary: post.summary,
        variants: post.variants,
        media: asset
          ? [
              {
                url: `${appBaseUrl()}/api/growth/assets/${asset.id}/${asset.public_token}`,
                type: "image",
                label: `${bundle.campaign.name} — ${post.angle}`,
              },
            ]
          : [],
        accountIds: bundle.campaign.social_account_ids,
        status: "draft",
        category: `Growth · ${post.angle}`,
        createdBy: "growth-os",
        growthCampaignId: id,
        growthAssetId: asset?.id,
        growthContentKey: post.key,
      });
      created += 1;
    } catch (error) {
      if (error instanceof Error && /duplicate|unique/i.test(error.message)) continue;
      throw error;
    }
  }
  if (bundle.campaign.status === "approved") {
    await transitionCampaign(id, "active");
  }
  return { created };
}

export async function addMeasurement(input: {
  campaignId: string;
  metricId: string;
  periodStart: string;
  periodEnd: string;
  value: number;
  source: GrowthMeasurement["source"];
  evidenceUrl?: string;
  notes?: string;
}): Promise<GrowthMeasurement> {
  const { data: metric, error: metricError } = await getPortalDb()
    .from("growth_metrics")
    .select("id")
    .eq("id", input.metricId)
    .eq("campaign_id", input.campaignId)
    .maybeSingle();
  throwIfError(metricError);
  if (!metric) throw new Error("Metric does not belong to this campaign");

  const { data, error } = await getPortalDb()
    .from("growth_measurements")
    .upsert(
      {
        metric_id: input.metricId,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        value: input.value,
        source: input.source,
        evidence_url: input.evidenceUrl?.trim() || null,
        notes: input.notes?.trim() || null,
      },
      { onConflict: "metric_id,period_start,period_end,source" }
    )
    .select("*")
    .single();
  throwIfError(error);
  return data as GrowthMeasurement;
}

export async function getAssetForRender(
  id: string,
  token: string
): Promise<GrowthAsset | null> {
  const { data, error } = await getPortalDb()
    .from("growth_assets")
    .select("*")
    .eq("id", id)
    .eq("public_token", token)
    .maybeSingle();
  throwIfError(error);
  return data as GrowthAsset | null;
}
