import "server-only";

import { refineProductionScript } from "@/lib/production/ai";
import {
  contentHash,
  CREATIVE_QA_VERSION,
  CREATIVE_RECIPE_VERSION,
  generateCreativePackage,
  runCreativeQa,
} from "@/lib/production/generation";
import { compileBrandSnapshot } from "@/lib/growth/brand";
import { getCampaignBundle } from "@/lib/growth/service";
import { getPortalDb } from "@/lib/portal/db";
import { createPipelinePost } from "@/lib/portal/social";
import { getBrandKit, getClientById } from "@/lib/portal/service";
import type {
  ArtifactWithRevision,
  CaptionSetContent,
  CreativeArtifact,
  CreativeArtifactRevision,
  CreativeArtifactType,
  CreativeContent,
  CreativeProject,
  CreativeProjectBundle,
  CreativeProjectStatus,
  CreativeQaRun,
  CreativeReview,
  CreativeRightsAsset,
  ProductionType,
  ScriptContent,
} from "@/lib/production/types";

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function listCreativeProjects(
  clientId?: string | null
): Promise<CreativeProject[]> {
  let query = getPortalDb().from("creative_projects").select("*");
  if (clientId !== undefined) {
    query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  }
  const { data, error } = await query.order("created_at", { ascending: false }).limit(100);
  throwIfError(error);
  return (data ?? []) as CreativeProject[];
}

export async function getCreativeProjectForCampaign(
  campaignId: string
): Promise<CreativeProject | null> {
  const { data, error } = await getPortalDb()
    .from("creative_projects")
    .select("*")
    .eq("growth_campaign_id", campaignId)
    .maybeSingle();
  throwIfError(error);
  return data as CreativeProject | null;
}

async function auditInternalLinks(auditId: string | undefined): Promise<
  Array<{ id: string; url: string; title: string | null }>
> {
  if (!auditId) return [];
  const { data, error } = await getPortalDb()
    .from("growth_audit_pages")
    .select("id,url,title")
    .eq("audit_id", auditId)
    .lt("http_status", 400)
    .order("word_count", { ascending: false })
    .limit(12);
  throwIfError(error);
  return (data ?? []) as Array<{ id: string; url: string; title: string | null }>;
}

