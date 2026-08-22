import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductionProjectActions } from "@/components/production/ProductionProjectActions";
import { ProductionRightsActions } from "@/components/production/ProductionRightsActions";
import { ProductionRightsForm } from "@/components/production/ProductionRightsForm";
import { SeoBriefEditor } from "@/components/production/SeoBriefEditor";
import { ShotPlanEditor } from "@/components/production/ShotPlanEditor";
import { ScriptLabEditor } from "@/components/production/ScriptLabEditor";
import { getCreativeProjectBundle } from "@/lib/production/service";
import type {
  CaptionSetContent,
  HookSetContent,
  RepurposedContent,
  ScriptContent,
  SeoBriefContent,
  ShotListContent,
  StoryboardContent,
  ThumbnailBriefContent,
} from "@/lib/production/types";

export const dynamic = "force-dynamic";

const STAGES = [
  "planning",
  "in_production",
  "in_review",
  "approved",
  "released",
  "completed",
] as const;

export default async function ProductionProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let bundle: Awaited<ReturnType<typeof getCreativeProjectBundle>>;
  try {
    bundle = await getCreativeProjectBundle(id);
  } catch {
    notFound();
  }
  const { project, campaign, opportunity, artifacts, rights, reviews, qaRuns } = bundle;
  const artifact = (type: string) =>
    artifacts.find((entry) => entry.artifact.artifact_type === type);
  const hooksEntry = artifact("hook_set")!;
  const scriptEntry = artifact("script")!;
  const hooks = hooksEntry.currentRevision.content as HookSetContent;
  const script = scriptEntry.currentRevision.content as ScriptContent;
  const shots = artifact("shot_list")!.currentRevision.content as ShotListContent;
  const storyboard = artifact("storyboard")!.currentRevision.content as StoryboardContent;
  const seo = artifact("seo_brief")!.currentRevision.content as SeoBriefContent;
  const captions = artifact("caption_set")!.currentRevision.content as CaptionSetContent;
  const thumbnail = artifact("thumbnail_brief")!.currentRevision.content as ThumbnailBriefContent;
  const repurposed = artifact("repurposed_content")!.currentRevision.content as RepurposedContent;
  const latestQa = qaRuns[0] ?? null;
  const editable = ["planning", "in_production", "changes_requested"].includes(project.status);
  const rightsEditable = !["completed", "archived"].includes(project.status);
  const stageIndex = STAGES.indexOf(
    project.status === "changes_requested" ? "in_production" : project.status as (typeof STAGES)[number]
  );

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <Link href="/invoicing/production" className="inv-back-link">← Creative Production</Link>
          <h1 className="inv-page-title" style={{ marginTop: 10 }}>{project.name}</h1>
          <p className="inv-page-subtitle">
            {project.production_type.replaceAll("_", " ")} · {project.target_duration_seconds}s target · source campaign v{campaign?.brief_version ?? "—"}
          </p>
        </div>
        <span className="inv-badge inv-badge-open">{project.status.replaceAll("_", " ")}</span>
      </div>

      <ol className="prod-stage-rail">
        {STAGES.map((stage, index) => (
          <li key={stage} className={index <= stageIndex ? "active" : ""}>
            <span>{index + 1}</span>
            <strong>{stage.replaceAll("_", " ")}</strong>
          </li>
        ))}
      </ol>

      {project.review_note ? (
        <div className="inv-alert inv-alert-error" style={{ marginBottom: 20 }}>
          <strong>Review note:</strong> {project.review_note}
        </div>
      ) : null}

      <div className="prod-project-layout">
        <main className="space-y-8">
          <section>
            <div className="inv-section-heading">
              <div><h2>Script Lab</h2><p>Select the hook, tune timed beats, and save immutable revisions.</p></div>
            </div>
            <ScriptLabEditor
              projectId={project.id}
              initialHooks={hooks}
              initialScript={script}
              hookRevision={hooksEntry.currentRevision.revision_number}
              scriptRevision={scriptEntry.currentRevision.revision_number}
              editable={editable}
            />
          </section>

          <section>
            <div className="inv-section-heading">
              <div><h2>Shot plan</h2><p>Every required script beat maps to a production-ready shot.</p></div>
            </div>
            <ShotPlanEditor
              projectId={project.id}
              initial={shots}
              revision={artifact("shot_list")!.currentRevision.revision_number}
              editable={editable}
            />
          </section>

          <section>
            <div className="inv-section-heading">
              <div><h2>Storyboard</h2><p>Concept frames guide production; they are never treated as cleared final media.</p></div>
            </div>
            <div className="prod-storyboard-grid">
              {storyboard.frames.map((frame) => (
                <article key={frame.id} className="inv-card prod-frame">
                  <div className="prod-frame-canvas">
                    <span>{String(frame.frameNumber).padStart(2, "0")}</span>
                    <strong>{frame.overlayText || "Visual beat"}</strong>
                  </div>
                  <div className="prod-frame-copy">
                    <p>{frame.compositionNote}</p>
                    <span>Concept only · shot {frame.shotId.replace("shot-", "")}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="prod-two-column">
            <SeoBriefEditor
              projectId={project.id}
              initial={seo}
              revision={artifact("seo_brief")!.currentRevision.revision_number}
              editable={editable}
            />

            <div className="inv-card">
              <div className="inv-detail-section">
                <div className="inv-detail-label">Thumbnail direction</div>
                <div className="prod-thumbnail">
                  <span>Thumbnail headline</span>
                  <strong>{thumbnail.headline}</strong>
                </div>
                <p className="growth-post-copy"><strong>Visual focus:</strong> {thumbnail.visualFocus}</p>
                <p className="growth-post-copy"><strong>Composition:</strong> {thumbnail.composition}</p>
                <p className="growth-post-copy"><strong>Contrast:</strong> {thumbnail.contrastPlan}</p>
              </div>
            </div>
          </section>

          <section>
            <div className="inv-section-heading"><div><h2>Copy & repurposing</h2><p>One approved source becomes a controlled family of channel deliverables.</p></div></div>
            <div className="prod-two-column">
              <div className="inv-card">
                <div className="inv-detail-section">
                  <div className="inv-detail-label">Channel variants</div>
                  <div className="space-y-3" style={{ marginTop: 12 }}>
                    {captions.variants.map((variant) => (
                      <details key={variant.key} className="prod-copy-card">
                        <summary>{variant.channel} · {variant.key}</summary>
                        <p>{variant.copy}</p>
                        <a href={variant.trackedUrl} className="inv-link" target="_blank" rel="noopener noreferrer">Tracked destination ↗</a>
                      </details>
                    ))}
                  </div>
                </div>
              </div>
              <div className="inv-card">
                <div className="inv-detail-section">
                  <div className="inv-detail-label">Repurposing matrix</div>
                  <div className="prod-repurpose-grid">
                    {repurposed.derivatives.map((item) => (
                      <div key={item.key}><span>{item.format.replaceAll("_", " ")}</span><strong>{item.purpose}</strong><small>{item.sourceBeatIds.length} source beats</small></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="inv-card">
            <div className="inv-detail-section">
              <div className="inv-detail-label">Assets & rights</div>
              <p className="inv-page-subtitle">
                Register source files, releases, licenses, music, and the final master. Pending or expired rights block approval.
              </p>
              <div className="inv-table-wrap" style={{ marginTop: 14 }}>
                <table className="inv-table">
                  <thead><tr><th>Asset</th><th>Type</th><th>Owner</th><th>Basis</th><th>Status</th><th>Rights</th><th /></tr></thead>
                  <tbody>
                    {rights.length === 0 ? (
                      <tr><td colSpan={7} className="inv-table-empty">No external production assets registered yet.</td></tr>
                    ) : rights.map((item) => (
                      <tr key={item.id}>
                        <td className="inv-table-primary">{item.label}</td>
                        <td>{item.asset_type.replaceAll("_", " ")}</td>
                        <td>{item.owner_name}</td>
                        <td>{item.rights_basis.replaceAll("_", " ")}</td>
                        <td><span className={`inv-badge ${item.status === "cleared" ? "inv-badge-paid" : "inv-badge-overdue"}`}>{item.status}</span></td>
                        <td>{rightsEditable ? <ProductionRightsActions projectId={project.id} assetId={item.id} status={item.status} /> : null}</td>
                        <td><a href={item.source_url} target="_blank" rel="noopener noreferrer" className="inv-link">Open ↗</a></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rightsEditable ? <div style={{ marginTop: 18 }}><ProductionRightsForm projectId={project.id} channels={project.channels} /></div> : null}
            </div>
          </section>

          <section className="inv-card">
            <div className="inv-detail-section">
              <div className="flex items-center justify-between gap-3">
                <div className="inv-detail-label">Quality assurance</div>
                {latestQa ? <span className={`inv-badge ${latestQa.status === "passed" ? "inv-badge-paid" : "inv-badge-overdue"}`}>{latestQa.status}</span> : null}
              </div>
              {latestQa ? (
                <div className="prod-qa-grid" style={{ marginTop: 12 }}>
                  {latestQa.results.map((result) => (
                    <div key={result.id} className={result.status}>
                      <span>{result.severity}</span>
                      <strong>{result.message}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="inv-page-subtitle">QA runs automatically when the package is submitted for review.</p>
              )}
            </div>
          </section>
        </main>

        <aside>
          <ProductionProjectActions projectId={project.id} status={project.status} hasClient={Boolean(project.client_id)} />
          <div className="inv-card" style={{ marginTop: 16 }}>
            <div className="inv-detail-section">
              <div className="inv-detail-label">Evidence & provenance</div>
              <dl className="growth-meta-list">
                <div><dt>Campaign</dt><dd>{campaign?.name ?? "Direct"}</dd></div>
                <div><dt>Opportunity</dt><dd>{opportunity?.category ?? "Campaign"}</dd></div>
                <div><dt>Recipe</dt><dd>{String(project.source_manifest.recipeVersion ?? "—")}</dd></div>
                <div><dt>Lock version</dt><dd>{project.lock_version}</dd></div>
                <div><dt>Reviews</dt><dd>{reviews.length}</dd></div>
              </dl>
              {campaign ? <Link href={`/invoicing/growth/campaigns/${campaign.id}`} className="inv-link">Open source campaign →</Link> : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
