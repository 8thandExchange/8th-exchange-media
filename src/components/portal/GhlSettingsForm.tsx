"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Staff form to connect a client's own GHL sub-account.
 * The token is write-only: we show only whether a connection exists.
 */
export function GhlSettingsForm({
  clientId,
  connectedLocationId,
}: {
  clientId: string;
  connectedLocationId: string | null;
}) {
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function call(body: Record<string, string>) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/clients/${clientId}/ghl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to update the GHL connection");
        return;
      }
      setMessage(
        body.action === "disconnect"
          ? "GHL connection removed."
          : "Connected — campaigns for this client now run in their GHL sub-account."
      );
      setLocationId("");
      setApiToken("");
      router.refresh();
    } catch {
      setError("Failed to update the GHL connection — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="inv-detail-label">Go High Level sub-account</div>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        {connectedLocationId ? (
          <>
            Connected to location <code>{connectedLocationId}</code>. Social posts and campaigns
            for this client publish through <em>their</em> sub-account, not 8E&apos;s.
          </>
        ) : (
          <>
            Not connected. Paste the client&apos;s GHL location id and a Private Integration token
            created inside their sub-account (Settings → Private Integrations, with Social Planner
            scopes). Until then, this client cannot be selected in the Social Planner.
          </>
        )}
      </p>

      <div className="inv-field">
        <label className="inv-label" htmlFor="ghl-location">
          Location id
        </label>
        <input
          id="ghl-location"
          className="inv-input"
          placeholder={connectedLocationId ?? "e.g. ve9EPM428h8vShlRW1KT"}
          value={locationId}
          onChange={(e) => setLocationId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="ghl-token">
          Private Integration token {connectedLocationId ? "(enter again to replace)" : ""}
        </label>
        <input
          id="ghl-token"
          className="inv-input"
          type="password"
          placeholder="pit-…"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy || !locationId.trim() || !apiToken.trim()}
          onClick={() => call({ locationId: locationId.trim(), apiToken: apiToken.trim() })}
        >
          {connectedLocationId ? "Update connection" : "Connect"}
        </button>
        {connectedLocationId ? (
          <button
            type="button"
            className="inv-btn inv-btn-ghost"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Remove this client's GHL connection?")) {
                void call({ action: "disconnect" });
              }
            }}
          >
            Disconnect
          </button>
        ) : null}
      </div>
    </div>
  );
}
