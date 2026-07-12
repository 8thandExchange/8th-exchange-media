import Link from "next/link";
import { listAllRequests, statusLabel, REQUEST_STATUSES } from "@/lib/portal/service";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function StaffRequestsPage() {
  const requests = await listAllRequests();
  const open = requests.filter((r) => r.status !== "closed");
  const closed = requests.filter((r) => r.status === "closed");

  const counts = REQUEST_STATUSES.map((s) => ({
    ...s,
    count: requests.filter((r) => r.status === s.value).length,
  }));

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Client requests</h1>
          <p className="inv-page-subtitle">The production queue across every portal client.</p>
        </div>
      </div>

      <div className="inv-stat-grid">
        {counts
          .filter((s) => s.value !== "closed")
          .map((s) => (
            <div key={s.value} className="inv-stat-card">
              <div className="inv-stat-label">{s.label}</div>
              <div className="inv-stat-value">{s.count}</div>
            </div>
          ))}
      </div>

      {requests.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-title">No requests yet</div>
          <p className="inv-empty-text">
            Create a portal client and share their access code — their requests will land here.
          </p>
        </div>
      ) : (
        <>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Client</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {open.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/invoicing/requests/${r.id}`} className="inv-link">
                        {r.title}
                      </Link>
                    </td>
                    <td>{r.portal_clients?.company ?? "—"}</td>
                    <td>{r.service_type}</td>
                    <td>{r.priority === "rush" ? "Rush" : "Standard"}</td>
                    <td>
                      <span className="inv-badge inv-badge-open">{statusLabel(r.status)}</span>
                    </td>
                    <td>{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {closed.length > 0 ? (
            <div className="mt-8">
              <div className="inv-nav-section">Closed ({closed.length})</div>
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <tbody>
                    {closed.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link href={`/invoicing/requests/${r.id}`} className="inv-link">
                            {r.title}
                          </Link>
                        </td>
                        <td>{r.portal_clients?.company ?? "—"}</td>
                        <td>{formatDate(r.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
