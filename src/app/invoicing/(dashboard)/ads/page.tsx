import Link from "next/link";
import { MetaTestEventButton } from "@/components/invoicing/MetaTestEventButton";
import {
  BRAND_ADS_MIGRATION_SQL,
  listMetaConnections,
  type MetaConnectionPublic,
} from "@/lib/ads/connections";
import {
  CAPABILITY_LABEL,
  META_SETUP_STEPS,
  STUDIO_CAPABILITIES,
  type CapabilityStatus,
} from "@/lib/ads/operating-system";
import {
  agencyMetaAuth,
  agencyMetaPublicStatus,
  formatMetaBudget,
  listMetaCampaigns,
  probeMetaConnection,
  type MetaCampaign,
  type MetaProbe,
} from "@/lib/meta";
import { listClients } from "@/lib/portal/service";

export const dynamic = "force-dynamic";

const BADGE: Record<CapabilityStatus, string> = {
  live: "inv-badge-paid",
  partial: "inv-badge-open",
  next: "inv-badge-draft",
  out: "inv-badge-void",
};

function formatWhen(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function StaffAdsPage() {
  const agency = agencyMetaPublicStatus();
  const auth = agencyMetaAuth();

  let probe: MetaProbe | null = null;
  let probeError: string | null = null;
  if (auth) {
    try {
      probe = await probeMetaConnection(auth);
    } catch (error) {
      probeError = error instanceof Error ? error.message : "Could not reach Meta";
    }
  }

  let campaigns: MetaCampaign[] = [];
  let campaignError: string | null = null;
  if (auth?.adAccountId && (auth.adsToken || auth.capiToken)) {
    try {
      campaigns = await listMetaCampaigns(auth);
    } catch (error) {
      campaignError = error instanceof Error ? error.message : "Could not list campaigns";
    }
  }

  let clients: Awaited<ReturnType<typeof listClients>> = [];
  try {
    clients = await listClients();
  } catch (error) {
    console.error("Ads: could not load client list", error);
  }

  const connections = await listMetaConnections();
  const byClient = new Map<string, MetaConnectionPublic>();
  if (connections.ok) {
    for (const row of connections.data) {
      if (row.clientId) byClient.set(row.clientId, row);
    }
  }

  const pixelReady = Boolean(agency.pixelId);
  const capiReady = Boolean(agency.pixelId && agency.hasCapiToken);
  const adsReady = Boolean(agency.adAccountId && agency.hasAdsToken);

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Ads</h1>
          <p className="inv-page-subtitle">
            Measurement first, spend second. This page is how 8E — and every company we run —
            connects to Meta. The Pixel does not exist until someone creates it in Events Manager;
            the app cannot invent one.
          </p>
        </div>
      </div>

      <div className="inv-stat-grid">
        <div className="inv-card inv-stat-card">
          <div className="inv-stat-label">8E Pixel</div>
          <div className="inv-stat-value" style={{ fontSize: 22 }}>
            {pixelReady ? "ID set" : "Missing"}
          </div>
          <div className="inv-stat-meta">
            {agency.pixelId ? `Dataset ${agency.pixelId}` : "NEXT_PUBLIC_META_PIXEL_ID"}
          </div>
        </div>
        <div className="inv-card inv-stat-card">
          <div className="inv-stat-label">Conversions API</div>
          <div className="inv-stat-value" style={{ fontSize: 22 }}>
            {capiReady ? "Token set" : "Missing"}
          </div>
          <div className="inv-stat-meta">
            {probe?.pixel.ok
              ? probe.pixel.name ?? "Pixel reachable"
              : probe?.pixel.error ?? "META_CAPI_ACCESS_TOKEN"}
          </div>
        </div>
        <div className="inv-card inv-stat-card">
          <div className="inv-stat-label">Ad account</div>
          <div className="inv-stat-value" style={{ fontSize: 22 }}>
            {adsReady ? "Connected" : "Not connected"}
          </div>
          <div className="inv-stat-meta">
            {probe?.adAccount.ok
              ? `${probe.adAccount.name ?? agency.adAccountId} · ${probe.adAccount.currency ?? ""}`
              : agency.adAccountId
                ? agency.adAccountId
                : "META_AD_ACCOUNT_ID"}
          </div>
        </div>
      </div>

      {!pixelReady ? (
        <div className="inv-alert inv-alert-error" style={{ marginBottom: "1.25rem" }}>
          There is no Meta Pixel ID on 8emedia.com. Contact and onboarding forms will still work;
          they just will not train ads. Create the Dataset in Events Manager, then set the env
          vars below and redeploy.
        </div>
      ) : !capiReady ? (
        <div className="inv-alert inv-alert-error" style={{ marginBottom: "1.25rem" }}>
          Pixel ID is set but META_CAPI_ACCESS_TOKEN is not. Browser PageView will fire after
          cookie consent; form Leads will not, which is the event ads actually optimize on.
        </div>
      ) : null}

      {probeError ? (
        <div className="inv-alert inv-alert-error" style={{ marginBottom: "1.25rem" }}>
          Meta Graph error: {probeError}
        </div>
      ) : null}

      <div className="inv-card" style={{ padding: "22px 24px", marginBottom: "1.25rem" }}>
        <div className="inv-detail-label">Create the 8E Pixel — you have to do this in Meta</div>
        <p className="inv-page-subtitle" style={{ marginTop: 0 }}>
          A Pixel ID is issued by Events Manager, not by this repo. Open{" "}
          <a href="https://business.facebook.com/events_manager" className="inv-link" target="_blank" rel="noreferrer">
            Events Manager
          </a>{" "}
          as someone who can admin the 8E Business Portfolio and work the list. Then add the
          values in Vercel → project <strong>8th-exchange-media</strong> → Settings → Environment
          Variables (Production <em>and</em> Preview) and redeploy <code>master</code>.
        </p>
        <ol style={{ margin: "0.75rem 0 0", paddingLeft: "1.25rem", color: "var(--inv-text-secondary)" }}>
          {META_SETUP_STEPS.map((step) => (
            <li key={step.title} style={{ marginBottom: "0.75rem" }}>
              <strong style={{ color: "var(--inv-text)" }}>{step.title}.</strong> {step.body}
            </li>
          ))}
        </ol>
      </div>

      <div className="inv-card" style={{ padding: "22px 24px", marginBottom: "1.25rem" }}>
        <div className="inv-detail-label">Prove the pipe</div>
        <p className="inv-page-subtitle" style={{ marginTop: 0, marginBottom: "0.75rem" }}>
          Sends a Lead through the Conversions API. If you paste the Test events code from Events
          Manager, it stays out of production reporting. Cookie consent is not required for this
          staff test.
        </p>
        <MetaTestEventButton disabled={!pixelReady} />
      </div>

      <div className="inv-card" style={{ marginBottom: "1.25rem" }}>
        <div className="px-5 py-4 border-b border-[var(--inv-border)]">
          <div className="font-medium">Campaigns — 8E Media ad account</div>
          <p className="inv-page-subtitle" style={{ margin: "0.35rem 0 0" }}>
            Read-only. Creating and turning on spend from this app needs a reviewed Meta developer
            app (ads_management) and a System User on the ad account. Until that exists, build and
            launch campaigns in{" "}
            <a href="https://adsmanager.facebook.com" className="inv-link" target="_blank" rel="noreferrer">
              Ads Manager
            </a>
            . Do not spend until PageView and Lead are arriving in Events Manager.
          </p>
        </div>
        {campaignError ? (
          <div className="inv-alert inv-alert-error" style={{ margin: "1rem" }}>
            {campaignError}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="inv-empty">
            <div className="inv-empty-title">
              {adsReady ? "No campaigns in this ad account yet" : "Ad account not connected"}
            </div>
            <p className="inv-empty-text">
              {adsReady
                ? "Once you create a campaign in Ads Manager it will show here (last 25)."
                : "Set META_AD_ACCOUNT_ID and a token that can read ads (META_ADS_ACCESS_TOKEN — a CAPI token from Events Manager usually cannot)."}
            </p>
          </div>
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Objective</th>
                  <th>Budget</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>
                      <span className="inv-badge inv-badge-open">{c.effectiveStatus ?? c.status}</span>
                    </td>
                    <td>{c.objective ?? "—"}</td>
                    <td>
                      {c.dailyBudget
                        ? `${formatMetaBudget(c.dailyBudget)} / day`
                        : formatMetaBudget(c.lifetimeBudget)}
                    </td>
                    <td>{formatWhen(c.createdTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="inv-card" style={{ marginBottom: "1.25rem" }}>
        <div className="px-5 py-4 border-b border-[var(--inv-border)]">
          <div className="font-medium">Client Meta connections</div>
          <p className="inv-page-subtitle" style={{ margin: "0.35rem 0 0" }}>
            Each company owns its Pixel and ad account. 8E is a partner on their Business
            Portfolio. Never install a client Pixel on 8emedia.com — that mixes remarketing
            audiences (and is unsafe for anything with a patient or customer portal).
          </p>
        </div>

        {!connections.ok && connections.missingTable ? (
          <div style={{ padding: "20px 24px" }}>
            <div className="inv-alert inv-alert-error">
              Supabase does not have <code>brand_ads_connections</code> yet. Run this in the{" "}
              <strong>8th-exchange-media</strong> project SQL editor, then refresh.
            </div>
            <pre
              style={{
                marginTop: "0.75rem",
                padding: "12px 14px",
                background: "var(--inv-neutral-bg)",
                fontSize: 12,
                overflow: "auto",
                whiteSpace: "pre-wrap",
              }}
            >
              {BRAND_ADS_MIGRATION_SQL}
            </pre>
          </div>
        ) : !connections.ok ? (
          <div className="inv-alert inv-alert-error" style={{ margin: "1rem" }}>
            Could not load client Meta connections: {connections.error}
          </div>
        ) : clients.length === 0 ? (
          <div className="inv-empty">
            <div className="inv-empty-title">No portal clients yet</div>
            <p className="inv-empty-text">
              Add a company on the clients page. New brands from logo / site / launch work become
              a portal client, a GHL location, a brand kit, then a Meta connection — in that order.
            </p>
          </div>
        ) : (
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Pixel</th>
                  <th>Ad account</th>
                  <th>CAPI</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const row = byClient.get(c.id);
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/invoicing/clients/${c.id}`} className="inv-link">
                          {c.company}
                        </Link>
                      </td>
                      <td>{row?.pixelId ? <code>{row.pixelId}</code> : "—"}</td>
                      <td>{row?.adAccountId ? <code>{row.adAccountId}</code> : "—"}</td>
                      <td>
                        <span className={`inv-badge ${row?.hasCapiToken ? "inv-badge-paid" : "inv-badge-open"}`}>
                          {row?.hasCapiToken ? "Token saved" : "Missing"}
                        </span>
                      </td>
                      <td>
                        <Link href={`/invoicing/clients/${c.id}`} className="inv-link">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="inv-card">
        <div className="px-5 py-4 border-b border-[var(--inv-border)]">
          <div className="font-medium">What it takes to run every company from here</div>
          <p className="inv-page-subtitle" style={{ margin: "0.35rem 0 0" }}>
            The platform already operates the agency&apos;s money, clients, and social queue. It
            is not a replacement for Vercel-per-site hosting, a video editor, or Ads Manager. New
            companies from brand / logo / web / launch work enter as a portal client; paid traffic
            is the last thing we turn on, after the Pixel is live on <em>their</em> site.
          </p>
        </div>
        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>Work</th>
                <th>Owner</th>
                <th>Status</th>
                <th>How we run it</th>
              </tr>
            </thead>
            <tbody>
              {STUDIO_CAPABILITIES.map((cap) => (
                <tr key={cap.id}>
                  <td style={{ maxWidth: 220 }}>{cap.work}</td>
                  <td style={{ maxWidth: 200 }}>{cap.owner}</td>
                  <td>
                    <span className={`inv-badge ${BADGE[cap.status]}`}>{CAPABILITY_LABEL[cap.status]}</span>
                  </td>
                  <td style={{ maxWidth: 420 }}>{cap.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
