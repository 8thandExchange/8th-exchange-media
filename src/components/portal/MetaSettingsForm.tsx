"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrandMetaAccount } from "@/lib/portal/metaAccounts";

export function MetaSettingsForm({
  clientId,
  company,
  initial,
}: {
  clientId: string;
  company: string;
  initial: BrandMetaAccount | null;
}) {
  const router = useRouter();
  const [pixelId, setPixelId] = useState(initial?.pixel_id ?? "");
  const [datasetId, setDatasetId] = useState(initial?.dataset_id ?? "");
  const [adAccountId, setAdAccountId] = useState(initial?.ad_account_id ?? "");
  const [businessId, setBusinessId] = useState(initial?.business_id ?? "");
  const [capiToken, setCapiToken] = useState("");
  const [systemUserToken, setSystemUserToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function call(body: Record<string, string | null>) {
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
          : `Saved. ${company}'s Pixel stays on their site — never on 8emedia.com.`
      );
      setCapiToken("");
      setSystemUserToken("");
      router.refresh();
    } catch {
      setError("Failed to update the Meta connection — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="inv-detail-label">Meta Ads &amp; Pixel</div>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        Client owns the Business Portfolio; 8E gets partner access. Store the IDs here so the Ads
        desk can switch brands. Install <em>this</em> Pixel on the client&apos;s website, not on
        8emedia.com. Tokens are write-only.
      </p>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-pixel">
          Pixel / Dataset ID
        </label>
        <input
          id="meta-pixel"
          className="inv-input"
          placeholder="e.g. 123456789012345"
          value={pixelId}
          onChange={(e) => setPixelId(e.target.value)}
          autoComplete="off"
          inputMode="numeric"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-dataset">
          Dataset ID (if different from the Pixel)
        </label>
        <input
          id="meta-dataset"
          className="inv-input"
          placeholder="Usually the same as the Pixel ID"
          value={datasetId}
          onChange={(e) => setDatasetId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-ad-account">
          Ad account ID
        </label>
        <input
          id="meta-ad-account"
          className="inv-input"
          placeholder="act_1234567890"
          value={adAccountId}
          onChange={(e) => setAdAccountId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-business">
          Business Portfolio ID
        </label>
        <input
          id="meta-business"
          className="inv-input"
          placeholder="From business.facebook.com → Business settings"
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-capi">
          Conversions API token {initial?.has_capi_token ? "(saved — enter again to replace)" : ""}
        </label>
        <input
          id="meta-capi"
          className="inv-input"
          type="password"
          placeholder="Events Manager → Settings → Generate access token"
          value={capiToken}
          onChange={(e) => setCapiToken(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-system-user">
          System user token {initial?.has_system_user_token ? "(saved — enter again to replace)" : ""}
        </label>
        <input
          id="meta-system-user"
          className="inv-input"
          type="password"
          placeholder="ads_read token assigned to this ad account"
          value={systemUserToken}
          onChange={(e) => setSystemUserToken(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy || !pixelId.trim()}
          onClick={() =>
            void call({
              pixelId: pixelId.trim(),
              datasetId: datasetId.trim() || null,
              adAccountId: adAccountId.trim() || null,
              businessId: businessId.trim() || null,
              ...(capiToken.trim() ? { capiToken: capiToken.trim() } : {}),
              ...(systemUserToken.trim() ? { systemUserToken: systemUserToken.trim() } : {}),
            })
          }
        >
          {initial ? "Update Meta connection" : "Save Meta IDs"}
        </button>
        {initial ? (
          <button
            type="button"
            className="inv-btn inv-btn-ghost"
            disabled={busy}
            onClick={() => {
              if (window.confirm("Remove this client's Meta IDs from the Ads desk?")) {
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
