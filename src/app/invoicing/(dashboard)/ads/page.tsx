import Link from "next/link";
import { listMetaCampaigns, type MetaAdsSnapshot } from "@/lib/meta/ads";
import {
  adsManagerUrl,
  eventsManagerUrl,
  getAgencyMetaConfig,
  type AgencyMetaConfig,
} from "@/lib/meta/config";
import { META_PIXEL_SETUP_STEPS, OPERATING_LANES } from "@/lib/meta/operating-map";
import {
  getBrandMetaAccount,
  getBrandMetaSecrets,
  listBrandMetaAccounts,
  type BrandMetaAccount,
} from "@/lib/portal/metaAccounts";
import { listClients } from "@/lib/portal/service";

export const dynamic = "force-dynamic";

function money(value: string | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function formatNumber(value: string | undefined): string {
  if (!value) return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
  return n.toLocaleString("en-US");
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusTone(status: (typeof OPERATING_LANES)[number]["status"]): string {
  if (status === "shipped" || status === "this-pr") return "inv-badge inv-badge-paid";
  if (status === "human") return "inv-badge inv-badge-open";
  return "inv-badge";
}

function statusLabel(status: (typeof OPERATING_LANES)[number]["status"]): string {
  if (status === "this-pr") return "This desk";
  if (status === "shipped") return "Live";
  if (status === "connect") return "Connect";
  return "People";
}

export default async function StaffAdsPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const selectedClientId = params.client ?? null;

  let clients: Awaited<ReturnType<typeof listClients>> = [];
  try {
    clients = await listClients();
  } catch (error) {
    console.error("Ads desk: could not load client list", error);
  }

  const metaAccounts = await listBrandMetaAccounts();
  const metaByClient = new Map(metaAccounts.map((row) => [row.client_id, row]));

  const selectedClient = selectedClientId
    ? (clients.find((c) => c.id === selectedClientId) ?? null)
    : null;

  const agency = getAgencyMetaConfig();
  let brandLabel = "8E Media";
  let clientMeta: BrandMetaAccount | null = null;
  let snapshot: MetaAdsSnapshot | null = null;
  let adsError: string | null = null;
  let pixelId: string | null = agency.pixelId;
  let adAccountId: string | null = agency.adAccountId;
  let hasCapi = Boolean(agency.capiToken);
  let hasSystemUser = Boolean(agency.systemUserToken);

  if (selectedClient) {
    brandLabel = selectedClient.company;
    clientMeta = metaByClient.get(selectedClient.id) ?? (await getBrandMetaAccount(selectedClient.id));
    pixelId = clientMeta?.pixel_id ?? null;
    adAccountId = clientMeta?.ad_account_id ?? null;
    hasCapi = Boolean(clientMeta?.has_capi_token);
    hasSystemUser = Boolean(clientMeta?.has_system_user_token);

    if (clientMeta?.ad_account_id && clientMeta.has_system_user_token) {
      try {
        const secrets = await getBrandMetaSecrets(selectedClient.id);
        if (secrets?.systemUserToken) {
          snapshot = await listMetaCampaigns(clientMeta.ad_account_id, secrets.systemUserToken);
        }
      } catch (error) {
        adsError = error instanceof Error ? error.message : "Could not read Meta campaigns";
      }
    }
  } else if (agency.adAccountId && agency.systemUserToken) {
    try {
      snapshot = await listMetaCampaigns(agency.adAccountId, agency.systemUserToken);
    } catch (error) {
      adsError = error instanceof Error ? error.message : "Could not read Meta campaigns";
    }
  }

  const checks: { label: string; ok: boolean; help: string }[] = selectedClient
    ? [
        {
          label: "Pixel ID on file",
          ok: Boolean(pixelId),
          help: "Create it in the client's Events Manager, then save it on their client page.",
        },
        {
          label: "Ad account ID",
          ok: Boolean(adAccountId),
          help: "Client-owned ad account; 8E assigned as partner.",
        },
        {
          label: "CAPI token stored",
          ok: hasCapi,
          help: "Needed for server-side leads on the client's own site, not here.",
        },
        {
          label: "System user (ads_read)",
          ok: hasSystemUser,
          help: "Lets this desk list campaigns without sharing a personal login.",
        },
      ]
    : [
        {
          label: "Pixel ID in Vercel",
          ok: Boolean(agency.pixelId),
          help: "NEXT_PUBLIC_META_PIXEL_ID — without it the consent banner stays hidden and no PageView fires.",
        },
        {
          label: "Conversions API token",
          ok: Boolean(agency.capiToken),
          help: "META_CAPI_ACCESS_TOKEN — contact + onboarding send Lead once this is set.",
        },
        {
          label: "Domain verified",
          ok: Boolean(agency.domainVerify),
          help: "NEXT_PUBLIC_META_DOMAIN_VERIFY — paste the code Meta gives you for 8emedia.com.",
        },
        {
          label: "Ad account + system user",
          ok: Boolean(agency.adAccountId && agency.systemUserToken),
          help: "META_AD_ACCOUNT_ID and META_SYSTEM_USER_TOKEN — required to list live campaigns here.",
        },
      ];

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Ads</h1>
          <p className="inv-page-subtitle">
            Meta measurement and campaign read-out for <strong>{brandLabel}</strong>
            {selectedClientId ? " — IDs stored on their client page" : " (agency env vars)"}.
            Campaigns are created in Ads Manager; this desk connects the Pixel and shows what is live.
          </p>
        </div>
        <a
          href={adsManagerUrl(adAccountId)}
          target="_blank"
          rel="noopener noreferrer"
          className="inv-btn inv-btn-primary"
        >
          Open Ads Manager
        </a>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
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
        {clients
          .filter((c) => c.active)
          .map((c) => (
            <Link
              key={c.id}
              href={`/invoicing/ads?client=${c.id}`}
              className={`inv-btn ${selectedClientId === c.id ? "inv-btn-secondary" : "inv-btn-ghost"}`}
            >
              {c.company}
              {metaByClient.get(c.id)?.pixel_id ? " · pixel" : ""}
            </Link>
          ))}
      </div>

      {selectedClient ? (
        <div className="inv-notice inv-notice-warn" style={{ marginBottom: "1rem" }}>
          {brandLabel}&apos;s Pixel belongs on <strong>their</strong> website. 8emedia.com only
          carries the agency Pixel.{" "}
          <Link href={`/invoicing/clients/${selectedClient.id}`} className="inv-link">
            Edit {brandLabel} Meta IDs →
          </Link>
        </div>
      ) : null}

      <div className="inv-stat-grid" style={{ marginBottom: "1.25rem" }}>
        {checks.map((check) => (
          <div className="inv-card" key={check.label} style={{ padding: "1rem 1.1rem" }}>
            <div className="inv-detail-label">{check.label}</div>
            <div style={{ marginTop: "0.35rem", fontWeight: 600 }}>
              {check.ok ? "Connected" : "Missing"}
            </div>
            <p className="inv-page-subtitle" style={{ marginTop: "0.35rem" }}>
              {check.help}
            </p>
          </div>
        ))}
      </div>

      {!selectedClient && !agency.pixelId ? <AgencyPixelSetup config={agency} /> : null}

      {adsError ? <div className="inv-alert inv-alert-error">{adsError}</div> : null}

      {snapshot?.insights ? (
        <div className="inv-stat-grid" style={{ marginBottom: "1.25rem" }}>
          <Insight label="Spend (30d)" value={money(snapshot.insights.spend)} />
          <Insight label="Impressions" value={formatNumber(snapshot.insights.impressions)} />
          <Insight label="Clicks" value={formatNumber(snapshot.insights.clicks)} />
          <Insight label="Avg CPC" value={money(snapshot.insights.cpc)} />
        </div>
      ) : null}

      {snapshot && snapshot.campaigns.length > 0 ? (
        <div className="inv-card" style={{ marginBottom: "1.25rem", padding: 0 }}>
          <div className="inv-nav-section" style={{ padding: "0.85rem 1rem 0" }}>
            Campaigns — {brandLabel}
          </div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Objective</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {snapshot.campaigns.map((campaign) => (
                  <tr key={campaign.id}>
                    <td>{campaign.name}</td>
                    <td>
                      <span className="inv-badge inv-badge-open">{campaign.effectiveStatus}</span>
                    </td>
                    <td>{campaign.objective ?? "—"}</td>
                    <td>{formatDate(campaign.updatedTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !adsError && hasSystemUser && adAccountId ? (
        <div className="inv-empty" style={{ marginBottom: "1.25rem" }}>
          <div className="inv-empty-title">No campaigns in this ad account yet</div>
          <p className="inv-empty-text">
            Create the first campaign in{" "}
            <a href={adsManagerUrl(adAccountId)} target="_blank" rel="noopener noreferrer">
              Ads Manager
            </a>
            . Point traffic at a page that already fires the Pixel (and CAPI on the thank-you /
            form). Do not spend until Events Manager shows PageView and Lead.
          </p>
        </div>
      ) : null}

      {!selectedClient ? <AgencyEnvHint config={agency} pixelId={pixelId} /> : null}

      <OperatingMap />

      {clients.length > 0 ? (
        <div className="mt-6">
          <div className="inv-nav-section">Client Meta connections</div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Pixel</th>
                  <th>Ad account</th>
                  <th>CAPI</th>
                  <th>Ads token</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((c) => {
                  const row = metaByClient.get(c.id);
                  return (
                    <tr key={c.id}>
                      <td>
                        <Link href={`/invoicing/clients/${c.id}`} className="inv-link">
                          {c.company}
                        </Link>
                      </td>
                      <td>{row?.pixel_id ?? "—"}</td>
                      <td>{row?.ad_account_id ?? "—"}</td>
                      <td>{row?.has_capi_token ? "Stored" : "—"}</td>
                      <td>{row?.has_system_user_token ? "Stored" : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div className="inv-card" style={{ padding: "1rem 1.1rem" }}>
      <div className="inv-detail-label">{label}</div>
      <div style={{ marginTop: "0.35rem", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

function AgencyPixelSetup({ config }: { config: AgencyMetaConfig }) {
  return (
    <div className="inv-card" style={{ marginBottom: "1.25rem" }}>
      <div className="inv-detail-label">Create the 8E Pixel — Meta has to issue the ID</div>
      <p className="inv-page-subtitle" style={{ marginTop: "0.4rem" }}>
        There is no Pixel ID in Vercel yet, so 8emedia.com is not sending PageView or Lead. This
        app cannot create a Pixel; Events Manager can, in about ten minutes.
      </p>
      <ol style={{ margin: "0.85rem 0 0", paddingLeft: "1.2rem" }}>
        {META_PIXEL_SETUP_STEPS.map((step, index) => (
          <li key={step.title} style={{ marginBottom: "0.75rem" }}>
            <strong>
              {index + 1}. {step.title}
            </strong>
            <div className="inv-page-subtitle" style={{ marginTop: "0.2rem" }}>
              {step.detail}
            </div>
          </li>
        ))}
      </ol>
      <p className="inv-page-subtitle" style={{ marginTop: "0.25rem" }}>
        After the Pixel exists, confirm it in{" "}
        <a href={eventsManagerUrl(config.pixelId)} target="_blank" rel="noopener noreferrer">
          Events Manager
        </a>{" "}
        with Test events, then run one real contact-form submit.
      </p>
    </div>
  );
}

function AgencyEnvHint({ config, pixelId }: { config: AgencyMetaConfig; pixelId: string | null }) {
  return (
    <div className="inv-card" style={{ marginBottom: "1.25rem" }}>
      <div className="inv-detail-label">Agency env (Vercel → 8th-exchange-media)</div>
      <p className="inv-page-subtitle" style={{ marginTop: "0.4rem" }}>
        Pixel currently {pixelId ? <code>{pixelId}</code> : "unset"}. CAPI{" "}
        {config.capiToken ? "token is set" : "token is missing"}. Domain verify{" "}
        {config.domainVerify ? "is set" : "is missing"}. Ad account{" "}
        {config.adAccountId ? <code>{config.adAccountId}</code> : "unset"}.
      </p>
    </div>
  );
}

function OperatingMap() {
  return (
    <div className="mt-6">
      <div className="inv-nav-section">How this platform runs every company</div>
      <p className="inv-page-subtitle" style={{ marginBottom: "0.75rem" }}>
        This repo is the operating desk. Stripe, GHL, Meta, Google, Metricool, and Vercel stay
        systems of record — we connect them per brand instead of cloning their UIs. Full write-up:{" "}
        <code>docs/OPERATING_SYSTEM.md</code>.
      </p>
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Lane</th>
              <th>System of record</th>
              <th>This app</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {OPERATING_LANES.map((row) => (
              <tr key={row.lane}>
                <td>{row.lane}</td>
                <td>{row.livesIn}</td>
                <td>{row.thisApp}</td>
                <td>
                  <span className={statusTone(row.status)}>{statusLabel(row.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
