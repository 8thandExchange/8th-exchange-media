"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { META_CAMPAIGN_OBJECTIVES } from "@/lib/meta-constants";

export function AdsCampaignForm({ clientId }: { clientId: string | null }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [objective, setObjective] = useState<(typeof META_CAMPAIGN_OBJECTIVES)[number]["value"]>(
    "OUTCOME_TRAFFIC"
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function createCampaign() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/invoicing/ads/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), objective, clientId }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        id?: string;
      } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to create the campaign");
        return;
      }
      setMessage(
        `Paused campaign ${data?.id ?? ""} is on Meta. Open Ads Manager to add the ad set, creative, and budget — this page will not spend money.`
      );
      setName("");
      router.refresh();
    } catch {
      setError("Failed to create the campaign — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}
      <div className="inv-field">
        <label className="inv-label" htmlFor="campaign-name">
          Campaign name
        </label>
        <input
          id="campaign-name"
          className="inv-input"
          placeholder="Growth Map — traffic — Augusta"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="campaign-objective">
          Objective
        </label>
        <select
          id="campaign-objective"
          className="inv-input"
          value={objective}
          onChange={(e) =>
            setObjective(e.target.value as (typeof META_CAMPAIGN_OBJECTIVES)[number]["value"])
          }
        >
          {META_CAMPAIGN_OBJECTIVES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="inv-btn inv-btn-secondary"
        disabled={busy || !name.trim()}
        onClick={() => void createCampaign()}
      >
        {busy ? "Creating…" : "Create paused campaign"}
      </button>
    </div>
  );
}
