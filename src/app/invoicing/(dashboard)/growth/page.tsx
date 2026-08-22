import Link from "next/link";
import { GrowthAuditForm } from "@/components/growth/GrowthAuditForm";
import { listAudits, listCampaigns } from "@/lib/growth/service";
import { listClients } from "@/lib/portal/service";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function hostname(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0];
  }
}

export default async function GrowthOperatingSystemPage() {
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  let audits: Awaited<ReturnType<typeof listAudits>> = [];
  let campaigns: Awaited<ReturnType<typeof listCampaigns>> = [];
  const errors: string[] = [];

  const [clientsResult, auditsResult, campaignsResult] = await Promise.allSettled([
    listClients(),
    listAudits(),
    listCampaigns(),
  ]);
  if (clientsResult.status === "fulfilled") clients = clientsResult.value.filter((client) => client.active);
  else errors.push("Client roster");
  if (auditsResult.status === "fulfilled") audits = auditsResult.value;
  else errors.push("Audit history");
  if (campaignsResult.status === "fulfilled") campaigns = campaignsResult.value;
  else errors.push("Campaign history");

  const completedAudits = audits.filter((audit) => ["completed", "partial"].includes(audit.status));
  const activeCampaigns = campaigns.filter((campaign) =>
    ["in_review", "approved", "active"].includes(campaign.status)
  );

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Growth Operating System</h1>
          <p className="inv-page-subtitle">
            Audit evidence → opportunities → branded campaign systems → approvals → measured outcomes.
          </p>
        </div>
      </div>

      {errors.length ? (
        <div className="inv-alert inv-alert-error" style={{ marginBottom: 20 }}>
          {errors.join(", ")} could not be loaded from Supabase. The rest of the Studio remains available.
        </div>
      ) : null}

      <div className="inv-stat-grid">
        <div className="inv-card inv-stat-card">
          <div className="inv-stat-label">Evidence audits</div>
          <div className="inv-stat-value">{completedAudits.length}</div>
        </div>
        <div className="inv-card inv-stat-card">
          <div className="inv-stat-label">Campaign systems</div>
          <div className="inv-stat-value">{campaigns.length}</div>
        </div>
        <div className="inv-card inv-stat-card">
          <div className="inv-stat-label">Active decisions</div>
          <div className="inv-stat-value">{activeCampaigns.length}</div>
        </div>
      </div>

      <GrowthAuditForm
        clients={clients.map((client) => ({
          id: client.id,
          company: client.company,
          website: client.website,
        }))}
      />

      <section style={{ marginTop: 28 }}>
        <div className="inv-section-heading">
          <div>
            <h2>Audit history</h2>
            <p>Every recommendation stays connected to the page evidence that produced it.</p>
          </div>
        </div>
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Website</th>
                <th>Status</th>
                <th>Pages</th>
                <th>Started</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr><td colSpan={5} className="inv-table-empty">No audits yet. Start with 8E Media above.</td></tr>
              ) : (
                audits.map((audit) => (
                  <tr key={audit.id}>
                    <td>
                      <div className="inv-table-primary">{hostname(audit.website_url)}</div>
                      <div className="inv-table-secondary">{audit.website_url}</div>
                    </td>
                    <td><span className={`inv-badge ${audit.status === "failed" ? "inv-badge-overdue" : audit.status === "running" ? "inv-badge-open" : "inv-badge-paid"}`}>{audit.status}</span></td>
                    <td>{audit.pages_scanned}</td>
                    <td>{formatDate(audit.started_at)}</td>
                    <td><Link className="inv-link" href={`/invoicing/growth/audits/${audit.id}`}>Open audit →</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ marginTop: 28 }}>
        <div className="inv-section-heading">
          <div>
            <h2>Campaign systems</h2>
            <p>Creative, approvals, distribution drafts, and measurement in one chain of custody.</p>
          </div>
        </div>
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead><tr><th>Campaign</th><th>Status</th><th>Generator</th><th>Created</th><th /></tr></thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr><td colSpan={5} className="inv-table-empty">Campaigns begin from an accepted audit opportunity.</td></tr>
              ) : (
                campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td><div className="inv-table-primary">{campaign.name}</div><div className="inv-table-secondary">{campaign.objective}</div></td>
                    <td><span className="inv-badge inv-badge-open">{campaign.status.replaceAll("_", " ")}</span></td>
                    <td>{campaign.generator}</td>
                    <td>{formatDate(campaign.created_at)}</td>
                    <td><Link className="inv-link" href={`/invoicing/growth/campaigns/${campaign.id}`}>Open campaign →</Link></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
