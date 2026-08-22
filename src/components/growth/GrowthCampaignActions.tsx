"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { CampaignStatus, GrowthMetric } from "@/lib/growth/types";

export function GrowthCampaignActions({
  campaignId,
  status,
  metrics,
}: {
  campaignId: string;
  status: CampaignStatus;
  metrics: GrowthMetric[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [metricId, setMetricId] = useState(metrics[0]?.id ?? "");
  const [value, setValue] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(today);

  async function action(actionName: string, endpoint = "") {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/portal/admin/growth/campaigns/${campaignId}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(endpoint ? {} : { action: actionName }),
        }
      );
      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (!response.ok) {
        setError(data?.error ?? "Campaign action failed");
        return;
      }
      setMessage(data?.message ?? "Campaign updated.");
      router.refresh();
    } catch {
      setError("Campaign action was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function recordMeasurement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/portal/admin/growth/campaigns/${campaignId}/measurements`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            metricId,
            periodStart,
            periodEnd,
            value: Number(value),
            source: "manual",
          }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Measurement could not be recorded");
        return;
      }
      setValue("");
      setMessage("Measurement recorded.");
      router.refresh();
    } catch {
      setError("Measurement request was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="inv-card">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Governance</div>
          <p className="inv-page-subtitle">
            Approval freezes the graphics. Launch only creates drafts in the Content Pipeline; it never publishes.
          </p>
          <div className="flex flex-wrap gap-2" style={{ marginTop: 16 }}>
            {status === "draft" || status === "changes_requested" ? (
              <button className="inv-btn inv-btn-secondary" disabled={busy} onClick={() => action("review")}>
                Submit for review
              </button>
            ) : null}
            {status === "in_review" ? (
              <>
                <button className="inv-btn inv-btn-primary" disabled={busy} onClick={() => action("approve")}>
                  Approve campaign
                </button>
                <button className="inv-btn inv-btn-secondary" disabled={busy} onClick={() => action("request_changes")}>
                  Request changes
                </button>
              </>
            ) : null}
            {status === "approved" || status === "active" ? (
              <button className="inv-btn inv-btn-primary" disabled={busy} onClick={() => action("launch", "/launch")}>
                Create pipeline drafts
              </button>
            ) : null}
            {status === "active" ? (
              <button className="inv-btn inv-btn-secondary" disabled={busy} onClick={() => action("complete")}>
                Complete campaign
              </button>
            ) : null}
          </div>
          {message ? <div className="inv-alert inv-alert-success" style={{ marginTop: 14 }}>{message}</div> : null}
          {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 14 }}>{error}</div> : null}
        </div>
      </div>

      {metrics.length > 0 ? (
        <form className="inv-card" onSubmit={recordMeasurement}>
          <div className="inv-detail-section">
            <div className="inv-detail-label">Record result</div>
            <div className="inv-form-grid" style={{ marginTop: 14 }}>
              <div className="inv-field">
                <label htmlFor="result-metric">Metric</label>
                <select id="result-metric" className="inv-select" value={metricId} onChange={(e) => setMetricId(e.target.value)}>
                  {metrics.map((metric) => (
                    <option key={metric.id} value={metric.id}>{metric.label}</option>
                  ))}
                </select>
              </div>
              <div className="inv-field">
                <label htmlFor="result-value">Observed value</label>
                <input id="result-value" className="inv-input" type="number" step="any" required value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div className="inv-field">
                <label htmlFor="result-start">Period start</label>
                <input id="result-start" className="inv-input" type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
              </div>
              <div className="inv-field">
                <label htmlFor="result-end">Period end</label>
                <input id="result-end" className="inv-input" type="date" required value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="inv-btn inv-btn-secondary" disabled={busy} style={{ marginTop: 16 }}>
              Save measurement
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
