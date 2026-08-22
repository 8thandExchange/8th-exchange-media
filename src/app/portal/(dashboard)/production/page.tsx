import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePortalClient } from "@/lib/portal/auth";
import { listCreativeProjects } from "@/lib/production/service";

export const dynamic = "force-dynamic";

async function loadProjects(clientId: string) {
  try {
    const projects = (await listCreativeProjects(clientId)).filter(
      (project) => project.client_visible && project.status !== "archived"
    );
    return { projects, error: "" };
  } catch (error) {
    return {
      projects: [],
      error: error instanceof Error ? error.message : "Production projects are unavailable",
    };
  }
}

export default async function ClientProductionPage() {
  let clientId: string;
  try {
    clientId = await requirePortalClient();
  } catch {
    redirect("/portal/login");
  }
  const { projects, error } = await loadProjects(clientId);

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Creative Production</h1>
          <p className="inv-page-subtitle">
            Review the exact scripts, shots, storyboards, and creative packages being produced for your brand.
          </p>
        </div>
      </div>
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}
      {!error && projects.length === 0 ? (
        <div className="inv-card"><div className="inv-empty"><p className="inv-empty-title">Nothing awaiting production review.</p><p className="inv-empty-text">Packages appear here after internal strategy and quality review.</p></div></div>
      ) : null}
      <div className="space-y-4">
        {projects.map((project) => (
          <article key={project.id} className="inv-card">
            <div className="inv-detail-section prod-client-project-row">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inv-badge inv-badge-open">{project.status.replaceAll("_", " ")}</span>
                  <span className="growth-factors">{project.production_type.replaceAll("_", " ")}</span>
                </div>
                <h2>{project.name}</h2>
                <p>{project.objective}</p>
              </div>
              <Link href={`/portal/production/${project.id}`} className="inv-btn inv-btn-secondary">
                Review package
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
