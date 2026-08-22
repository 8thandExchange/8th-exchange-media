"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartProductionButton({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [productionType, setProductionType] = useState("short_video");
  const [duration, setDuration] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal/admin/production/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          productionType,
          targetDurationSeconds: duration,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { project?: { id: string }; error?: string }
        | null;
      if (!response.ok || !data?.project) {
        setError(data?.error ?? "Creative production could not be started");
        return;
      }
      router.push(`/invoicing/production/${data.project.id}`);
      router.refresh();
    } catch {
      setError("Creative production request was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="inv-field">
        <label htmlFor="production-type">Production format</label>
        <select
          id="production-type"
          className="inv-select"
          value={productionType}
          onChange={(event) => setProductionType(event.target.value)}
        >
          <option value="short_video">Short video / reel</option>
          <option value="long_video">Long-form video</option>
          <option value="photo_campaign">Photo campaign</option>
          <option value="article">Article / SEO package</option>
          <option value="mixed">Mixed campaign</option>
        </select>
      </div>
      <div className="inv-field" style={{ marginTop: 10 }}>
        <label htmlFor="production-duration">Target seconds</label>
        <input
          id="production-duration"
          className="inv-input"
          type="number"
          min={10}
          max={3600}
          value={duration}
          onChange={(event) => setDuration(Number(event.target.value))}
        />
      </div>
      <button
        type="button"
        className="inv-btn inv-btn-primary"
        style={{ marginTop: 12 }}
        disabled={busy}
        onClick={create}
      >
        {busy ? "Building package…" : "Start Creative Production"}
      </button>
      {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 10 }}>{error}</div> : null}
    </div>
  );
}
