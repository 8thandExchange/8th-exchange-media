import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GrowthCampaignActions } from "@/components/growth/GrowthCampaignActions";
import { StartProductionButton } from "@/components/production/StartProductionButton";
import { ASSET_DIMENSIONS } from "@/lib/growth/graphics";
import { calculateMetricResult } from "@/lib/growth/reporting";
import { getCampaignBundle } from "@/lib/growth/service";
import { getCreativeProjectForCampaign } from "@/lib/production/service";

export const dynamic = "force-dynamic";

function displayNumber(value: number, unit: string): string {
  if (unit === "currency") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
  if (unit === "percent") return `${value}%`;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export default async function GrowthCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let bundle: Awaited<ReturnType<typeof getCampaignBundle>>;
  try {
    bundle = await getCampaignBundle(id);
  } catch {
    notFound();
  }
  const { campaign, opportunity, assets, metrics } = bundle;
  const production = await getCreativeProjectForCampaign(campaign.id).catch(() => null);

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <Link href="/invoicing/growth" className="inv-back-link">← Growth OS</Link>
          <h1 className="inv-page-title" style={{ marginTop: 10 }}>{campaign.name}</h1>
          <p className="inv-page-subtitle">{campaign.objective}</p>
        </div>
        <span className="inv-badge inv-badge-open">{campaign.status.replaceAll("_", " ")}</span>
      </div>

      <div className="growth-campaign-layout">
        <div className="space-y-5">
          <section className="inv-card">
            <div className="inv-detail-section">
              <div className="inv-detail-label">Evidence → hypothesis</div>
              {opportunity ? (
                <div className="growth-evidence-block">
                  <span>{opportunity.category} · priority {Number(opportunity.priority_score).toFixed(1)}</span>
                  <h2>{opportunity.title}</h2>
                  <p>{campaign.brief.evidence.finding}</p>
                  {campaign.brief.evidence.pageUrl ? (
                    <a href={campaign.brief.evidence.pageUrl} target="_blank" rel="noopener noreferrer" className="inv-link">Open evidence page ↗</a>
                  ) : null}
                </div>
              ) : null}
              <div className="growth-hypothesis">
                <span>Campaign hypothesis</span>
                <p>{campaign.brief.hypothesis}</p>
              </div>
            </div>
          </section>

          <section>
            <div className="inv-section-heading"><div><h2>Creative system</h2><p>Three locked templates rendered automatically in square, portrait, and story formats.</p></div></div>
            <div className="growth-asset-grid">
              {assets.map((asset) => {
                const size = ASSET_DIMENSIONS[asset.format];
                return (
                  <figure key={asset.id} className="inv-card growth-asset-card">
                    <Image
                      src={`/api/growth/assets/${asset.id}/${asset.public_token}?preview=1`}
                      alt={asset.alt_text}
                      width={size.width}
                      height={size.height}
                      unoptimized
                    />
                    <figcaption>
                      <span>{asset.template_key}</span>
                      <span>{asset.format} · v{asset.version}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </section>

          <section>
            <div className="inv-section-heading"><div><h2>Launch content</h2><p>Each draft remains editable and requires the existing social approval workflow.</p></div></div>
            <div className="space-y-3">
              {campaign.brief.posts.map((post) => (
                <article key={post.key} className="inv-card">
                  <div className="inv-detail-section">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inv-detail-label">{post.angle}</div>
                      <span className="inv-badge inv-badge-draft">{post.assetTemplate}</span>
                    </div>
                    <p className="growth-post-copy">{post.summary}</p>
                    {Object.keys(post.variants).length > 0 ? (
                      <details className="growth-variants">
                        <summary>Channel variants</summary>
                        {Object.entries(post.variants).map(([channel, copy]) => (
                          <div key={channel}><strong>{channel}</strong><p>{copy}</p></div>
                        ))}
                      </details>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <div className="inv-section-heading"><div><h2>Measurement</h2><p>Reported values remain tied to source and period. Direction is not presented as causation.</p></div></div>
            <div className="growth-metric-grid">
              {metrics.map((metric) => {
                const result = calculateMetricResult(metric, metric.measurements);
                return (
                  <div key={metric.id} className="inv-card growth-metric-card">
                    <span>{metric.label}</span>
                    <strong>
                      {result.latest ? displayNumber(result.latest.value, metric.unit) : "Awaiting result"}
                    </strong>
                    <p>
                      Baseline {displayNumber(metric.baseline_value, metric.unit)} · target {displayNumber(metric.target_value, metric.unit)}
                    </p>
                    {result.changePercent !== null ? (
                      <p className={result.targetMet ? "growth-positive" : ""}>
                        {result.changePercent > 0 ? "+" : ""}{result.changePercent.toFixed(1)}% from baseline
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="inv-card">
            <div className="inv-detail-section">
              <div className="inv-detail-label">Guardrails</div>
              <ul className="growth-guardrails">
                {campaign.brief.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
              </ul>
            </div>
          </section>
        </div>

        <aside>
          <GrowthCampaignActions
            campaignId={campaign.id}
            status={campaign.status}
            metrics={metrics}
          />
          {production ? (
            <div className="inv-card" style={{ marginTop: 16 }}>
              <div className="inv-detail-section">
                <div className="inv-detail-label">Creative Production</div>
                <p className="inv-page-subtitle">
                  Script Lab, shot plan, storyboard, SEO, rights, QA, and client review.
                </p>
                <Link
                  href={`/invoicing/production/${production.id}`}
                  className="inv-btn inv-btn-secondary"
                  style={{ marginTop: 12 }}
                >
                  Open production package
                </Link>
              </div>
            </div>
          ) : ["approved", "active", "completed"].includes(campaign.status) ? (
            <div className="inv-card" style={{ marginTop: 16 }}>
              <div className="inv-detail-section">
                <div className="inv-detail-label">Creative Production</div>
                <p className="inv-page-subtitle">
                  Build the script, shots, storyboard, SEO brief, copy variants, and QA package.
                </p>
                <div style={{ marginTop: 12 }}>
                  <StartProductionButton campaignId={campaign.id} />
                </div>
              </div>
            </div>
          ) : null}
          <div className="inv-card" style={{ marginTop: 16 }}>
            <div className="inv-detail-section">
              <div className="inv-detail-label">Production record</div>
              <dl className="growth-meta-list">
                <div><dt>Generator</dt><dd>{campaign.generator}</dd></div>
                <div><dt>Brief version</dt><dd>{campaign.brief_version}</dd></div>
                <div><dt>Channels</dt><dd>{campaign.channels.join(", ")}</dd></div>
                <div><dt>Primary action</dt><dd>{campaign.primary_cta}</dd></div>
              </dl>
              <Link href={`/invoicing/social/pipeline${campaign.client_id ? `?client=${campaign.client_id}` : ""}`} className="inv-link">
                Open Content Pipeline →
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
