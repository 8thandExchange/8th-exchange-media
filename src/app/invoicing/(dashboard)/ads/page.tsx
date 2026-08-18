import Link from "next/link";
import { MetaCampaignForm, MetaCampaignTable, MetaPixelCard } from "@/components/invoicing/MetaAdsTools";
import { MetaConnectionForm } from "@/components/invoicing/MetaConnectionForm";
import { listCampaigns, listPixels, type MetaCampaign, type MetaPixel } from "@/lib/meta";
import { resolveMetaAuth } from "@/lib/portal/metaAuth";
import { getMetaConnectionPublic, listConnectedMetaClientIds } from "@/lib/portal/metaStore";
import { listClients } from "@/lib/portal/service";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

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
    console.error("Ads: could not load client list", error);
  }

  let connectedIds = new Set<string>();
  try {
    connectedIds = new Set(await listConnectedMetaClientIds());
  } catch (error) {
    console.error("Ads: could not load Meta connections", error);
  }

  const selectedClient = selectedClientId
    ? (clients.find((c) => c.id === selectedClientId) ?? null)
    : null;

  const connection = await getMetaConnectionPublic(selectedClientId).catch(() => null);

  let brandLabel = selectedClient?.company ?? "8E Media";
  let metaError: string | null = null;
  let campaigns: MetaCampaign[] = [];
  let pixels: MetaPixel[] = [];
  let pixelId: string | null = connection?.pixelId ?? null;
  let resolved = false;

  try {
    const { auth, label } = await resolveMetaAuth(selectedClientId);
    brandLabel = label;
    pixelId = auth.pixelId ?? pixelId;
    resolved = true;
    [{ campaigns }, pixels] = await Promise.all([listCampaigns(auth), listPixels(auth)]);
  } catch (error) {
    metaError = error instanceof Error ? error.message : "Could not reach Meta";
    if (selectedClient) brandLabel = selectedClient.company;
  }

  const defaultUrl = selectedClientId
    ? selectedClient?.website || SITE_URL
    : `${SITE_URL}/growth-map`;

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Ads</h1>
          <p className="inv-page-subtitle">
            Meta connection, pixel, and paused campaigns for{" "}
            <strong>{brandLabel}</strong>
            {selectedClientId ? "’s ad account" : " (agency ad account)"}. Organic posting stays
            in Social Planner. Setup notes live in docs/OPERATING_SYSTEM.md.
          </p>
        </div>
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
              {connectedIds.has(c.id) ? "" : " · —"}
            </Link>
          ))}
      </div>

      <div className="inv-card">
        <MetaConnectionForm
          key={selectedClientId ?? "agency"}
          clientId={selectedClientId}
          initial={connection}
          brandLabel={brandLabel}
        />
      </div>

      {metaError && !resolved ? (
        <div className="inv-alert inv-alert-error" style={{ marginTop: "1rem" }}>
          {metaError}
        </div>
      ) : null}

      {resolved ? (
        <>
          {metaError ? (
            <div className="inv-alert inv-alert-error" style={{ marginTop: "1rem" }}>
              {metaError}
            </div>
          ) : null}
          <MetaPixelCard
            clientId={selectedClientId}
            brandLabel={brandLabel}
            pixelId={pixelId}
            pixels={pixels}
          />
          <MetaCampaignTable campaigns={campaigns} />
          <MetaCampaignForm clientId={selectedClientId} defaultUrl={defaultUrl} />
        </>
      ) : null}
    </div>
  );
}
