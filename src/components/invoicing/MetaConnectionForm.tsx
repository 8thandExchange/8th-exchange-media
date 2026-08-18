"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MetaConnectionPublic } from "@/lib/ads/connections";

/**
 * Staff form to register a client's Meta Pixel and ad account.
 * Tokens are write-only. The client's Pixel is never loaded on 8emedia.com.
 */
export function MetaConnectionForm({
  clientId,
  connection,
  missingTable,
}: {
  clientId: string;
  connection: MetaConnectionPublic | null;
  missingTable?: boolean;
}) {
  const router = useRouter();
  const [pixelId, setPixelId] = useState("");
  const [adAccountId, setAdAccountId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [capiToken, setCapiToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
          : "Saved. This client's ads and pixel stay on their own site and ad account — never on 8emedia.com."
      );
      setPixelId("");
      setAdAccountId("");
      setBusinessId("");
      setCapiToken("");
      router.refresh();
    } catch {
      setError("Failed to update the Meta connection — try again");
    } finally {
      setBusy(false);
    }
  }

  const connected = Boolean(connection?.pixelId || connection?.adAccountId);

  return (
    <div>
      <div className="inv-detail-label">Meta ads (Facebook &amp; Instagram)</div>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      {missingTable ? (
        <div className="inv-alert inv-alert-error">
          The <code>brand_ads_connections</code> table is not in Supabase yet. Open{" "}
          <a href="/invoicing/ads" className="inv-link">
            Ads
          </a>{" "}
          and run the SQL there first.
        </div>
      ) : null}

      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        {connected ? (
          <>
            Pixel {connection?.pixelId ? <code>{connection.pixelId}</code> : "not set"}
            {" · "}
            Ad account {connection?.adAccountId ? <code>{connection.adAccountId}</code> : "not set"}
            {" · "}
            CAPI token {connection?.hasCapiToken ? "saved" : "missing"}. IDs belong on{" "}
            <em>their</em> website, not 8emedia.com.
          </>
        ) : (
          <>
            Not connected. Create the Pixel and ad account in the <em>client&apos;s</em> Business
            Portfolio (8E as partner), then paste the IDs. Until a Pixel exists, conversion ads
            have nothing to optimize against.
          </>
        )}
      </p>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-pixel-${clientId}`}>
          Pixel / Dataset ID
        </label>
        <input
          id={`meta-pixel-${clientId}`}
          className="inv-input"
          placeholder={connection?.pixelId ?? "e.g. 123456789012345"}
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          autoComplete="off"
          inputMode="numeric"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-act-${clientId}`}>
          Ad account ID
        </label>
        <input
          id={`meta-act-${clientId}`}
          className="inv-input"
          placeholder={connection?.adAccountId ?? "e.g. act_1234567890"}
          value={adAccountId}
          onChange={(e) => setAdAccountId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-biz-${clientId}`}>
          Business Portfolio ID (optional)
        </label>
        <input
          id={`meta-biz-${clientId}`}
          className="inv-input"
          placeholder={connection?.businessId ?? "from business.facebook.com → Business settings"}
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor={`meta-capi-${clientId}`}>
          Conversions API token {connection?.hasCapiToken ? "(enter again to replace)" : ""}
        </label>
        <input
          id={`meta-capi-${clientId}`}
          className="inv-input"
          type="password"
          placeholder="Events Manager → Dataset → Settings → Generate access token"
          value={capiToken}
          onChange={(e) => setCapiToken(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-action-row">
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy || (!pixelId.trim() && !adAccountId.trim())}
          onClick={() =>
            void call({
              pixelId: pixelId.trim(),
              adAccountId: adAccountId.trim(),
              businessId: businessId.trim(),
              capiToken: capiToken.trim(),
            })
          }
        >
          {connected ? "Update connection" : "Save Meta IDs"}
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
