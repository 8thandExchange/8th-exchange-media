"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { GrowthOpportunity } from "@/lib/growth/types";
import type { SocialAccountRow } from "@/lib/portal/social";

const CHANNELS = ["facebook", "instagram", "linkedin", "x", "google"] as const;

export function GrowthCampaignForm({
  opportunity,
  brandName,
  destinationUrl,
  accounts,
}: {
  opportunity: GrowthOpportunity;
  brandName: string;
  destinationUrl: string;
  accounts: SocialAccountRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState(opportunity.title);
  const [objective, setObjective] = useState(opportunity.recommended_action);
  const [audience, setAudience] = useState(`People evaluating ${brandName}`);
  const [offer, setOffer] = useState(`A practical next step from ${brandName}`);
  const [cta, setCta] = useState("Learn more");
  const [url, setUrl] = useState(destinationUrl);
  const [channels, setChannels] = useState<string[]>(["facebook", "instagram", "linkedin"]);
  const [accountIds, setAccountIds] = useState<string[]>(
    accounts.filter((account) => account.status === "connected").map((account) => account.ghl_account_id)
  );
  const [metricLabel, setMetricLabel] = useState("Qualified leads");
  const [baseline, setBaseline] = useState(0);
  const [target, setTarget] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function toggle(value: string, selected: string[], update: (values: string[]) => void) {
    update(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal/admin/growth/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId: opportunity.id,
          name,
          objective,
          audience,
          offer,
          primaryCta: cta,
          destinationUrl: url,
          channels,
          socialAccountIds: accountIds,
          baselineValue: baseline,
          targetValue: target,
          metricLabel,
          metricUnit: "count",
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { campaign?: { id: string }; error?: string }
        | null;
      if (!response.ok || !data?.campaign) {
        setError(data?.error ?? "Campaign generation failed");
        return;
      }
      router.push(`/invoicing/growth/campaigns/${data.campaign.id}`);
      router.refresh();
    } catch {
      setError("Campaign generation was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="inv-card growth-campaign-form">
      <div className="inv-detail-section">
        <div className="inv-detail-label">Build campaign from evidence</div>
        <p className="inv-page-subtitle">
          The system creates a brief, nine branded graphic renditions, three post drafts, and a measurement plan.
        </p>

        <div className="inv-form-grid" style={{ marginTop: 18 }}>
          <div className="inv-field inv-form-grid-full">
            <label htmlFor="campaign-name">Campaign name</label>
            <input id="campaign-name" className="inv-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="inv-field inv-form-grid-full">
            <label htmlFor="campaign-objective">Objective</label>
            <textarea id="campaign-objective" className="inv-textarea" value={objective} onChange={(e) => setObjective(e.target.value)} required />
          </div>
          <div className="inv-field">
            <label htmlFor="campaign-audience">Audience</label>
            <textarea id="campaign-audience" className="inv-textarea" value={audience} onChange={(e) => setAudience(e.target.value)} required />
          </div>
          <div className="inv-field">
            <label htmlFor="campaign-offer">Offer</label>
            <textarea id="campaign-offer" className="inv-textarea" value={offer} onChange={(e) => setOffer(e.target.value)} required />
          </div>
          <div className="inv-field">
            <label htmlFor="campaign-cta">Primary action</label>
            <input id="campaign-cta" className="inv-input" value={cta} onChange={(e) => setCta(e.target.value)} required />
          </div>
          <div className="inv-field">
            <label htmlFor="campaign-url">Destination</label>
            <input id="campaign-url" type="url" className="inv-input" value={url} onChange={(e) => setUrl(e.target.value)} required />
          </div>
          <fieldset className="inv-field inv-form-grid-full">
            <legend>Channels</legend>
            <div className="growth-check-grid">
              {CHANNELS.map((channel) => (
                <label key={channel} className="growth-check">
                  <input
                    type="checkbox"
                    checked={channels.includes(channel)}
                    onChange={() => toggle(channel, channels, setChannels)}
                  />
                  <span>{channel}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {accounts.length > 0 ? (
            <fieldset className="inv-field inv-form-grid-full">
              <legend>Publishing accounts</legend>
              <div className="growth-check-grid">
                {accounts.map((account) => (
                  <label key={account.id} className="growth-check">
                    <input
                      type="checkbox"
                      checked={accountIds.includes(account.ghl_account_id)}
                      onChange={() => toggle(account.ghl_account_id, accountIds, setAccountIds)}
                    />
                    <span>{account.platform} · {account.name ?? "connected account"}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          <div className="inv-field">
            <label htmlFor="campaign-metric">Primary metric</label>
            <input id="campaign-metric" className="inv-input" value={metricLabel} onChange={(e) => setMetricLabel(e.target.value)} required />
          </div>
          <div className="growth-number-pair">
            <div className="inv-field">
              <label htmlFor="campaign-baseline">Baseline</label>
              <input id="campaign-baseline" type="number" className="inv-input" value={baseline} onChange={(e) => setBaseline(Number(e.target.value))} required />
            </div>
            <div className="inv-field">
              <label htmlFor="campaign-target">Target</label>
              <input id="campaign-target" type="number" className="inv-input" value={target} onChange={(e) => setTarget(Number(e.target.value))} required />
            </div>
          </div>
        </div>

        {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 16 }}>{error}</div> : null}
        <div className="flex flex-wrap gap-2" style={{ marginTop: 18 }}>
          <button type="submit" className="inv-btn inv-btn-primary" disabled={busy || channels.length === 0}>
            {busy ? "Building campaign…" : "Generate campaign system"}
          </button>
          <button type="button" className="inv-btn inv-btn-ghost" onClick={() => router.back()}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
