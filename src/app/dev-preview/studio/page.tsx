import { notFound } from "next/navigation";
import { InvoicingSidebar, InvoicingTopbar } from "@/components/invoicing/InvoicingSidebar";
import "../../invoicing/invoicing.css";

/**
 * DEV-only design preview for the staff studio (inv-* system). The live
 * /invoicing tree needs Stripe + Supabase secrets and the shared password,
 * none of which exist on every machine — this page renders the same shell
 * and class contract with fabricated sample data so restyles can be
 * reviewed anywhere. Returns 404 in production builds.
 */

const sampleInvoices = [
  { customer: "Sample Roofing Co", number: "INV-0041", amount: "$2,400.00", status: "paid", badge: "inv-badge-paid", due: "Aug 2, 2026" },
  { customer: "Sample Dental Group", number: "INV-0042", amount: "$1,150.00", status: "open", badge: "inv-badge-open", due: "Aug 24, 2026" },
  { customer: "Sample Fitness LLC", number: "INV-0043", amount: "$780.00", status: "overdue", badge: "inv-badge-overdue", due: "Aug 9, 2026" },
  { customer: "Sample Realty Team", number: "INV-0044", amount: "$3,900.00", status: "draft", badge: "inv-badge-draft", due: "—" },
];

const samplePosts = [
  { body: "Behind the scenes at Tuesday's brand shoot. Augusta, you showed up.", when: "Scheduled · Aug 21, 9:00 AM", networks: "Facebook · Instagram", badge: "inv-badge-open", status: "scheduled" },
  { body: "New client welcome: Sample Dental Group joins the roster.", when: "Draft", networks: "Instagram", badge: "inv-badge-draft", status: "draft" },
  { body: "Reel: 3 things every Augusta small business gets wrong on Google.", when: "Published · Aug 18, 12:30 PM", networks: "Facebook · Instagram · TikTok", badge: "inv-badge-paid", status: "published" },
];

export default function StudioPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="inv-shell">
      <div style={{ background: "#18181b", color: "#fff", textAlign: "center", fontSize: 12, fontWeight: 500, padding: "6px 0" }}>
        Design preview — sample data only
      </div>
      <div className="inv-layout flex min-h-screen">
        <InvoicingSidebar />
        <div className="inv-main">
          <InvoicingTopbar />
          <main className="inv-content">
            <div className="inv-page-header">
              <div>
                <h1 className="inv-page-title">Studio overview</h1>
                <p className="inv-page-subtitle">Billing, social, and client activity across the roster.</p>
              </div>
              <div className="inv-action-row">
                <button className="inv-btn inv-btn-secondary">Export</button>
                <button className="inv-btn inv-btn-primary">New invoice</button>
              </div>
            </div>

            <div className="inv-stat-grid">
              <div className="inv-card inv-stat-card">
                <div className="inv-stat-label">Outstanding</div>
                <div className="inv-stat-value">$7,830.00</div>
                <div className="inv-stat-meta">5 open invoices</div>
              </div>
              <div className="inv-card inv-stat-card">
                <div className="inv-stat-label">Overdue</div>
                <div className="inv-stat-value">$780.00</div>
                <div className="inv-stat-meta">Needs attention</div>
              </div>
              <div className="inv-card inv-stat-card">
                <div className="inv-stat-label">Paid this month</div>
                <div className="inv-stat-value">$12,400.00</div>
                <div className="inv-stat-meta">9 paid total</div>
              </div>
            </div>

            <div className="inv-card" style={{ marginBottom: 24 }}>
              <div className="inv-filter-bar">
                <div className="inv-search">
                  <input placeholder="Search invoices…" readOnly />
                </div>
                <div className="inv-tabs">
                  <button className="inv-tab active">All</button>
                  <button className="inv-tab">Open</button>
                  <button className="inv-tab">Paid</button>
                  <button className="inv-tab">Overdue</button>
                </div>
              </div>
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Invoice</th>
                      <th>Status</th>
                      <th>Due</th>
                      <th style={{ textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleInvoices.map((row) => (
                      <tr key={row.number}>
                        <td style={{ fontWeight: 500 }}>{row.customer}</td>
                        <td style={{ color: "var(--inv-text-secondary)" }}>{row.number}</td>
                        <td><span className={`inv-badge ${row.badge}`}>{row.status}</span></td>
                        <td style={{ color: "var(--inv-text-secondary)" }}>{row.due}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="inv-card" style={{ marginBottom: 24 }}>
              <div className="inv-filter-bar">
                <div style={{ fontSize: 14, fontWeight: 600 }}>Social planner</div>
                <div className="inv-tabs" style={{ marginLeft: "auto" }}>
                  <button className="inv-tab active">Queue</button>
                  <button className="inv-tab">Drafts</button>
                  <button className="inv-tab">Published</button>
                </div>
              </div>
              <div className="inv-table-wrap">
                <table className="inv-table">
                  <thead>
                    <tr>
                      <th>Post</th>
                      <th>Accounts</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {samplePosts.map((post) => (
                      <tr key={post.body}>
                        <td style={{ maxWidth: 420 }}>
                          <div style={{ fontWeight: 500 }}>{post.body}</div>
                          <div style={{ fontSize: 12, color: "var(--inv-text-muted)", marginTop: 2 }}>{post.when}</div>
                        </td>
                        <td style={{ color: "var(--inv-text-secondary)", fontSize: 13 }}>{post.networks}</td>
                        <td><span className={`inv-badge ${post.badge}`}>{post.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="inv-detail-grid">
              <div className="inv-card">
                <div className="inv-detail-section">
                  <div className="inv-detail-label">New payment link</div>
                  <div className="inv-form-grid inv-form-grid-2">
                    <div className="inv-field">
                      <label className="inv-label">Description</label>
                      <input className="inv-input" defaultValue="August social retainer" readOnly />
                    </div>
                    <div className="inv-field">
                      <label className="inv-label">Amount</label>
                      <input className="inv-input inv-input-qty" defaultValue="$1,500.00" readOnly />
                    </div>
                  </div>
                  <div style={{ marginTop: 16 }} className="inv-action-row">
                    <button className="inv-btn inv-btn-primary">Create link</button>
                    <button className="inv-btn inv-btn-ghost">Cancel</button>
                  </div>
                </div>
              </div>
              <div className="inv-card">
                <div className="inv-detail-section">
                  <div className="inv-detail-label">Alerts</div>
                  <div className="inv-alert inv-alert-success">Payment received: Sample Roofing Co, $2,400.00.</div>
                  <div className="inv-alert inv-alert-error">GHL token expired for Sample Fitness LLC. Reconnect in Settings.</div>
                  <div className="inv-notice inv-notice-warn">Sample Dental Group has no billing email on file.</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
