import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { getPortalClientId } from "@/lib/portal/auth";
import { getClientById, listRequestsForClient, type PortalRequest } from "@/lib/portal/service";
import { listPipelinePosts, type SocialPostRow } from "@/lib/portal/social";
import { listInvoicesForCustomer } from "@/lib/invoicing/service";
import { formatMoney } from "@/lib/invoicing/format";

/**
 * Client overview — the portal's front page. Every data source is guarded
 * independently: a failing side system (Stripe, the social pipeline) must
 * never take the page down, per the repo rule.
 */

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PortalHomePage() {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const client = await getClientById(clientId);
  if (!client) redirect("/portal/login");

  let pending: SocialPostRow[] = [];
  let upcoming: SocialPostRow[] = [];
  let requests: PortalRequest[] = [];
  let openBalanceCents: number | null = null;
  let openInvoiceCount = 0;
  let invoiceCurrency = "usd";

  await Promise.all([
    listPipelinePosts(clientId, ["pending_approval"])
      .then((rows) => {
        pending = rows;
      })
      .catch((error) => console.error("Portal overview: pipeline pending failed", error)),
    listPipelinePosts(clientId, ["approved", "scheduled"])
      .then((rows) => {
        upcoming = rows;
      })
      .catch((error) => console.error("Portal overview: pipeline upcoming failed", error)),
    listRequestsForClient(clientId)
      .then((rows) => {
        requests = rows;
      })
      .catch((error) => console.error("Portal overview: requests failed", error)),
    client.stripe_customer_id
      ? listInvoicesForCustomer(client.stripe_customer_id)
          .then((invoices) => {
            const open = invoices.filter(
              (i) => i.status === "open" || i.displayStatus === "overdue"
            );
            openInvoiceCount = open.length;
            openBalanceCents = open.reduce((sum, i) => sum + i.amountDue, 0);
            if (open[0]) invoiceCurrency = open[0].currency;
          })
          .catch((error) => console.error("Portal overview: invoices failed", error))
      : Promise.resolve(),
  ]);

  const activeRequests = requests.filter((r) => r.status !== "closed");

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Welcome back</h1>
          <p className="inv-page-subtitle">
            Everything 8th &amp; Exchange is running for {client.company}, in one place.
          </p>
        </div>
        <Link href="/portal/requests/new" className="inv-btn inv-btn-primary">
          New request
        </Link>
      </div>

      <div className="inv-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <Link href="/portal/approvals" className="inv-card inv-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="inv-stat-label">Waiting on you</div>
          <div className="inv-stat-value">{pending.length}</div>
          <div className="inv-stat-meta">
            {pending.length === 1 ? "post to approve" : "posts to approve"}
          </div>
        </Link>
        <Link href="/portal/social" className="inv-card inv-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="inv-stat-label">Scheduled</div>
          <div className="inv-stat-value">{upcoming.length}</div>
          <div className="inv-stat-meta">upcoming posts</div>
        </Link>
        <Link href="/portal/requests" className="inv-card inv-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="inv-stat-label">Active requests</div>
          <div className="inv-stat-value">{activeRequests.length}</div>
          <div className="inv-stat-meta">in the work queue</div>
        </Link>
        <Link href="/portal/billing" className="inv-card inv-stat-card" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="inv-stat-label">Open balance</div>
          <div className="inv-stat-value">
            {openBalanceCents === null ? "—" : formatMoney(openBalanceCents, invoiceCurrency)}
          </div>
          <div className="inv-stat-meta">
            {openBalanceCents === null
              ? "no billing on file"
              : `${openInvoiceCount} open invoice${openInvoiceCount === 1 ? "" : "s"}`}
          </div>
        </Link>
      </div>

      {pending.length > 0 ? (
        <div className="inv-card" style={{ marginBottom: 24 }}>
          <div className="inv-detail-section">
            <div className="inv-detail-label">Waiting on your approval</div>
            <div className="divide-y divide-[#e4e4e7]">
              {pending.slice(0, 3).map((post) => (
                <div key={post.id} className="flex items-center justify-between gap-4 py-3">
                  <p className="min-w-0 truncate text-sm">{post.summary}</p>
                  <span className="inv-badge inv-badge-open shrink-0">pending</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <Link href="/portal/approvals" className="inv-link text-sm">
                Review and approve →
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <div className="inv-card">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Recent requests</div>
          {requests.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--inv-text-secondary)" }}>
              No requests yet. Submit your first and our team takes it from there.
            </p>
          ) : (
            <div className="divide-y divide-[#e4e4e7]">
              {requests.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/portal/requests/${r.id}`}
                  className="flex items-center justify-between gap-4 py-3"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.title}</p>
                    <p className="text-xs" style={{ color: "var(--inv-text-muted)" }}>
                      {r.service_type} · {formatDateTime(r.created_at)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
