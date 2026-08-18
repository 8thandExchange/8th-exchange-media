"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MetaCampaign, MetaPixel } from "@/lib/meta";
import { SITE_URL } from "@/lib/site";

export function MetaPixelCard({
  clientId,
  brandLabel,
  pixelId,
  pixels,
}: {
  clientId: string | null;
  brandLabel: string;
  pixelId: string | null;
  pixels: MetaPixel[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [testCode, setTestCode] = useState("");
  const [snippetCopied, setSnippetCopied] = useState(false);

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/invoicing/meta/pixel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, ...body }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        message?: string;
        pixel?: { id?: string };
      } | null;
      if (!response.ok) {
        setError(data?.error ?? "Pixel request failed");
        return;
      }
      setMessage(
        data?.message ??
          (data?.pixel?.id ? `Pixel ${data.pixel.id} is now the dataset for ${brandLabel}.` : "Saved.")
      );
      router.refresh();
    } catch {
      setError("Pixel request failed — try again");
    } finally {
      setBusy(false);
    }
  }

  const snippet = pixelId
    ? `<!-- 8E: paste into the client site only if this is not 8emedia.com -->\n<script>\n!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?\nn.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;\nn.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;\nt.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,\ndocument,'script','https://connect.facebook.net/en_US/fbevents.js');\nfbq('init', '${pixelId}');\nfbq('track', 'PageView');\n</script>`
    : "";

  return (
    <div className="inv-card" style={{ marginTop: "1rem" }}>
      <div className="inv-detail-label">Pixel / Dataset</div>
      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        {pixelId ? (
          <>
            Active pixel <code>{pixelId}</code>. On 8emedia.com this id is injected automatically
            (consent-gated, public pages only). Client sites need the snippet below.
          </>
        ) : (
          <>
            No pixel on this connection. Create one here or paste an Events Manager id on the
            connection form. Without a pixel there is no retargeting audience and no Lead
            optimization.
          </>
        )}
      </p>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      {pixels.length > 0 ? (
        <div className="inv-field">
          <span className="inv-label">Pixels already on this ad account</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.4rem" }}>
            {pixels.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`inv-btn ${p.id === pixelId ? "inv-btn-secondary" : "inv-btn-ghost"}`}
                disabled={busy || p.id === pixelId}
                onClick={() => call({ action: "use", pixelId: p.id })}
              >
                {p.name || p.id}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy}
          onClick={() => call({ name: brandLabel })}
        >
          {pixelId ? "Create another pixel" : "Create pixel"}
        </button>
      </div>

      {pixelId ? (
        <>
          <div className="inv-field" style={{ marginTop: "1rem" }}>
            <label className="inv-label" htmlFor={`meta-test-${clientId ?? "agency"}`}>
              Test event code from Events Manager (optional)
            </label>
            <input
              id={`meta-test-${clientId ?? "agency"}`}
              className="inv-input"
              placeholder="TEST12345"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              autoComplete="off"
            />
          </div>
          <button
            type="button"
            className="inv-btn inv-btn-secondary"
            disabled={busy}
            onClick={() => call({ action: "test", testEventCode: testCode.trim() || undefined })}
          >
            Send test Lead event
          </button>

          {snippet ? (
            <div className="inv-field" style={{ marginTop: "1rem" }}>
              <div className="inv-label">Snippet for a client site that is not this app</div>
              <textarea className="inv-input" readOnly rows={8} value={snippet} />
              <button
                type="button"
                className="inv-btn inv-btn-ghost"
                style={{ marginTop: "0.5rem" }}
                onClick={() => {
                  void navigator.clipboard.writeText(snippet);
                  setSnippetCopied(true);
                  setTimeout(() => setSnippetCopied(false), 2000);
                }}
              >
                {snippetCopied ? "Copied" : "Copy snippet"}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function MetaCampaignForm({
  clientId,
  defaultUrl,
}: {
  clientId: string | null;
  defaultUrl: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [destinationUrl, setDestinationUrl] = useState(defaultUrl);
  const [dailyBudgetUsd, setDailyBudgetUsd] = useState("20");
  const [primaryText, setPrimaryText] = useState("");
  const [headline, setHeadline] = useState("");
  const [objective, setObjective] = useState<"OUTCOME_TRAFFIC" | "OUTCOME_LEADS">("OUTCOME_LEADS");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/invoicing/meta/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          name,
          destinationUrl,
          dailyBudgetUsd: Number(dailyBudgetUsd),
          primaryText,
          headline,
          objective,
        }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        campaignId?: string;
      } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to create campaign");
        return;
      }
      setMessage(
        `Paused campaign ${data?.campaignId ?? ""} created. Open Ads Manager, check targeting and creative, then turn it on.`
      );
      setName("");
      setPrimaryText("");
      setHeadline("");
      router.refresh();
    } catch {
      setError("Failed to create campaign — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inv-card" style={{ marginTop: "1rem" }}>
      <div className="inv-detail-label">Create a paused campaign</div>
      <p className="inv-page-subtitle" style={{ marginTop: "0.375rem" }}>
        Campaign + ad set + link ad, always paused, US targeting. This is not Ads Manager — iterate
        creative and spend there. 8E&apos;s first ads should point at the Growth Map.
      </p>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-c-name">
          Campaign name
        </label>
        <input
          id="meta-c-name"
          className="inv-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Growth Map — CSRA — leads"
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-c-obj">
          Objective
        </label>
        <select
          id="meta-c-obj"
          className="inv-input"
          value={objective}
          onChange={(e) => setObjective(e.target.value as "OUTCOME_TRAFFIC" | "OUTCOME_LEADS")}
        >
          <option value="OUTCOME_LEADS">Leads (needs a pixel)</option>
          <option value="OUTCOME_TRAFFIC">Website traffic</option>
        </select>
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-c-url">
          Destination URL
        </label>
        <input
          id="meta-c-url"
          className="inv-input"
          value={destinationUrl}
          onChange={(e) => setDestinationUrl(e.target.value)}
          placeholder={`${SITE_URL}/growth-map`}
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-c-budget">
          Daily budget (USD)
        </label>
        <input
          id="meta-c-budget"
          className="inv-input"
          type="number"
          min={1}
          step="1"
          value={dailyBudgetUsd}
          onChange={(e) => setDailyBudgetUsd(e.target.value)}
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-c-text">
          Primary text
        </label>
        <textarea
          id="meta-c-text"
          className="inv-input"
          rows={4}
          value={primaryText}
          onChange={(e) => setPrimaryText(e.target.value)}
          placeholder="We audit your ads, funnel, and follow-up before the call. You leave with a written 90-day growth map."
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="meta-c-head">
          Headline
        </label>
        <input
          id="meta-c-head"
          className="inv-input"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="The Growth Map — free 30-minute strategy session"
          maxLength={255}
        />
      </div>

      <button
        type="button"
        className="inv-btn inv-btn-primary"
        disabled={busy || !name.trim() || !primaryText.trim() || !headline.trim()}
        onClick={() => void submit()}
      >
        {busy ? "Creating…" : "Create paused campaign"}
      </button>
    </div>
  );
}

export function MetaCampaignTable({ campaigns }: { campaigns: MetaCampaign[] }) {
  if (campaigns.length === 0) {
    return (
      <div className="inv-empty" style={{ marginTop: "1rem" }}>
        <div className="inv-empty-title">No campaigns on this ad account yet</div>
        <p className="inv-empty-text">
          Create a paused one below, or open Ads Manager if campaigns already live under another
          login.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="inv-nav-section">Campaigns — last 25</div>
      <div className="inv-table-wrap">
        <table className="inv-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Objective</th>
              <th>Status</th>
              <th>Daily budget</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.objective ?? "—"}</td>
                <td>
                  <span className="inv-badge inv-badge-open">{c.effective_status ?? c.status ?? "—"}</span>
                </td>
                <td>
                  {c.daily_budget
                    ? `$${(Number(c.daily_budget) / 100).toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
