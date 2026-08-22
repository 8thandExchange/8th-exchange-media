import Link from "next/link";
import { listClients } from "@/lib/portal/service";
import { listCreativeProjects } from "@/lib/production/service";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function CreativeProductionPage() {
  const [projectsResult, clientsResult] = await Promise.allSettled([
    listCreativeProjects(),
    listClients(),
  ]);
  const projects = projectsResult.status === "fulfilled" ? projectsResult.value : [];
  const clients = clientsResult.status === "fulfilled" ? clientsResult.value : [];
  const company = (clientId: string | null) =>
    clientId ? clients.find((client) => client.id === clientId)?.company ?? "Client" : "8E Media";
  const active = projects.filter((project) =>
    ["planning", "in_production", "in_review", "changes_requested"].includes(project.status)
  );
  const waiting = projects.filter((project) => project.status === "in_review");
  const approved = projects.filter((project) =>
    ["approved", "released", "completed"].includes(project.status)
  );

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Creative Production</h1>
          <p className="inv-page-subtitle">
            Script Lab, shot planning, storyboards, SEO, rights, QA, client review, and repurposing.
          </p>
        </div>
        <Link href="/invoicing/growth" className="inv-btn inv-btn-secondary">
          Start from Growth OS
        </Link>
      </div>

      {projectsResult.status === "rejected" ? (
        <div className="inv-alert inv-alert-error" style={{ marginBottom: 20 }}>
          Production projects could not be loaded from Supabase. Invoicing and social remain available.
        </div>
      ) : null}

      <div className="inv-stat-grid">
        <div className="inv-card inv-stat-card"><div className="inv-stat-label">Active packages</div><div className="inv-stat-value">{active.length}</div></div>
        <div className="inv-card inv-stat-card"><div className="inv-stat-label">Awaiting review</div><div className="inv-stat-value">{waiting.length}</div></div>
        <div className="inv-card inv-stat-card"><div className="inv-stat-label">Approved / released</div><div className="inv-stat-value">{approved.length}</div></div>
      </div>

      <div className="inv-card prod-principle">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Production rule</div>
          <p>
            AI prepares options and improves language. People select the concept, direct the production,
            clear the rights, approve the exact revision, and decide what represents the brand.
          </p>
        </div>
      </div>

      <section style={{ marginTop: 28 }}>
        <div className="inv-section-heading">
          <div><h2>Production board</h2><p>Every project begins with an approved evidence-backed campaign.</p></div>
        </div>
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead><tr><th>Project</th><th>Brand</th><th>Format</th><th>Status</th><th>Updated</th><th /></tr></thead>
            <tbody>
              {projects.length === 0 ? (
                <tr><td colSpan={6} className="inv-table-empty">Approve a Growth OS campaign, then start its production package.</td></tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id}>
                    <td><div className="inv-table-primary">{project.name}</div><div className="inv-table-secondary">{project.objective}</div></td>
                    <td>{company(project.client_id)}</td>
                    <td>{project.production_type.replaceAll("_", " ")}</td>
                    <td><span className="inv-badge inv-badge-open">{project.status.replaceAll("_", " ")}</span></td>
                    <td>{formatDate(project.updated_at)}</td>
                    <td><Link href={`/invoicing/production/${project.id}`} className="inv-link">Open studio →</Link></td>
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
