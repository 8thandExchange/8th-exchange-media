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
  const [created, setCreated] = useState(false);

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

      const data = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setError(data?.error ?? "Failed to create client");
        return;
      }

      setCreated(true);
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

      {created ? (
        <div className="inv-alert inv-alert-success">
          Client created. Nothing to share — they sign in at 8emedia.com/portal with their email,
          and we send a one-time code each visit.
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

