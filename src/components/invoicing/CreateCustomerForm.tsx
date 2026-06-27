"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCustomerForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/invoicing/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          address:
            line1 || city || state || postalCode
              ? { line1, city, state, postal_code: postalCode, country: "US" }
              : undefined,
        }),
      });

      const data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to create customer");

      router.push(`/invoicing/customers/${data.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inv-form-grid max-w-2xl">
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-card inv-detail-section inv-form-grid inv-form-grid-2">
        <div className="inv-field">
          <label className="inv-label" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="inv-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="inv-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="phone">
            Phone
          </label>
          <input
            id="phone"
            className="inv-input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      </div>

      <div className="inv-card inv-detail-section inv-form-grid">
        <div className="inv-detail-label">Billing address</div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="line1">
            Street
          </label>
          <input
            id="line1"
            className="inv-input"
            value={line1}
            onChange={(event) => setLine1(event.target.value)}
          />
        </div>
        <div className="inv-form-grid inv-form-grid-2">
          <div className="inv-field">
            <label className="inv-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              className="inv-input"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
          <div className="inv-field">
            <label className="inv-label" htmlFor="state">
              State
            </label>
            <input
              id="state"
              className="inv-input"
              value={state}
              onChange={(event) => setState(event.target.value)}
            />
          </div>
        </div>
        <div className="inv-field max-w-xs">
          <label className="inv-label" htmlFor="postalCode">
            ZIP code
          </label>
          <input
            id="postalCode"
            className="inv-input"
            value={postalCode}
            onChange={(event) => setPostalCode(event.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="inv-btn inv-btn-primary w-fit" disabled={loading}>
        {loading ? "Saving..." : "Save customer"}
      </button>
    </form>
  );
}
