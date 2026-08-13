import { LeadActions } from "@/components/portal/LeadActions";
import { listLeads } from "@/lib/portal/service";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function StaffLeadsPage() {
  const leads = await listLeads();
  const active = leads.filter((l) => l.status === "new" || l.status === "contacted");
  const rest = leads.filter((l) => l.status === "converted" || l.status === "archived");

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Onboarding leads</h1>
          <p className="inv-page-subtitle">
            Submissions from 8emedia.com/onboarding. Convert a lead to create their portal login.
          </p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-title">No leads yet</div>
          <p className="inv-empty-text">
            Share 8emedia.com/onboarding — submissions land here with an email notification.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {[...active, ...rest].map((lead) => (
            <div key={lead.id} className="inv-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "1rem",
                  flexWrap: "wrap",
                  alignItems: "baseline",
                }}
              >
                <div>
                  <strong>{lead.company}</strong>{" "}
                  <span style={{ opacity: 0.65 }}>
                    · {lead.contact_name} · {lead.email}
                    {lead.phone ? ` · ${lead.phone}` : ""}
                  </span>
                </div>
                <span className="inv-badge inv-badge-open">{lead.status}</span>
              </div>
              <div style={{ fontSize: "0.8125rem", opacity: 0.75, marginTop: "0.5rem" }}>
                {[
                  lead.industry,
                  lead.website,
                  lead.budget,
                  lead.timeline,
                  `Submitted ${formatDate(lead.created_at)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {lead.goals.length || lead.services.length ? (
                <div style={{ fontSize: "0.8125rem", marginTop: "0.5rem" }}>
                  {lead.goals.length ? <>Goals: {lead.goals.join(", ")}. </> : null}
                  {lead.services.length ? <>Services: {lead.services.join(", ")}.</> : null}
                </div>
              ) : null}
              {Object.keys(lead.socials).length ? (
                <div style={{ fontSize: "0.8125rem", marginTop: "0.25rem", opacity: 0.75 }}>
                  {Object.entries(lead.socials)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </div>
              ) : null}
              {lead.notes ? (
                <div style={{ fontSize: "0.8125rem", marginTop: "0.5rem", whiteSpace: "pre-wrap" }}>
                  {lead.notes}
                </div>
              ) : null}
              <div style={{ marginTop: "0.75rem" }}>
                <LeadActions leadId={lead.id} status={lead.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
