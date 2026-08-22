"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface ClientOption {
  id: string;
  company: string;
  website: string | null;
}

export function GrowthAuditForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("https://8emedia.com");
  const [maxPages, setMaxPages] = useState(12);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function chooseClient(value: string) {
    setClientId(value);
    if (!value) {
      setWebsiteUrl("https://8emedia.com");
      return;
    }
    const client = clients.find((candidate) => candidate.id === value);
    if (client?.website) setWebsiteUrl(client.website);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/portal/admin/growth/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || null,
          websiteUrl,
          maxPages,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { auditId?: string; error?: string }
        | null;
      if (!response.ok || !data?.auditId) {
        setError(data?.error ?? "The website audit could not be completed");
        return;
      }
      router.push(`/invoicing/growth/audits/${data.auditId}`);
      router.refresh();
    } catch {
      setError("The audit request was interrupted. Check the website and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="inv-card">
      <div className="inv-detail-section">
        <div className="inv-detail-label">New evidence audit</div>
        <div className="inv-form-grid" style={{ marginTop: 16 }}>
          <div className="inv-field">
            <label htmlFor="growth-client">Brand</label>
            <select
              id="growth-client"
              className="inv-select"
              value={clientId}
              onChange={(event) => chooseClient(event.target.value)}
            >
              <option value="">8E Media</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company}
                </option>
              ))}
            </select>
          </div>
          <div className="inv-field">
            <label htmlFor="growth-pages">Page limit</label>
            <input
              id="growth-pages"
              className="inv-input"
              type="number"
              min={1}
              max={25}
              value={maxPages}
              onChange={(event) => setMaxPages(Number(event.target.value))}
            />
          </div>
          <div className="inv-field inv-form-grid-full">
            <label htmlFor="growth-url">Public website</label>
            <input
              id="growth-url"
              className="inv-input"
              type="url"
              required
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              placeholder="https://example.com"
            />
            <span className="inv-field-hint">
              The crawler respects robots.txt, stays on this domain, and stores evidence—not raw HTML.
            </span>
          </div>
        </div>
        {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 16 }}>{error}</div> : null}
        <button
          type="submit"
          className="inv-btn inv-btn-primary"
          disabled={busy}
          style={{ marginTop: 18 }}
        >
          {busy ? "Auditing site…" : "Run content audit"}
        </button>
      </div>
    </form>
  );
}
