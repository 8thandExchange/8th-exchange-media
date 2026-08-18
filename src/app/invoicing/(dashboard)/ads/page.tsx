import Link from "next/link";
import { AdsCampaignForm } from "@/components/invoicing/AdsCampaignForm";
import { AdsPixelForm } from "@/components/invoicing/AdsPixelForm";
import {
  agencyMetaAuth,
  agencyPixelId,
  formatAccountStatus,
  listCampaigns,
  verifyMetaConnection,
  type MetaCampaign,
  type MetaConnectionReport,
} from "@/lib/meta";
import { resolveMetaAuth } from "@/lib/portal/metaAuth";
import { listClientsMetaStatus } from "@/lib/portal/service";

export const dynamic = "force-dynamic";

function formatBudget(cents?: string): string {
  if (!cents) return "—";
  const value = Number(cents);
  if (!Number.isFinite(value)) return "—";
  return `$${(value / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function StaffAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const selectedClientId = params.client ?? null;

  let metaClients: Awaited<ReturnType<typeof listClientsMetaStatus>> = [];
  try {
    metaClients = await listClientsMetaStatus();
  } catch (error) {
    console.error("Ads: could not load client list", error);
  }
  const connectedClients = metaClients.filter((c) => c.active && c.connected);

  let brandLabel = "8E Media";
  let report: MetaConnectionReport | null = null;
  let campaigns: MetaCampaign[] = [];
  let metaError: string | null = null;
  const agencyConfigured = Boolean(agencyMetaAuth());
  const browserPixelId = agencyPixelId();

  if (selectedClientId || agencyConfigured) {
    try {
      const { auth, label } = await resolveMetaAuth(selectedClientId);
      brandLabel = label;
      [report, campaigns] = await Promise.all([
        verifyMetaConnection(auth),
        listCampaigns(auth),
      ]);
    } catch (error) {
      metaError = error instanceof Error ? error.message : "Could not reach Meta";
      const selected = metaClients.find((c) => c.id === selectedClientId);
      if (selected) brandLabel = selected.company;
    }
  }

  const pixelDefaultName = selectedClientId
    ? `${brandLabel} website`
    : "8E Media — 8emedia.com";

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Ads</h1>
          <p className="inv-page-subtitle">
            Meta connection, Pixel, and campaigns for{" "}
            <strong>{brandLabel}</strong>
            {selectedClientId ? "’s ad account" : " (agency ad account)"}. Spend, targeting, and
            creative still live in Ads Manager — this page will not turn a campaign on.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: "1.25rem",
        }}
      >
        <span className="inv-detail-label" style={{ margin: 0 }}>
          Brand
        </span>
        <Link
          href="/invoicing/ads"
          className={`inv-btn ${selectedClientId ? "inv-btn-ghost" : "inv-btn-secondary"}`}
        >
          8E Media
        </Link>
        {connectedClients.map((c) => (
          <Link
            key={c.id}
            href={`/invoicing/ads?client=${c.id}`}
            className={`inv-btn ${selectedClientId === c.id ? "inv-btn-secondary" : "inv-btn-ghost"}`}
          >
            {c.company}
          </Link>
        ))}
        <span style={{ fontSize: "12.5px", color: "var(--inv-text-muted)" }}>
          Connect more clients from their client page.
        </span>
      </div>

      {!selectedClientId && !agencyConfigured ? (
        <AgencySetupCard browserPixelId={browserPixelId} />
      ) : null}

      {metaError ? <div className="inv-alert inv-alert-error">{metaError}</div> : null}

      {report ? (
        <div className="inv-card" style={{ marginBottom: "1rem" }}>
          <div className="inv-detail-label">Connection</div>
          <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
            {report.account.name ?? "Ad account"} ·{" "}
            <code>{report.account.id}</code> · {formatAccountStatus(report.account.account_status)}
            {report.account.currency ? ` · ${report.account.currency}` : ""}
            {report.account.timezone_name ? ` · ${report.account.timezone_name}` : ""}
          </p>
          {!selectedClientId ? (
            <p className="inv-page-subtitle">
              Browser Pixel on 8emedia.com:{" "}
              {browserPixelId ? (
                <code>{browserPixelId}</code>
              ) : (
                <>
                  not set — after you create one below, add{" "}
                  <code>NEXT_PUBLIC_META_PIXEL_ID</code> in Vercel and redeploy
                </>
              )}
              . Domain verify tag: set <code>NEXT_PUBLIC_META_DOMAIN_VERIFY</code> the same way
              once Events Manager gives you the code.
            </p>
          ) : null}
        </div>
      ) : null}

      {report ? (
        <div className="inv-card" style={{ marginBottom: "1rem" }}>
          <div className="inv-detail-label">Pixels / datasets</div>
          {report.pixels.length === 0 ? (
            <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
              No Pixel on this ad account yet. Create one here — that is the missing id. Meta
              cannot run conversion ads or build retargeting audiences without it.
            </p>
          ) : (
            <div className="inv-table-wrap" style={{ margin: "0.75rem 0" }}>
              <table className="inv-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Pixel id</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {report.pixels.map((pixel) => (
                    <tr key={pixel.id}>
                      <td>{pixel.name ?? "—"}</td>
                      <td>
                        <code>{pixel.id}</code>
                      </td>
                      <td>
                        <span
                          className={`inv-badge ${pixel.is_unavailable ? "inv-badge-open" : "inv-badge-paid"}`}
                        >
                          {pixel.is_unavailable ? "Unavailable" : "Ready"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <AdsPixelForm
            clientId={selectedClientId}
            brandLabel={brandLabel}
            defaultName={pixelDefaultName}
          />
        </div>
      ) : null}

      {report ? (
        <div className="inv-card" style={{ marginBottom: "1rem" }}>
          <div className="inv-detail-label">Open a paused campaign</div>
          <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
            Creates the campaign container only, status <strong>PAUSED</strong>. Add the ad set,
            audience, creative, and daily budget in{" "}
            <a
              href="https://adsmanager.facebook.com"
              className="inv-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Ads Manager
            </a>{" "}
            before anyone is charged.
          </p>
          <AdsCampaignForm clientId={selectedClientId} />
        </div>
      ) : null}

      {campaigns.length > 0 ? (
        <div className="mt-6">
          <div className="inv-nav-section">Campaigns — {brandLabel}</div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Objective</th>
                  <th>Daily</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.name ?? campaign.id}</td>
                    <td>
                      <span className="inv-badge inv-badge-open">
                        {campaign.effective_status ?? campaign.status ?? "—"}
                      </span>
                    </td>
                    <td>{campaign.objective ?? "—"}</td>
                    <td>{formatBudget(campaign.daily_budget)}</td>
                    <td>{formatDate(campaign.updated_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : report && !metaError ? (
        <div className="inv-empty" style={{ marginTop: "1rem" }}>
          <div className="inv-empty-title">No campaigns on this account yet</div>
          <p className="inv-empty-text">
            Create a paused campaign above, or open Ads Manager if someone already advertised from
            another login.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function AgencySetupCard({ browserPixelId }: { browserPixelId: string | null }) {
  return (
    <div className="inv-card" style={{ marginBottom: "1rem" }}>
      <div className="inv-detail-label">Connect 8E Media to Meta</div>
      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        There is no Pixel id in production yet
        {browserPixelId ? (
          <>
            {" "}
            (this build has <code>{browserPixelId}</code> — confirm it is on the live Vercel
            project)
          </>
        ) : null}
        . You create the Business Portfolio, ad account, system user, and Pixel in Meta; this
        dashboard talks to them. Do this once for 8E, then repeat per client on their client page.
      </p>
      <ol className="inv-page-subtitle" style={{ paddingLeft: "1.25rem", margin: "0.75rem 0" }}>
        <li>
          Open{" "}
          <a
            href="https://business.facebook.com"
            className="inv-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            business.facebook.com
          </a>{" "}
          and create a Business Portfolio for 8th &amp; Exchange Media if one does not exist.
        </li>
        <li>
          Business settings → Accounts → Ad accounts → create <strong>8E Media</strong>. Add a
          payment method. Copy the id (<code>act_…</code>).
        </li>
        <li>
          Business settings → Users → System users → create <strong>8E Studio</strong> (Admin).
          Assign the ad account with <strong>Manage campaigns</strong>. Generate a token with{" "}
          <code>ads_management</code>, <code>ads_read</code>, and <code>business_management</code>.
        </li>
        <li>
          In Vercel → project <strong>8th-exchange-media</strong> → Settings → Environment
          Variables, set <code>META_AD_ACCOUNT_ID</code> and <code>META_ACCESS_TOKEN</code>{" "}
          (Production + Preview), then redeploy.
        </li>
        <li>
          Come back here. The connection card will load. Use <strong>Create Pixel</strong>, then
          set <code>NEXT_PUBLIC_META_PIXEL_ID</code> to that id and redeploy so 8emedia.com starts
          sending PageView (consent-gated) plus Conversions API events.
        </li>
      </ol>
      <p className="inv-page-subtitle">
        Longer runbook with CAPI, domain verification, and client isolation:{" "}
        <code>docs/META_ADS.md</code>. Why ads sit next to Social Planner and not Metricool:{" "}
        <code>docs/AGENCY_OPERATING_SYSTEM.md</code>.
      </p>
    </div>
  );
}
