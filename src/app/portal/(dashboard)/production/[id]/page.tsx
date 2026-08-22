import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductionReviewActions } from "@/components/production/ProductionReviewActions";
import { requirePortalClient } from "@/lib/portal/auth";
import { getCreativeProjectBundle } from "@/lib/production/service";
import type {
  CaptionSetContent,
  HookSetContent,
  ProductionBriefContent,
  ScriptContent,
  SeoBriefContent,
  ShotListContent,
  StoryboardContent,
  ThumbnailBriefContent,
} from "@/lib/production/types";

export const dynamic = "force-dynamic";

export default async function ClientProductionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let clientId: string;
  try {
    clientId = await requirePortalClient();
  } catch {
    redirect("/portal/login");
  }
  const { id } = await params;
  let bundle: Awaited<ReturnType<typeof getCreativeProjectBundle>>;
  try {
    bundle = await getCreativeProjectBundle(id);
  } catch {
    notFound();
  }
  if (
    bundle.project.client_id !== clientId ||
    !bundle.project.client_visible ||
    !["in_review", "approved", "released", "completed"].includes(bundle.project.status)
  ) {
    notFound();
  }
  const entry = (type: string) =>
    bundle.artifacts.find((item) => item.artifact.artifact_type === type)!;
  const brief = entry("production_brief").selectedRevision?.content as ProductionBriefContent;
  const hooks = entry("hook_set").selectedRevision?.content as HookSetContent;
  const script = entry("script").selectedRevision?.content as ScriptContent;
  const shots = entry("shot_list").selectedRevision?.content as ShotListContent;
  const storyboard = entry("storyboard").selectedRevision?.content as StoryboardContent;
  const seo = entry("seo_brief").selectedRevision?.content as SeoBriefContent;
  const captions = entry("caption_set").selectedRevision?.content as CaptionSetContent;
  const thumbnail = entry("thumbnail_brief").selectedRevision?.content as ThumbnailBriefContent;
  const selectedHook = hooks.hooks.find((hook) => hook.selected);

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <Link href="/portal/production" className="inv-back-link">← Creative Production</Link>
          <h1 className="inv-page-title" style={{ marginTop: 10 }}>{bundle.project.name}</h1>
          <p className="inv-page-subtitle">
            Exact revision package · {bundle.project.target_duration_seconds}s {bundle.project.production_type.replaceAll("_", " ")}
          </p>
        </div>
        <span className="inv-badge inv-badge-open">{bundle.project.status.replaceAll("_", " ")}</span>
      </div>

      {bundle.project.status === "in_review" ? (
        <div className="inv-card" style={{ marginBottom: 24 }}>
          <div className="inv-detail-section">
            <div className="inv-detail-label">Your decision</div>
            <p className="inv-page-subtitle">
              Approval applies only to the exact selected revisions and their recorded hashes. Social publishing remains a separate approval.
            </p>
            <div style={{ marginTop: 16 }}><ProductionReviewActions projectId={bundle.project.id} /></div>
          </div>
        </div>
      ) : bundle.project.review_note ? (
        <div className="inv-alert" style={{ marginBottom: 24 }}>{bundle.project.review_note}</div>
      ) : null}

      <div className="space-y-6">
        <section className="inv-card">
          <div className="inv-detail-section">
            <div className="inv-detail-label">Frozen production brief</div>
            <div className="prod-client-summary">
              <div><strong>{brief.objective}</strong><span>objective</span></div>
              <div><strong>{brief.audience}</strong><span>audience</span></div>
              <div><strong>{brief.offer}</strong><span>offer</span></div>
              <div><strong>{brief.primaryCta}</strong><span>primary action</span></div>
            </div>
            <div className="growth-hypothesis">
              <span>Evidence</span>
              <p>{String(brief.evidence.finding ?? bundle.opportunity?.description ?? "Approved campaign evidence")}</p>
            </div>
            <details className="growth-variants">
              <summary>Deliverables and guardrails included in this approval</summary>
              <div><strong>Deliverables</strong>{brief.deliverables.map((item) => <p key={item}>{item}</p>)}</div>
              <div><strong>Guardrails</strong>{brief.guardrails.map((item) => <p key={item}>{item}</p>)}</div>
            </details>
          </div>
        </section>

        <section className="inv-card">
          <div className="inv-detail-section">
            <div className="inv-detail-label">Selected creative direction</div>
            <div className="prod-client-hook">
              <span>{selectedHook?.framework ?? "hook"}</span>
              <strong>{selectedHook?.spokenText}</strong>
              <p>On screen: {selectedHook?.onScreenText}</p>
            </div>
            <details className="growth-variants" style={{ marginTop: 14 }}>
              <summary>Review every hook option</summary>
              {hooks.hooks.map((hook) => (
                <div key={hook.id}>
                  <strong>{hook.framework}{hook.selected ? " · selected" : ""}</strong>
                  <p>{hook.spokenText}</p>
                  <p>On screen: {hook.onScreenText}</p>
                </div>
              ))}
            </details>
          </div>
        </section>

        <section>
          <div className="inv-section-heading"><div><h2>Timed script</h2><p>The exact spoken copy and visual intention for every beat.</p></div></div>
          <div className="space-y-3">
            {script.beats.map((beat, index) => (
              <article key={beat.id} className="inv-card">
                <div className="inv-detail-section prod-client-beat">
                  <span>{index + 1} · {beat.role} · {beat.estimatedSeconds}s</span>
                  <h3>{beat.spokenCopy}</h3>
                  <p><strong>On screen:</strong> {beat.onScreenCopy}</p>
                  <p><strong>Visual:</strong> {beat.visualIntent}</p>
                </div>
              </article>
            ))}
          </div>
          {script.disclaimers.length > 0 ? (
            <div className="inv-card" style={{ marginTop: 12 }}>
              <div className="inv-detail-section">
                <div className="inv-detail-label">Script disclaimers</div>
                <ul className="growth-guardrails">
                  {script.disclaimers.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>
          ) : null}
        </section>

        <section>
          <div className="inv-section-heading"><div><h2>Storyboard & shot plan</h2><p>{shots.shots.length} planned shots tied directly to the script.</p></div></div>
          <div className="prod-storyboard-grid">
            {storyboard.frames.map((frame) => {
              const shot = shots.shots.find((item) => item.id === frame.shotId);
              return (
                <article key={frame.id} className="inv-card prod-frame">
                  <div className="prod-frame-canvas">
                    <span>{String(frame.frameNumber).padStart(2, "0")}</span>
                    <strong>{frame.overlayText || "Visual beat"}</strong>
                  </div>
                  <div className="prod-frame-copy">
                    <p>{frame.compositionNote}</p>
                    <span>{shot?.framing.replaceAll("_", " ")} · {shot?.location}</span>
                    {shot ? (
                      <details className="growth-variants">
                        <summary>Full shot metadata</summary>
                        <p><strong>Subject:</strong> {shot.subject}</p>
                        <p><strong>Action:</strong> {shot.action}</p>
                        <p><strong>Audio:</strong> {shot.audio}</p>
                        <p><strong>Equipment:</strong> {shot.equipment}</p>
                        <p><strong>Talent:</strong> {shot.talent.join(", ") || "None specified"}</p>
                        <p><strong>Props:</strong> {shot.props.join(", ") || "None specified"}</p>
                      </details>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="inv-card">
          <div className="inv-detail-section">
            <div className="inv-detail-label">SEO and distribution rationale</div>
            <h2 className="prod-section-title">{seo.primaryKeyword.term}</h2>
            <p className="inv-page-subtitle">{seo.audienceQuestion}</p>
            <div className="prod-outline" style={{ marginTop: 14 }}>
              {seo.outline.map((item) => (
                <div key={item.heading}><strong>{item.heading}</strong><p>{item.purpose}</p></div>
              ))}
            </div>
            <details className="growth-variants" style={{ marginTop: 14 }}>
              <summary>Titles, descriptions, internal links, schema & FAQ</summary>
              <div><strong>Title options</strong>{seo.titleOptions.map((item) => <p key={item}>{item}</p>)}</div>
              <div><strong>Meta descriptions</strong>{seo.metaDescriptions.map((item) => <p key={item}>{item}</p>)}</div>
              <div><strong>Internal links</strong>{seo.internalLinks.map((item) => <p key={item.url}>{item.anchor} → {item.url}</p>)}</div>
              <div><strong>Schema recommendations</strong>{seo.schemaRecommendations.map((item) => <p key={item}>{item}</p>)}</div>
              <div><strong>FAQ questions</strong>{seo.faqQuestions.map((item) => <p key={item}>{item}</p>)}</div>
            </details>
          </div>
        </section>

        <section className="prod-two-column">
          <div className="inv-card">
            <div className="inv-detail-section">
              <div className="inv-detail-label">Approved channel copy</div>
              <div className="space-y-3" style={{ marginTop: 12 }}>
                {captions.variants.map((variant) => (
                  <details key={variant.key} className="prod-copy-card">
                    <summary>{variant.channel} · {variant.key}</summary>
                    <p>{variant.copy}</p>
                    <p><strong>CTA:</strong> {variant.cta}</p>
                    <p><strong>Tracked URL:</strong> {variant.trackedUrl}</p>
                    <p><strong>Alt text:</strong> {variant.altText}</p>
                  </details>
                ))}
              </div>
            </div>
          </div>
          <div className="inv-card">
            <div className="inv-detail-section">
              <div className="inv-detail-label">Thumbnail brief</div>
              <div className="prod-thumbnail">
                <span>Headline</span>
                <strong>{thumbnail.headline}</strong>
              </div>
              <p className="growth-post-copy"><strong>Visual:</strong> {thumbnail.visualFocus}</p>
              <p className="growth-post-copy"><strong>Composition:</strong> {thumbnail.composition}</p>
              <p className="growth-post-copy"><strong>Contrast:</strong> {thumbnail.contrastPlan}</p>
              <p className="growth-post-copy"><strong>Accessibility:</strong> {thumbnail.altText}</p>
            </div>
          </div>
        </section>

        <section className="inv-card">
          <div className="inv-detail-section">
            <div className="inv-detail-label">Rights and QA summary</div>
            <div className="prod-client-summary">
              <div><strong>{bundle.rights.length}</strong><span>registered assets</span></div>
              <div><strong>{bundle.rights.filter((item) => item.status === "cleared").length}</strong><span>rights cleared</span></div>
              <div><strong>{bundle.qaRuns[0]?.results.filter((item) => item.status === "passed").length ?? 0}</strong><span>QA checks passed</span></div>
              <div><strong>{bundle.reviews.length}</strong><span>recorded decisions</span></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
