"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ClientMetaConnection } from "@/lib/portal/service";

/**
 * Staff form to connect a client's own Meta ad account.
 * The token is write-only: we show only whether a connection exists.
 */
export function MetaSettingsForm({
  clientId,
  connection,
}: {
  clientId: string;
  connection: ClientMetaConnection | null;
}) {
  const router = useRouter();
  const [adAccountId, setAdAccountId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const connected = Boolean(connection?.hasToken && connection.adAccountId);

  async function call(body: Record<string, string>) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/clients/${clientId}/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to update the Meta connection");
        return;
      }
      setMessage(
        body.action === "disconnect"
          ? "Meta connection removed."
          : "Connected — ads for this client now run in their Meta ad account."
      );
      setAdAccountId("");
      setAccessToken("");
      setPixelId("");
      setBusinessId("");
      router.refresh();
    } catch {
      setError("Failed to update the Meta connection — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="inv-detail-label">Meta Ads account</div>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        {connected ? (
          <>
            Connected to ad account <code>{connection?.adAccountId}</code>
            {connection?.pixelId ? (
              <>
                {" "}
                · Pixel <code>{connection.pixelId}</code>
              </>
            ) : (
              " · no Pixel id stored yet"
            )}
            . Campaigns for this client spend in <em>their</em> account, not 8E&apos;s.
          </>
        ) : (
          <>
            Not connected. Paste the client&apos;s ad account id and a system-user token created
            inside their Business Portfolio (Business settings → Users → System users, with{" "}
            <code>ads_management</code> and <code>ads_read</code>). Until then, this client cannot
            be selected on the Ads page. Full steps:{" "}
            <a href="/invoicing/ads" className="inv-link">
              Studio → Ads
            </a>
            .
          </>
        )}
      </p>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-ad-account">
          Ad account id
        </label>
        <input
          id="meta-ad-account"
          className="inv-input"
          placeholder={connection?.adAccountId ?? "act_1234567890"}
          value={adAccountId}
          onChange={(e) => setAdAccountId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-token">
          System-user token {connected ? "(enter again to replace)" : ""}
        </label>
        <input
          id="meta-token"
          className="inv-input"
          type="password"
          placeholder="EAAG…"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-pixel">
          Pixel / Dataset id (optional — can be created from the Ads page)
        </label>
        <input
          id="meta-pixel"
          className="inv-input"
          placeholder={connection?.pixelId ?? "15–16 digit id"}
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-business">
          Business Portfolio id (optional)
        </label>
        <input
          id="meta-business"
          className="inv-input"
          placeholder={connection?.businessId ?? "business.facebook.com id"}
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy || !adAccountId.trim() || !accessToken.trim()}
          onClick={() =>
            call({
              adAccountId: adAccountId.trim(),
              accessToken: accessToken.trim(),
              pixelId: pixelId.trim(),
              businessId: businessId.trim(),
            })
          }
        >
          {connected ? "Update connection" : "Connect"}
        </button>
        {connected ? (
          <button
            type="button"
            className="inv-btn inv-btn-ghost"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Remove this client's Meta connection?")) {
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
