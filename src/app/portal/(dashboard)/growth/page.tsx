import Image from "next/image";
import { redirect } from "next/navigation";
import { ASSET_DIMENSIONS } from "@/lib/growth/graphics";
import { calculateMetricResult } from "@/lib/growth/reporting";
import { getCampaignBundle, listCampaigns } from "@/lib/growth/service";
import { requirePortalClient } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

async function loadClientCampaigns(clientId: string) {
  try {
    return { campaigns: await listCampaigns(clientId), error: "" };
  } catch (error) {
    return {
      campaigns: [],
      error: error instanceof Error ? error.message : "Performance data is unavailable",
    };
  }
}

export default async function ClientGrowthPage() {
  let clientId: string;
  try {
    clientId = await requirePortalClient();
  } catch {
    redirect("/portal/login");
  }

  const { campaigns, error: loadError } = await loadClientCampaigns(clientId);
  const visible = campaigns.filter((campaign) => campaign.client_visible && campaign.status !== "archived");
  const bundles = (
    await Promise.allSettled(visible.map((campaign) => getCampaignBundle(campaign.id)))
  ).flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Growth & performance</h1>
          <p className="inv-page-subtitle">
            The evidence behind each campaign, approved creative, and measured progress.
          </p>
        </div>
      </div>

      {loadError ? <div className="inv-alert inv-alert-error">{loadError}</div> : null}
      {bundles.length === 0 && !loadError ? (
        <div className="inv-card">
          <div className="inv-empty">
            <p className="inv-empty-title">No campaigns shared yet.</p>
            <p className="inv-empty-text">
              Approved campaign systems and their results will appear here.
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-6">
        {bundles.map(({ campaign, opportunity, assets, metrics }) => {
          const square = assets.find((asset) => asset.format === "square" && asset.status === "approved");
          return (
            <article key={campaign.id} className="inv-card growth-client-campaign">
              {square ? (
                <Image
                  src={`/api/growth/assets/${square.id}/${square.public_token}`}
                  alt={square.alt_text}
                  width={ASSET_DIMENSIONS.square.width}
                  height={ASSET_DIMENSIONS.square.height}
                  unoptimized
                />
              ) : null}
              <div className="growth-client-campaign-body">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inv-badge inv-badge-open">{campaign.status}</span>
                  {opportunity ? <span className="growth-factors">{opportunity.category}</span> : null}
                </div>
                <h2>{campaign.name}</h2>
                <p>{campaign.objective}</p>
                <div className="growth-hypothesis">
                  <span>Why this campaign exists</span>
                  <p>{campaign.brief.hypothesis}</p>
                </div>
                <div className="growth-metric-grid">
                  {metrics.map((metric) => {
                    const result = calculateMetricResult(metric, metric.measurements);
                    return (
                      <div key={metric.id} className="growth-client-metric">
                        <span>{metric.label}</span>
                        <strong>{result.latest?.value ?? "—"}</strong>
                        <small>baseline {metric.baseline_value} · target {metric.target_value}</small>
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