export async function createCreativeProject(input: {
  campaignId: string;
  productionType: ProductionType;
  targetDurationSeconds: number;
  dueAt?: string;
}): Promise<CreativeProject> {
  const existing = await getCreativeProjectForCampaign(input.campaignId);
  if (existing) {
    const { count, error } = await getPortalDb()
      .from("creative_artifacts")
      .select("id", { count: "exact", head: true })
      .eq("project_id", existing.id);
    throwIfError(error);
    if ((count ?? 0) >= 9) return existing;
    if (Date.now() - new Date(existing.created_at).getTime() < 10 * 60 * 1000) {
      throw new Error("This production package is still initializing. Try again shortly.");
    }
    const { error: cleanupError } = await getPortalDb()
      .from("creative_projects")
      .delete()
      .eq("id", existing.id)
      .eq("status", "planning");
    throwIfError(cleanupError);
  }

  const campaignBundle = await getCampaignBundle(input.campaignId);
  const { campaign, opportunity } = campaignBundle;
  if (!["approved", "active", "completed"].includes(campaign.status)) {
    throw new Error("Approve the Growth OS campaign before starting production");
  }
  const client = campaign.client_id ? await getClientById(campaign.client_id) : null;
  const brandKit = campaign.client_id ? await getBrandKit(campaign.client_id) : null;
  const brand = compileBrandSnapshot(client, brandKit);
  const links = await auditInternalLinks(opportunity?.audit_id);
  const sourceManifest = {
    campaignId: campaign.id,
    campaignBriefVersion: campaign.brief_version,
    opportunityId: opportunity?.id ?? null,
    campaignApprovedAt: campaign.approved_at,
    recipeVersion: CREATIVE_RECIPE_VERSION,
  };
  const db = getPortalDb();
  const { data: projectRow, error: projectError } = await db
    .from("creative_projects")
    .insert({
      client_id: campaign.client_id,
      growth_campaign_id: campaign.id,
      name: `${campaign.name} — Production`,
      production_type: input.productionType,
      objective: campaign.objective,
      audience: campaign.audience,
      offer: campaign.offer,
      primary_cta: campaign.primary_cta,
      destination_url: campaign.destination_url,
      channels: campaign.channels,
      target_duration_seconds: input.targetDurationSeconds,
      brand_snapshot: brand,
      source_manifest: sourceManifest,
      due_at: input.dueAt ?? null,
    })
    .select("*")
    .single();
  throwIfError(projectError);
  const project = projectRow as CreativeProject;

  try {
    const generationInput = {
      campaign,
      opportunity,
      productionType: input.productionType,
      targetDurationSeconds: input.targetDurationSeconds,
      brandKeywords: brandKit?.keywords ?? [],
      internalLinks: links,
    };
    let generated = generateCreativePackage(generationInput);
    const deterministicScript = generated.find(
      (item) => item.artifactType === "script"
    )!.content as ScriptContent;
    const refinement = await refineProductionScript(deterministicScript, brand, {
      evidence: campaign.brief.evidence,
      offer: campaign.offer,
      objective: campaign.objective,
      CTA: campaign.primary_cta,
      guardrails: campaign.brief.guardrails,
    });
    if (refinement.usedAi) {
      generated = generated.map((item) =>
        item.artifactType === "script" ? { ...item, content: refinement.script } : item
      );
    }

    const inputManifest = {
      sourceManifest,
      brandSnapshot: brand,
      generationInput,
      aiPromptVersion: "production-script-v1",
    };
    const { data: run, error: runError } = await db
      .from("creative_generation_runs")
      .insert({
        project_id: project.id,
        recipe_key: "campaign-production-package",
        recipe_version: CREATIVE_RECIPE_VERSION,
        mode: refinement.usedAi ? "rules+ai" : "rules",
        input_manifest: inputManifest,
        input_hash: contentHash(inputManifest),
        provider: refinement.usedAi ? "vercel-ai-gateway" : null,
        model: typeof refinement.meta.model === "string" ? refinement.meta.model : null,
        status: "completed",
        usage: refinement.meta.usage ?? {},
        completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    throwIfError(runError);
    if (!run) throw new Error("Creative generation run could not be recorded");

    for (const item of generated) {
      const { data: artifact, error: artifactError } = await db
        .from("creative_artifacts")
        .insert({
          project_id: project.id,
          artifact_type: item.artifactType,
          title: item.title,
          required: item.required,
          sort_order: item.sortOrder,
        })
        .select("*")
        .single();
      throwIfError(artifactError);
      const method =
        item.artifactType === "script" && refinement.usedAi ? "ai_refinement" : "rules";
      const { data: revision, error: revisionError } = await db
        .from("creative_artifact_revisions")
        .insert({
          artifact_id: artifact.id,
          revision_number: 1,
          schema_key: item.schemaKey,
          schema_version: 1,
          content: item.content,
          content_hash: contentHash(item.content),
          generation_method: method,
          generation_run_id: run.id,
        })
        .select("*")
        .single();
      throwIfError(revisionError);
      const { error: selectError } = await db
        .from("creative_artifacts")
        .update({
          current_revision_id: revision.id,
          selected_revision_id: revision.id,
        })
        .eq("id", artifact.id);
      throwIfError(selectError);
    }

    const { error: eventError } = await db.from("creative_transition_events").insert({
      project_id: project.id,
      from_state: null,
      to_state: "planning",
      actor_type: "staff",
      note: "Creative package generated from approved Growth OS campaign evidence.",
      metadata: { recipeVersion: CREATIVE_RECIPE_VERSION },
    });
    throwIfError(eventError);
    return project;
  } catch (error) {
    await db.from("creative_projects").delete().eq("id", project.id);
    throw error;
  }
}

export async function getCreativeProjectBundle(
  id: string
): Promise<CreativeProjectBundle> {
  const db = getPortalDb();
  const [
    { data: project, error: projectError },
    { data: artifacts, error: artifactsError },
    { data: rights, error: rightsError },
    { data: reviews, error: reviewsError },
    { data: qaRuns, error: qaError },
  ] = await Promise.all([
    db.from("creative_projects").select("*").eq("id", id).single(),
    db.from("creative_artifacts").select("*").eq("project_id", id).order("sort_order"),
    db.from("creative_rights_assets").select("*").eq("project_id", id).order("created_at"),
    db.from("creative_reviews").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    db
      .from("creative_qa_runs")
      .select("*, creative_qa_results(*)")
      .eq("project_id", id)
      .order("created_at", { ascending: false }),
  ]);
  throwIfError(projectError);
  throwIfError(artifactsError);
  throwIfError(rightsError);
  throwIfError(reviewsError);
  throwIfError(qaError);

  const typedArtifacts = (artifacts ?? []) as CreativeArtifact[];
  const artifactIds = typedArtifacts.map((artifact) => artifact.id);
  const { data: revisions, error: revisionsError } = artifactIds.length
    ? await db
        .from("creative_artifact_revisions")
        .select("*")
        .in("artifact_id", artifactIds)
        .order("revision_number", { ascending: false })
    : { data: [], error: null };
  throwIfError(revisionsError);
  const typedRevisions = (revisions ?? []) as CreativeArtifactRevision[];
  const withRevisions: ArtifactWithRevision[] = typedArtifacts.map((artifact) => {
    const own = typedRevisions.filter((revision) => revision.artifact_id === artifact.id);
    const current = own.find((revision) => revision.id === artifact.current_revision_id);
    if (!current) throw new Error(`Creative artifact ${artifact.title} has no current revision`);
    return {
      artifact,
      currentRevision: current,
      selectedRevision:
        own.find((revision) => revision.id === artifact.selected_revision_id) ?? null,
      revisions: own,
    };
  });

  const typedProject = project as CreativeProject;
  const growthBundle = typedProject.growth_campaign_id
    ? await getCampaignBundle(typedProject.growth_campaign_id)
    : null;
  return {
    project: typedProject,
    campaign: growthBundle?.campaign ?? null,
    opportunity: growthBundle?.opportunity ?? null,
    artifacts: withRevisions,
    rights: (rights ?? []) as CreativeRightsAsset[],
    reviews: (reviews ?? []) as CreativeReview[],
    qaRuns: (qaRuns ?? []).map((run) => {
      const results = run.creative_qa_results ?? [];
      const row = Object.fromEntries(
        Object.entries(run).filter(([key]) => key !== "creative_qa_results")
      );
      return { ...row, results } as CreativeQaRun;
    }),
  };
}

function revisionManifest(bundle: CreativeProjectBundle) {
  return bundle.artifacts
    .filter((entry) => entry.artifact.required && entry.selectedRevision)
    .map((entry) => ({
      artifactId: entry.artifact.id,
      revisionId: entry.selectedRevision!.id,
      contentHash: entry.selectedRevision!.content_hash,
    }));
}

export async function createArtifactRevision(input: {
  projectId: string;
  artifactType: CreativeArtifactType;
  content: CreativeContent;
  createdBy?: string;
}): Promise<CreativeArtifactRevision> {
  const bundle = await getCreativeProjectBundle(input.projectId);
  if (!["planning", "in_production", "changes_requested"].includes(bundle.project.status)) {
    throw new Error("Return the project to production before editing approved or review content");
  }
  const entry = bundle.artifacts.find(
    (candidate) => candidate.artifact.artifact_type === input.artifactType
  );
  if (!entry) throw new Error("Unknown creative artifact");
  const hash = contentHash(input.content);
  const { data: revision, error } = await getPortalDb().rpc(
    "creative_create_artifact_revision",
    {
      p_project_id: bundle.project.id,
      p_expected_status: bundle.project.status,
      p_lock_version: bundle.project.lock_version,
      p_artifact_id: entry.artifact.id,
      p_content: input.content,
      p_content_hash: hash,
      p_created_by: input.createdBy ?? "staff",
    }
  );
  if (error?.message.includes("STALE_PROJECT")) {
    throw new Error("This production changed in another session. Refresh before saving.");
  }
  throwIfError(error);
  return revision as CreativeArtifactRevision;
}

export async function addCreativeRightsAsset(input: {
  projectId: string;
  label: string;
  assetType: CreativeRightsAsset["asset_type"];
  sourceUrl: string;
  ownerName: string;
  rightsBasis: CreativeRightsAsset["rights_basis"];
  status: CreativeRightsAsset["status"];
  allowedChannels: string[];
  allowedTerritories: string[];
  modificationAllowed: boolean;
  expiresAt?: string;
  evidenceUrl?: string;
  restrictions?: string;
}): Promise<CreativeRightsAsset> {
  const bundle = await getCreativeProjectBundle(input.projectId);
  const { data, error } = await getPortalDb().rpc("creative_add_rights_asset", {
    p_project_id: input.projectId,
    p_expected_status: bundle.project.status,
    p_lock_version: bundle.project.lock_version,
    p_asset: {
      label: input.label,
      assetType: input.assetType,
      sourceUrl: input.sourceUrl,
      ownerName: input.ownerName,
      rightsBasis: input.rightsBasis,
      status: input.status,
      allowedChannels: input.allowedChannels,
      allowedTerritories: input.allowedTerritories,
      modificationAllowed: input.modificationAllowed,
      expiresAt: input.expiresAt ?? "",
      evidenceUrl: input.evidenceUrl ?? "",
      restrictions: input.restrictions ?? "",
    },
  });
  if (error?.message.includes("STALE_PROJECT")) {
    throw new Error("This production changed in another session. Refresh before adding assets.");
  }
  throwIfError(error);
  return data as CreativeRightsAsset;
}

export async function updateCreativeRightsAsset(input: {
  projectId: string;
  assetId: string;
  status: CreativeRightsAsset["status"];
  evidenceUrl?: string;
  restrictions?: string;
}): Promise<CreativeRightsAsset> {
  const bundle = await getCreativeProjectBundle(input.projectId);
  const existing = bundle.rights.find((asset) => asset.id === input.assetId);
  if (!existing) throw new Error("Unknown production asset");
  const { data, error } = await getPortalDb().rpc("creative_update_rights_asset", {
    p_project_id: input.projectId,
    p_expected_status: bundle.project.status,
    p_lock_version: bundle.project.lock_version,
    p_asset_id: input.assetId,
    p_status: input.status,
    p_evidence_url: input.evidenceUrl ?? null,
    p_restrictions: input.restrictions ?? null,
  });
  if (error?.message.includes("STALE_PROJECT")) {
    throw new Error("This production changed in another session. Refresh before updating rights.");
  }
  if (error?.message.includes("PUBLISHING_IN_PROGRESS")) {
    throw new Error("Rights cannot change while a post is being published");
  }
  throwIfError(error);
  return data as CreativeRightsAsset;
}

export async function deleteCreativeRightsAsset(input: {
  projectId: string;
  assetId: string;
}): Promise<void> {
  const bundle = await getCreativeProjectBundle(input.projectId);
  if (!bundle.rights.some((asset) => asset.id === input.assetId)) {
    throw new Error("Unknown production asset");
  }
  const { error } = await getPortalDb().rpc("creative_delete_rights_asset", {
    p_project_id: input.projectId,
    p_expected_status: bundle.project.status,
    p_lock_version: bundle.project.lock_version,
    p_asset_id: input.assetId,
  });
  if (error?.message.includes("PUBLISHING_IN_PROGRESS")) {
    throw new Error("Rights cannot change while a post is being published");
  }
  if (error?.message.includes("STALE_PROJECT")) {
    throw new Error("This production changed in another session. Refresh before removing assets.");
  }
  throwIfError(error);
}

export async function executeCreativeQa(
  bundle: CreativeProjectBundle
): Promise<CreativeQaRun> {
  const findings = runCreativeQa({
    project: bundle.project,
    artifacts: bundle.artifacts.map((entry) => ({
      artifactType: entry.artifact.artifact_type,
      content: entry.currentRevision.content,
    })),
    rights: bundle.rights,
  });
  const failed = findings.some(
    (finding) => finding.severity === "blocking" && finding.status === "failed"
  );
  const db = getPortalDb();
  const { data: run, error: runError } = await db
    .from("creative_qa_runs")
    .insert({
      project_id: bundle.project.id,
      ruleset_version: CREATIVE_QA_VERSION,
      status: failed ? "failed" : "passed",
    })
    .select("*")
    .single();
  throwIfError(runError);
  const { data: results, error: resultsError } = await db
    .from("creative_qa_results")
    .insert(
      findings.map((finding) => ({
        qa_run_id: run.id,
        rule_key: finding.ruleKey,
        severity: finding.severity,
        status: finding.status,
        message: finding.message,
        evidence: finding.evidence,
      }))
    )
    .select("*");
  throwIfError(resultsError);
  return { ...run, results: results ?? [] } as CreativeQaRun;
}

export const CREATIVE_TRANSITIONS: Record<CreativeProjectStatus, CreativeProjectStatus[]> = {
  planning: ["in_production", "archived"],
  in_production: ["in_review", "archived"],
  in_review: ["approved", "changes_requested", "archived"],
  changes_requested: ["in_production", "archived"],
  approved: ["released", "archived"],
  released: ["completed", "archived"],
  completed: ["archived"],
  archived: [],
};

async function atomicTransition(
  project: CreativeProject,
  next: CreativeProjectStatus,
  note: string | undefined,
  actor: "staff" | "client"
): Promise<CreativeProject> {
  if (!CREATIVE_TRANSITIONS[project.status].includes(next)) {
    throw new Error(`Production cannot move from ${project.status} to ${next}`);
  }
  const { data, error } = await getPortalDb().rpc("creative_transition_project", {
    p_id: project.id,
    p_expected: project.status,
    p_next: next,
    p_lock_version: project.lock_version,
    p_note: note ?? null,
    p_actor: actor,
  });
  if (error?.message.includes("STALE_PROJECT")) {
    throw new Error("This production changed in another session. Refresh before continuing.");
  }
  throwIfError(error);
  return data as CreativeProject;
}

export async function transitionCreativeProject(
  id: string,
  next: CreativeProjectStatus,
  note?: string
): Promise<CreativeProject> {
  const bundle = await getCreativeProjectBundle(id);
  if (!CREATIVE_TRANSITIONS[bundle.project.status].includes(next)) {
    throw new Error(
      `Production cannot move from ${bundle.project.status} to ${next}`
    );
  }
  if (next === "in_review") {
    const qa = await executeCreativeQa(bundle);
    const blockers = qa.results.filter(
      (result) => result.severity === "blocking" && result.status === "failed"
    );
    if (blockers.length > 0) {
      throw new Error(
        `Resolve ${blockers.length} blocking QA check${blockers.length === 1 ? "" : "s"} before client review`
      );
    }
    const manifest = revisionManifest(bundle);
    if (manifest.length !== bundle.artifacts.filter((entry) => entry.artifact.required).length) {
      throw new Error("Every required artifact needs a selected revision before review");
    }
    const { data, error } = await getPortalDb().rpc("creative_submit_project", {
      p_id: bundle.project.id,
      p_expected: bundle.project.status,
      p_lock_version: bundle.project.lock_version,
      p_manifest: manifest,
      p_client_visible: Boolean(bundle.project.client_id),
      p_note: note ?? null,
      p_actor: "staff",
    });
    if (error?.message.includes("STALE_")) {
      throw new Error("The production package changed during QA. Refresh and submit it again.");
    }
    throwIfError(error);
    return data as CreativeProject;
  }
  if (next === "changes_requested" && !note?.trim()) {
    throw new Error("Add a specific change request before returning production");
  }
  if (next === "approved" && bundle.project.client_id) {
    throw new Error("The client must approve this exact production package in their portal");
  }
  if (next === "approved" || next === "changes_requested") {
    return decideProjectPackage({
      bundle,
      decision: next,
      reviewerType: "staff",
      reviewerId: null,
      reviewerLabel: "8E Studio",
      note,
    });
  }
  return atomicTransition(bundle.project, next, note, "staff");
}

async function decideProjectPackage(input: {
  bundle: CreativeProjectBundle;
  decision: "approved" | "changes_requested";
  reviewerType: "staff" | "client";
  reviewerId: string | null;
  reviewerLabel: string,
  note?: string;
}): Promise<CreativeProject> {
  const manifest = revisionManifest(input.bundle);
  if (
    manifest.length !==
    input.bundle.artifacts.filter((entry) => entry.artifact.required).length
  ) {
    throw new Error("Every required artifact needs a selected revision before approval");
  }
  const { data, error } = await getPortalDb().rpc("creative_decide_project", {
    p_id: input.bundle.project.id,
    p_expected: input.bundle.project.status,
    p_lock_version: input.bundle.project.lock_version,
    p_manifest: manifest,
    p_decision: input.decision,
    p_reviewer_type: input.reviewerType,
    p_reviewer_id: input.reviewerId,
    p_reviewer_label: input.reviewerLabel,
    p_note: input.note ?? null,
  });
  if (error?.message.includes("STALE_")) {
    throw new Error("The selected production revisions changed. Refresh before deciding.");
  }
  throwIfError(error);
  return data as CreativeProject;
}

export async function decideCreativeProjectForClient(input: {
  projectId: string;
  clientId: string;
  reviewerLabel: string;
  decision: "approved" | "changes_requested";
  note?: string;
}): Promise<CreativeProject> {
  const bundle = await getCreativeProjectBundle(input.projectId);
  if (bundle.project.client_id !== input.clientId || !bundle.project.client_visible) {
    throw new Error("Unknown production project");
  }
  if (bundle.project.status !== "in_review") {
    throw new Error("This production package is no longer awaiting review");
  }
  if (input.decision === "changes_requested" && !input.note?.trim()) {
    throw new Error("Tell the studio what to change");
  }
  return decideProjectPackage({
    bundle,
    decision: input.decision,
    reviewerType: "client",
    reviewerId: input.clientId,
    reviewerLabel: input.reviewerLabel,
    note: input.note,
  });
}

export async function launchCreativeProject(id: string): Promise<{ created: number }> {
  const bundle = await getCreativeProjectBundle(id);
  if (!["approved", "released"].includes(bundle.project.status)) {
    throw new Error("The exact production package must be approved before distribution drafts");
  }
  const qa = await executeCreativeQa(bundle);
  if (qa.status !== "passed") throw new Error("Run and pass production QA before distribution");
  const master = bundle.rights.find(
    (asset) => asset.asset_type === "final_master" && asset.status === "cleared"
  );
  if (!master) {
    throw new Error("Add a cleared final master URL in Assets & Rights before distribution");
  }
  if (
    master.allowed_channels.length > 0 &&
    bundle.project.channels.some((channel) => !master.allowed_channels.includes(channel))
  ) {
    throw new Error("The final master license does not cover every selected distribution channel");
  }
  const captions = bundle.artifacts.find(
    (entry) => entry.artifact.artifact_type === "caption_set"
  );
  if (!captions?.selectedRevision) throw new Error("Select approved channel copy before distribution");
  const approved = bundle.reviews.some(
    (review) =>
      review.revision_id === captions.selectedRevision!.id &&
      review.content_hash === captions.selectedRevision!.content_hash &&
      review.decision === "approved"
  );
  if (!approved) throw new Error("Channel copy approval does not match the selected revision");

  const content = captions.selectedRevision.content as CaptionSetContent;
  const groups = new Map<string, CaptionSetContent["variants"]>();
  for (const variant of content.variants) {
    const logicalKey = variant.key.replace(`-${variant.channel}`, "");
    groups.set(logicalKey, [...(groups.get(logicalKey) ?? []), variant]);
  }
  let created = 0;
  for (const [key, variants] of groups) {
    try {
      await createPipelinePost({
        clientId: bundle.project.client_id,
        summary: variants[0].copy,
        variants: Object.fromEntries(variants.map((variant) => [variant.channel, variant.copy])),
        media: [{ url: master.source_url, type: "video", label: master.label }],
        accountIds: bundle.campaign?.social_account_ids ?? [],
        status: "draft",
        category: `Production · ${bundle.project.name}`,
        createdBy: "creative-production-os",
        growthCampaignId: bundle.project.growth_campaign_id ?? undefined,
        creativeProjectId: bundle.project.id,
        creativeSourceRevisionId: captions.selectedRevision.id,
        creativeApprovedHash: captions.selectedRevision.content_hash,
        creativeContentKey: key,
      });
      created += 1;
    } catch (error) {
      if (error instanceof Error && /duplicate|unique/i.test(error.message)) continue;
      throw error;
    }
  }
  if (bundle.project.status === "approved") {
    await atomicTransition(bundle.project, "released", "Distribution drafts created.", "staff");
  }
  return { created };
}
