import { notFound } from "next/navigation";
import { Inter } from "next/font/google";
import { PortalSidebar, PortalTopbar } from "@/components/portal/PortalSidebar";
import { StatusBadge } from "@/components/portal/StatusBadge";
import "../../invoicing/invoicing.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

/**
 * DEV-only design preview for the client portal shell (sample data). The
 * live portal needs Supabase + Stripe secrets and a client login, none of
 * which exist on every machine. 404s in production builds.
 */
export default function PortalPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className={`inv-shell ${inter.variable}`}>
      <div style={{ background: "#18181b", color: "#fff", textAlign: "center", fontSize: 12, fontWeight: 500, padding: "6px 0" }}>
        Design preview — sample data only
      </div>
      <div className="inv-layout flex min-h-screen">
        <PortalSidebar company="Sample Dental Group" />
        <div className="inv-main">
          <PortalTopbar />
          <main className="inv-content">
            <div className="inv-page-header">
              <div>
                <h1 className="inv-page-title">Welcome back</h1>
                <p className="inv-page-subtitle">
                  Everything 8th &amp; Exchange is running for Sample Dental Group, in one place.
                </p>
              </div>
              <button className="inv-btn inv-btn-primary">New request</button>
            </div>

            <div className="inv-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div className="inv-card inv-stat-card">
                <div className="inv-stat-label">Waiting on you</div>
                <div className="inv-stat-value">2</div>
                <div className="inv-stat-meta">posts to approve</div>
              </div>
              <div className="inv-card inv-stat-card">
                <div className="inv-stat-label">Scheduled</div>
                <div className="inv-stat-value">5</div>
                <div className="inv-stat-meta">upcoming posts</div>
              </div>
              <div className="inv-card inv-stat-card">
                <div className="inv-stat-label">Active requests</div>
                <div className="inv-stat-value">3</div>
                <div className="inv-stat-meta">in the work queue</div>
              </div>
              <div className="inv-card inv-stat-card">
                <div className="inv-stat-label">Open balance</div>
                <div className="inv-stat-value">$1,150.00</div>
                <div className="inv-stat-meta">1 open invoice</div>
              </div>
            </div>

            <div className="inv-card" style={{ marginBottom: 24 }}>
              <div className="inv-detail-section">
                <div className="inv-detail-label">Waiting on your approval</div>
                <div className="divide-y divide-[#e4e4e7]">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <p className="min-w-0 truncate text-sm">
                      Meet the team Tuesday: five faces behind your smile. Say hi to Dr. Sample.
                    </p>
                    <span className="inv-badge inv-badge-open shrink-0">pending</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <p className="min-w-0 truncate text-sm">
                      Back-to-school special: whitening add-on free with every cleaning in September.
                    </p>
                    <span className="inv-badge inv-badge-open shrink-0">pending</span>
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <span className="inv-link text-sm">Review and approve →</span>
                </div>
              </div>
            </div>

            <div className="inv-card">
              <div className="inv-detail-section">
                <div className="inv-detail-label">Recent requests</div>
                <div className="divide-y divide-[#e4e4e7]">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Instagram graphics for fall promotion</p>
                      <p className="text-xs" style={{ color: "var(--inv-text-muted)" }}>
                        Graphic design · Aug 16, 2:10 PM
                      </p>
                    </div>
                    <StatusBadge status="in_progress" />
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">September email newsletter</p>
                      <p className="text-xs" style={{ color: "var(--inv-text-muted)" }}>
                        Email campaign · Aug 12, 9:41 AM
                      </p>
                    </div>
                    <StatusBadge status="delivered" />
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">Lobby signage refresh</p>
                      <p className="text-xs" style={{ color: "var(--inv-text-muted)" }}>
                        Print / signage · Aug 4, 4:02 PM
                      </p>
                    </div>
                    <StatusBadge status="closed" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
