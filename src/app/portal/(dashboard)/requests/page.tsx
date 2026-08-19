import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { getPortalClientId } from "@/lib/portal/auth";
import { listRequestsForClient } from "@/lib/portal/service";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PortalRequestsPage() {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const requests = await listRequestsForClient(clientId);
  const active = requests.filter((r) => r.status !== "closed");
  const closed = requests.filter((r) => r.status === "closed");

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Requests</h1>
          <p className="inv-page-subtitle">Your work queue with our team.</p>
        </div>
        <Link href="/portal/requests/new" className="inv-btn inv-btn-primary">
          New request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="inv-card">
          <div className="inv-empty">
            <p className="inv-empty-title">No requests yet.</p>
            <p className="inv-empty-text">
              Submit your first request and our team will take it from there.
            </p>
            <Link href="/portal/requests/new" className="inv-btn inv-btn-primary">
              Submit a request
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="inv-card">
            <div className="inv-table-wrap">
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Request</th>
                    <th>Type</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {active.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: "var(--inv-text-muted)" }}>
                        Nothing in progress right now.
                      </td>
                    </tr>
                  ) : (
                    active.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/portal/requests/${r.id}`} className="inv-link">
                            {r.title}
                          </Link>
                          {r.priority === "rush" ? (
                            <span className="inv-badge inv-badge-overdue" style={{ marginLeft: 8 }}>
                              rush
                            </span>
                          ) : null}
                        </td>
                        <td style={{ color: "var(--inv-text-secondary)" }}>{r.service_type}</td>
                        <td style={{ color: "var(--inv-text-secondary)" }}>{formatDate(r.created_at)}</td>
                        <td>
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {closed.length > 0 ? (
            <div className="inv-card">
              <div className="inv-detail-section">
                <div className="inv-detail-label">Closed</div>
                <div className="divide-y divide-[#e4e4e7]">
                  {closed.map((r) => (
                    <Link
                      key={r.id}
                      href={`/portal/requests/${r.id}`}
                      className="flex items-center justify-between gap-4 py-3"
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <p className="min-w-0 truncate text-sm">{r.title}</p>
                      <StatusBadge status={r.status} />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
