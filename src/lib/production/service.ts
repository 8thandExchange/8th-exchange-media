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
  if (existing) return existing;

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
    let generated = generateCreativePackage({
      campaign,
      opportunity,
      productionType: input.productionType,
      targetDurationSeconds: input.targetDurationSeconds,
      brandKeywords: brandKit?.keywords ?? [],
      internalLinks: links,
    });
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
      targetDurationSeconds: input.targetDurationSeconds,
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
  const duplicate = entry.revisions.find((revision) => revision.content_hash === hash);
  if (duplicate) return duplicate;

  const { data: revision, error } = await getPortalDb()
    .from("creative_artifact_revisions")
    .insert({
      artifact_id: entry.artifact.id,
      revision_number: Math.max(...entry.revisions.map((item) => item.revision_number), 0) + 1,
      schema_key: entry.currentRevision.schema_key,
      schema_version: entry.currentRevision.schema_version,
      content: input.content,
      content_hash: hash,
      generation_method: "manual",
      created_by: input.createdBy ?? "staff",
    })
    .select("*")
    .single();
  throwIfError(error);
  const { error: updateError } = await getPortalDb()
    .from("creative_artifacts")
    .update({
      current_revision_id: revision.id,
      selected_revision_id: revision.id,
      state: "working",
      updated_at: new Date().toISOString(),
    })
    .eq("id", entry.artifact.id);
  throwIfError(updateError);
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
  const now = new Date().toISOString();
  const { data, error } = await getPortalDb()
    .from("creative_rights_assets")
    .insert({
      project_id: input.projectId,
      client_id: bundle.project.client_id,
      label: input.label,
      asset_type: input.assetType,
      source_url: input.sourceUrl,
      owner_name: input.ownerName,
      rights_basis: input.rightsBasis,
      status: input.status,
      allowed_channels: input.allowedChannels,
      allowed_territories: input.allowedTerritories,
      modification_allowed: input.modificationAllowed,
      expires_at: input.expiresAt ?? null,
      evidence_url: input.evidenceUrl || null,
      restrictions: input.restrictions || null,
      cleared_by: input.status === "cleared" ? "staff" : null,
      cleared_at: input.status === "cleared" ? now : null,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data as CreativeRightsAsset;
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
  }
  if (next === "changes_requested" && !note?.trim()) {
    throw new Error("Add a specific change request before returning production");
  }
  if (next === "approved" && bundle.project.client_id) {
    throw new Error("The client must approve this exact production package in their portal");
  }
  const transitioned = await atomicTransition(bundle.project, next, note, "staff");
  if (next === "in_review") {
    const { error: visibilityError } = await getPortalDb()
      .from("creative_projects")
      .update({ client_visible: Boolean(bundle.project.client_id) })
      .eq("id", id);
    throwIfError(visibilityError);
    const { error: artifactError } = await getPortalDb()
      .from("creative_artifacts")
      .update({ state: "in_review" })
      .eq("project_id", id)
      .eq("required", true);
    throwIfError(artifactError);
  }
  if (next === "changes_requested") {
    const { error } = await getPortalDb()
      .from("creative_artifacts")
      .update({ state: "changes_requested" })
      .eq("project_id", id)
      .eq("required", true);
    throwIfError(error);
  }
  if (next === "in_production" && bundle.project.status === "changes_requested") {
    const { error } = await getPortalDb()
      .from("creative_artifacts")
      .update({ state: "working" })
      .eq("project_id", id)
      .eq("required", true);
    throwIfError(error);
  }
  if (next === "approved") {
    await recordProjectApproval(bundle, "staff", "8E Studio", note);
  }
  return transitioned;
}

async function recordProjectApproval(
  bundle: CreativeProjectBundle,
  reviewerType: "staff" | "client",
  reviewerLabel: string,
  note?: string
): Promise<void> {
  const selected = bundle.artifacts
    .filter((entry) => entry.artifact.required && entry.selectedRevision)
    .map((entry) => entry.selectedRevision!);
  if (selected.length !== bundle.artifacts.filter((entry) => entry.artifact.required).length) {
    throw new Error("Every required artifact needs a selected revision before approval");
  }
  const db = getPortalDb();
  const { error: reviewError } = await db.from("creative_reviews").insert(
    selected.map((revision) => ({
      project_id: bundle.project.id,
      revision_id: revision.id,
      gate_key: "production-package",
      decision: "approved",
      reviewer_type: reviewerType,
      reviewer_id: reviewerType === "client" ? bundle.project.client_id : null,
      reviewer_label: reviewerLabel,
      note: note?.trim() || null,
      content_hash: revision.content_hash,
    }))
  );
  throwIfError(reviewError);
  const now = new Date().toISOString();
  const { error: artifactError } = await db
    .from("creative_artifacts")
    .update({ state: "approved", updated_at: now })
    .eq("project_id", bundle.project.id)
    .eq("required", true);
  throwIfError(artifactError);
  const { error: projectError } = await db
    .from("creative_projects")
    .update({
      approved_by: reviewerLabel,
      approved_at: now,
      client_visible: Boolean(bundle.project.client_id),
    })
    .eq("id", bundle.project.id);
  throwIfError(projectError);
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
  const next = input.decision === "approved" ? "approved" : "changes_requested";
  const transitioned = await atomicTransition(
    bundle.project,
    next,
    input.note,
    "client"
  );
  if (next === "approved") {
    await recordProjectApproval(bundle, "client", input.reviewerLabel, input.note);
  } else {
    const selected = bundle.artifacts
      .filter((entry) => entry.artifact.required && entry.selectedRevision)
      .map((entry) => entry.selectedRevision!);
    const { error } = await getPortalDb().from("creative_reviews").insert(
      selected.map((revision) => ({
        project_id: bundle.project.id,
        revision_id: revision.id,
        gate_key: "production-package",
        decision: "changes_requested",
        reviewer_type: "client",
        reviewer_id: input.clientId,
        reviewer_label: input.reviewerLabel,
        note: input.note!.trim(),
        content_hash: revision.content_hash,
      }))
    );
    throwIfError(error);
    await getPortalDb()
      .from("creative_artifacts")
      .update({ state: "changes_requested" })
      .eq("project_id", bundle.project.id)
      .eq("required", true);
  }
  return transitioned;
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
