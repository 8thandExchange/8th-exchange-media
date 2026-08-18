"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MetaConnectionPublic } from "@/lib/portal/metaStore";

/**
 * Staff form to connect a brand's Meta Business assets.
 * The token is write-only: we show only whether a connection exists.
 */
export function MetaConnectionForm({
  clientId,
  initial,
  brandLabel,
}: {
  clientId: string | null;
  initial: MetaConnectionPublic | null;
  brandLabel: string;
}) {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [pageId, setPageId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [domainVerification, setDomainVerification] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const connected = Boolean(initial?.hasToken && initial.adAccountId);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/invoicing/meta/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, ...body }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to update the Meta connection");
        return;
      }
      setMessage(
        body.action === "disconnect"
          ? "Meta connection removed."
          : `Connected — ${brandLabel} ads now run in that ad account.`
      );
      setAccessToken("");
      setAdAccountId("");
      setPixelId("");
      setPageId("");
      setBusinessId("");
      setDomainVerification("");
      router.refresh();
    } catch {
      setError("Failed to update the Meta connection — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="inv-detail-label">Meta Business connection</div>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        {connected ? (
          <>
            Connected to ad account <code>{initial?.adAccountId}</code>
            {initial?.pixelId ? (
              <>
                {" "}
                · pixel <code>{initial.pixelId}</code>
              </>
            ) : (
              " · no pixel yet"
            )}
            {initial?.pageId ? (
              <>
                {" "}
                · page <code>{initial.pageId}</code>
              </>
            ) : null}
            . Campaigns for {brandLabel} spend here — not on another brand.
          </>
        ) : (
          <>
            Not connected. The client owns the Business Portfolio; 8E gets a System User token.
            Until this is saved, {brandLabel} cannot run ads from this dashboard. Step-by-step:
            docs/OPERATING_SYSTEM.md §5.
          </>
        )}
      </p>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-token-${clientId ?? "agency"}`}>
          System User token {connected ? "(enter again to replace)" : ""}
        </label>
        <input
          id={`meta-token-${clientId ?? "agency"}`}
          className="inv-input"
          type="password"
          placeholder="EAAG…"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-act-${clientId ?? "agency"}`}>
          Ad account id
        </label>
        <input
          id={`meta-act-${clientId ?? "agency"}`}
          className="inv-input"
          placeholder={initial?.adAccountId ?? "act_123… or 123…"}
          value={adAccountId}
          onChange={(e) => setAdAccountId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-pixel-${clientId ?? "agency"}`}>
          Pixel / Dataset id (optional — or create one after connecting)
        </label>
        <input
          id={`meta-pixel-${clientId ?? "agency"}`}
          className="inv-input"
          placeholder={initial?.pixelId ?? "15-digit number from Events Manager"}
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-page-${clientId ?? "agency"}`}>
          Facebook Page id (required to create ads)
        </label>
        <input
          id={`meta-page-${clientId ?? "agency"}`}
          className="inv-input"
          placeholder={initial?.pageId ?? "Page id from Business settings → Accounts → Pages"}
          value={pageId}
          onChange={(e) => setPageId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-biz-${clientId ?? "agency"}`}>
          Business Portfolio id (optional)
        </label>
        <input
          id={`meta-biz-${clientId ?? "agency"}`}
          className="inv-input"
          placeholder={initial?.businessId ?? "Business settings → Business info"}
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-verify-${clientId ?? "agency"}`}>
          Domain verification code (optional)
        </label>
        <input
          id={`meta-verify-${clientId ?? "agency"}`}
          className="inv-input"
          placeholder={initial?.domainVerification ?? "From Business settings → Brand safety → Domains"}
          value={domainVerification}
          onChange={(e) => setDomainVerification(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy || !accessToken.trim() || !adAccountId.trim()}
          onClick={() =>
            call({
              accessToken: accessToken.trim(),
              adAccountId: adAccountId.trim(),
              pixelId: pixelId.trim() || undefined,
              pageId: pageId.trim() || undefined,
              businessId: businessId.trim() || undefined,
              domainVerification: domainVerification.trim() || undefined,
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
              if (window.confirm(`Remove ${brandLabel}'s Meta connection?`)) {
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
