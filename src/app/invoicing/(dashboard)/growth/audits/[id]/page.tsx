import Link from "next/link";
import { notFound } from "next/navigation";
import { GrowthCampaignForm } from "@/components/growth/GrowthCampaignForm";
import { getAuditBundle } from "@/lib/growth/service";
import { getClientById } from "@/lib/portal/service";
import { listAccountRegistry } from "@/lib/portal/social";

export const dynamic = "force-dynamic";

export default async function GrowthAuditDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ opportunity?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let bundle: Awaited<ReturnType<typeof getAuditBundle>>;
  try {
    bundle = await getAuditBundle(id);
  } catch {
    notFound();
  }

  const client = bundle.audit.client_id
    ? await getClientById(bundle.audit.client_id).catch(() => null)
    : null;
  const accounts = await listAccountRegistry(bundle.audit.client_id).catch(() => []);
  const selected = query.opportunity
    ? bundle.opportunities.find((opportunity) => opportunity.id === query.opportunity) ?? null
    : null;
  const summary = bundle.audit.summary;

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <Link href="/invoicing/growth" className="inv-back-link">← Growth OS</Link>
          <h1 className="inv-page-title" style={{ marginTop: 10 }}>
            {client?.company ?? "8E Media"} website audit
          </h1>
          <p className="inv-page-subtitle">
            {bundle.audit.website_url} · ruleset {bundle.audit.ruleset_version}
          </p>
        </div>
        <span className={`inv-badge ${bundle.audit.status === "failed" ? "inv-badge-overdue" : "inv-badge-paid"}`}>
          {bundle.audit.status}
        </span>
      </div>

      {bundle.audit.error ? (
        <div className={bundle.audit.status === "failed" ? "inv-alert inv-alert-error" : "inv-alert"} style={{ marginBottom: 20 }}>
          {bundle.audit.error}
        </div>
      ) : null}

      <div className="growth-score-grid">
        <div className="inv-card growth-score-card"><span>Pages scanned</span><strong>{summary.totalPages ?? bundle.pages.length}</strong></div>
        <div className="inv-card growth-score-card"><span>Healthy pages</span><strong>{summary.healthyPages ?? 0}</strong></div>
        <div className="inv-card growth-score-card"><span>Avg. words</span><strong>{summary.averageWordCount ?? 0}</strong></div>
        <div className="inv-card growth-score-card"><span>With clear CTA</span><strong>{summary.pagesWithPrimaryCta ?? 0}/{summary.totalPages ?? bundle.pages.length}</strong></div>
        <div className="inv-card growth-score-card"><span>With analytics</span><strong>{summary.pagesWithAnalytics ?? 0}/{summary.totalPages ?? bundle.pages.length}</strong></div>
        <div className="inv-card growth-score-card"><span>Opportunities</span><strong>{bundle.opportunities.length}</strong></div>
      </div>

      {selected ? (
        <div style={{ marginTop: 26, scrollMarginTop: 20 }} id="campaign-builder">
          <GrowthCampaignForm
            opportunity={selected}
            brandName={client?.company ?? "8th & Exchange Media"}
            destinationUrl={selected.audit_page_url ?? bundle.audit.website_url}
            accounts={accounts}
          />
        </div>
      ) : null}

      <section style={{ marginTop: 30 }}>
        <div className="inv-section-heading">
          <div>
            <h2>Prioritized opportunities</h2>
            <p>Priority = impact × confidence × inverse effort. AI cannot change these scores.</p>
          </div>
        </div>
        <div className="space-y-3">
          {bundle.opportunities.map((opportunity) => (
            <article key={opportunity.id} className="inv-card growth-opportunity">
              <div className="growth-opportunity-score">
                <strong>{Number(opportunity.priority_score).toFixed(1)}</strong>
                <span>priority</span>
              </div>
              <div className="growth-opportunity-body">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inv-badge inv-badge-open">{opportunity.category}</span>
                  <span className="growth-factors">
                    impact {opportunity.impact} · confidence {opportunity.confidence} · effort {opportunity.effort}
                  </span>
                </div>
                <h3>{opportunity.title}</h3>
                <p>{opportunity.description}</p>
                <div className="growth-recommendation">
                  <span>Recommended intervention</span>
                  <p>{opportunity.recommended_action}</p>
                </div>
                {opportunity.audit_page_url ? (
                  <a href={opportunity.audit_page_url} target="_blank" rel="noopener noreferrer" className="inv-link">
                    View evidence page ↗
                  </a>
                ) : null}
              </div>
              <div className="growth-opportunity-action">
                <Link
                  href={`/invoicing/growth/audits/${id}?opportunity=${opportunity.id}#campaign-builder`}
                  className="inv-btn inv-btn-secondary"
                >
                  Build campaign
                </Link>
              </div>
            </article>
          ))}
          {bundle.opportunities.length === 0 ? (
            <div className="inv-card"><div className="inv-empty"><p className="inv-empty-title">No scored opportunities.</p><p className="inv-empty-text">Review the page evidence below or run a broader audit.</p></div></div>
          ) : null}
        </div>
      </section>

      <section style={{ marginTop: 30 }}>
        <div className="inv-section-heading"><div><h2>Page evidence</h2><p>Objective observations captured during the crawl.</p></div></div>
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead><tr><th>Page</th><th>Status</th><th>Title / H1</th><th>Words</th><th>Signals</th></tr></thead>
            <tbody>
              {bundle.pages.map((page) => (
                <tr key={page.id}>
                  <td><a className="inv-link" href={page.url} target="_blank" rel="noopener noreferrer">{page.path}</a></td>
                  <td>{page.http_status ?? "failed"}</td>
                  <td><div className="inv-table-primary">{page.title ?? "No title"}</div><div className="inv-table-secondary">{page.h1s[0] ?? "No H1"}</div></td>
                  <td>{page.word_count}</td>
                  <td className="inv-table-secondary">
                    {page.facts.hasPrimaryCta ? "CTA" : "no CTA"} · {page.facts.hasForm ? "form" : "no form"} · {page.facts.hasOpenGraphImage ? "OG" : "no OG"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
