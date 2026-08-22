import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProductionReviewActions } from "@/components/production/ProductionReviewActions";
import { requirePortalClient } from "@/lib/portal/auth";
import { getCreativeProjectBundle } from "@/lib/production/service";
import type {
  HookSetContent,
  ScriptContent,
  SeoBriefContent,
  ShotListContent,
  StoryboardContent,
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
  if (bundle.project.client_id !== clientId || !bundle.project.client_visible) notFound();
  const entry = (type: string) =>
    bundle.artifacts.find((item) => item.artifact.artifact_type === type)!;
  const hooks = entry("hook_set").selectedRevision?.content as HookSetContent;
  const script = entry("script").selectedRevision?.content as ScriptContent;
  const shots = entry("shot_list").selectedRevision?.content as ShotListContent;
  const storyboard = entry("storyboard").selectedRevision?.content as StoryboardContent;
  const seo = entry("seo_brief").selectedRevision?.content as SeoBriefContent;
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
            <div className="inv-detail-label">Selected creative direction</div>
            <div className="prod-client-hook">
              <span>{selectedHook?.framework ?? "hook"}</span>
              <strong>{selectedHook?.spokenText}</strong>
              <p>On screen: {selectedHook?.onScreenText}</p>
            </div>
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
