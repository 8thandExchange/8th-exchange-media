"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const SERVICE_TYPES = [
  "Graphic design",
  "Brand / identity",
  "Email campaign",
  "SMS campaign",
  "Social content",
  "Paid ads",
  "Website / landing page",
  "SEO / content",
  "Video / editing",
  "Print / signage",
  "Other",
];

export function NewRequestForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [brief, setBrief] = useState("");
  const [priority, setPriority] = useState<"standard" | "rush">("standard");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/portal/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          serviceType,
          brief,
          priority,
          dueDate: dueDate || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { id?: string; error?: string }
        | null;

      if (!response.ok || !data?.id) {
        setError(data?.error ?? "Failed to submit request");
        return;
      }

      router.push(`/portal/requests/${data.id}`);
      router.refresh();
    } catch {
      setError("Failed to submit request — please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="inv-form-grid">
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-field">
        <label htmlFor="req-title" className="inv-label">
          What do you need?
        </label>
        <input
          id="req-title"
          type="text"
          required
          maxLength={140}
          placeholder="e.g. Instagram graphics for July promotion"
          className="inv-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="inv-form-grid inv-form-grid-2">
        <div className="inv-field">
          <label htmlFor="req-type" className="inv-label">
            Type of work
          </label>
          <select
            id="req-type"
            className="inv-select"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="inv-field">
          <label htmlFor="req-due" className="inv-label">
            Needed by (optional)
          </label>
          <input
            id="req-due"
            type="date"
            className="inv-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="inv-field">
        <label htmlFor="req-brief" className="inv-label">
          The brief
        </label>
        <textarea
          id="req-brief"
          required
          rows={7}
          placeholder={
            "Tell us everything: goal, audience, sizes/formats, copy or links to assets, examples you like…"
          }
          className="inv-textarea"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
        <p className="inv-help">
          Link to files in Google Drive or Dropbox — the more context, the faster the turnaround.
        </p>
      </div>

      <fieldset>
        <legend className="inv-label">Priority</legend>
        <div className="inv-segmented" style={{ marginTop: 8 }}>
          {(["standard", "rush"] as const).map((p) => (
            <label key={p} className={`inv-segment ${priority === p ? "active" : ""}`}>
              <input
                type="radio"
                name="priority"
                value={p}
                checked={priority === p}
                onChange={() => setPriority(p)}
                className="sr-only"
              />
              {p === "standard" ? "Standard" : "Rush"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="inv-action-row">
        <button type="submit" className="inv-btn inv-btn-primary" disabled={loading}>
          {loading ? "Submitting…" : "Submit request"}
        </button>
      </div>
    </form>
  );
}
