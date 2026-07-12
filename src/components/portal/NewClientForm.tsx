"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NewClientForm() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [issuedCode, setIssuedCode] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/portal/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, contactName, email }),
      });

      const data = (await response.json().catch(() => null)) as
        | { accessCode?: string; error?: string }
        | null;

      if (!response.ok || !data?.accessCode) {
        setError(data?.error ?? "Failed to create client");
        return;
      }

      setIssuedCode(data.accessCode);
      setCompany("");
      setContactName("");
      setEmail("");
      router.refresh();
    } catch {
      setError("Failed to create client — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inv-card">
      <div className="inv-detail-label">New portal client</div>

      {issuedCode ? (
        <div className="inv-alert inv-alert-success">
          Client created. Their access code — <strong>shown only once, share it securely</strong>:{" "}
          <code style={{ fontSize: "1rem", fontWeight: 700 }}>{issuedCode}</code>
        </div>
      ) : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <form onSubmit={handleSubmit} className="inv-form-grid">
        <div className="inv-field">
          <label className="inv-label" htmlFor="client-company">
            Company
          </label>
          <input
            id="client-company"
            className="inv-input"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="client-contact">
            Contact name
          </label>
          <input
            id="client-contact"
            className="inv-input"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="client-email">
            Login email
          </label>
          <input
            id="client-email"
            type="email"
            className="inv-input"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="inv-action-row">
          <button type="submit" className="inv-btn inv-btn-primary" disabled={loading}>
            {loading ? "Creating…" : "Create client"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function ResetCodeButton({ clientId }: { clientId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!window.confirm("Generate a new access code? The old one stops working immediately.")) {
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/portal/admin/clients/${clientId}/reset-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => null)) as { accessCode?: string } | null;
      if (response.ok && data?.accessCode) setCode(data.accessCode);
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <code style={{ fontWeight: 700 }} title="Shown only once — share securely">
        {code}
      </code>
    );
  }

  return (
    <button type="button" className="inv-btn inv-btn-ghost" onClick={reset} disabled={busy}>
      {busy ? "…" : "Reset code"}
    </button>
  );
}
