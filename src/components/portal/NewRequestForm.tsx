"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <p className="border border-navy/20 bg-navy/5 px-4 py-3 text-sm text-navy">{error}</p>
      ) : null}

      <div>
        <label htmlFor="req-title" className="field-label field-label-on-light">
          What do you need?
        </label>
        <input
          id="req-title"
          type="text"
          required
          maxLength={140}
          placeholder="e.g. Instagram graphics for July promotion"
          className="field-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="req-type" className="field-label field-label-on-light">
            Type of work
          </label>
          <select
            id="req-type"
            className="field-input"
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

        <div>
          <label htmlFor="req-due" className="field-label field-label-on-light">
            Needed by (optional)
          </label>
          <input
            id="req-due"
            type="date"
            className="field-input"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="req-brief" className="field-label field-label-on-light">
          The brief
        </label>
        <textarea
          id="req-brief"
          required
          rows={7}
          placeholder={
            "Tell us everything: goal, audience, sizes/formats, copy or links to assets, examples you like…"
          }
          className="field-input resize-y"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
        />
        <p className="mt-2 text-xs text-ink/50">
          Link to files in Google Drive or Dropbox — the more context, the faster the turnaround.
        </p>
      </div>

      <fieldset>
        <legend className="field-label field-label-on-light">Priority</legend>
        <div className="mt-2 flex gap-3">
          {(["standard", "rush"] as const).map((p) => (
            <label
              key={p}
              className={`cursor-pointer border px-4 py-2 text-sm transition-colors ${
                priority === p
                  ? "border-navy bg-navy text-cream"
                  : "border-navy/20 text-ink/70 hover:border-navy/50"
              }`}
            >
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

      <div className="flex items-center gap-4">
        <Button type="submit" tone="light" pill disabled={loading}>
          {loading ? "Submitting…" : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
