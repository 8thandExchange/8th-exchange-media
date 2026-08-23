"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Staff form to connect a client's own GHL sub-account.
 * The token is write-only: we show only whether a connection exists.
 */
function defaultRotationDue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 90);
  return date.toISOString().slice(0, 10);
}

export function GhlSettingsForm({
  clientId,
  connectedLocationId,
  tokenLast4,
  scopes: initialScopes,
  rotationDue: initialRotationDue,
}: {
  clientId: string;
  connectedLocationId: string | null;
  tokenLast4?: string | null;
  scopes?: string | null;
  rotationDue?: string | null;
}) {
  const router = useRouter();
  const [locationId, setLocationId] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [scopes, setScopes] = useState(initialScopes ?? "");
  const [rotationDue, setRotationDue] = useState(initialRotationDue ?? defaultRotationDue());
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
            Connected to location <code>{connectedLocationId}</code>
            {tokenLast4 ? (
              <>
                {" "}
                · token <code>••••{tokenLast4}</code>
              </>
            ) : null}
            . The PIT is encrypted at rest and never echoed back. GHL private integration tokens
            do not expire on their own — rotation is manual.
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

      <div className="inv-field">
        <label className="inv-label" htmlFor="ghl-scopes">
          Scopes granted
        </label>
        <textarea
          id="ghl-scopes"
          className="inv-textarea"
          rows={2}
          placeholder="Social Planner, calendars, conversations, …"
          value={scopes}
          onChange={(e) => setScopes(e.target.value)}
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="ghl-rotation">
          Rotation due
        </label>
        <input
          id="ghl-rotation"
          className="inv-input"
          type="date"
          value={rotationDue}
          onChange={(e) => setRotationDue(e.target.value)}
        />
      </div>

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy || !locationId.trim() || !apiToken.trim()}
          onClick={() =>
            call({
              locationId: locationId.trim(),
              apiToken: apiToken.trim(),
              scopes: scopes.trim(),
              rotationDue,
            })
          }
        >
          {connectedLocationId ? "Update connection" : "Connect"}
        </button>
        {connectedLocationId ? (
          <>
            <button
              type="button"
              className="inv-btn inv-btn-secondary"
              disabled={busy}
              onClick={() => call({ action: "metadata", scopes: scopes.trim(), rotationDue })}
            >
              Save scopes & rotation
            </button>
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
          </>
        ) : null}
      </div>
    </div>
  );
}
