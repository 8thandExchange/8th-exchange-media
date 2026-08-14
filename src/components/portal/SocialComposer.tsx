"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { GhlSocialAccount } from "@/lib/ghl";

export function SocialComposer({
  accounts,
  clientId,
}: {
  accounts: GhlSocialAccount[];
  /** Post as this client's GHL sub-account; null posts as the agency. */
  clientId: string | null;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [selected, setSelected] = useState<string[]>(accounts.map((a) => a.id));
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function toggleAccount(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function submit(status: "draft" | "scheduled" | "published") {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/portal/admin/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary,
          clientId: clientId ?? undefined,
          accountIds: selected,
          mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
          scheduleDate:
            status === "scheduled" && scheduleAt
              ? new Date(scheduleAt).toISOString()
              : undefined,
          status,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Failed to create post");
        return;
      }
      setMessage(
        status === "draft"
          ? "Saved as draft in the Social Planner."
          : status === "scheduled"
            ? "Post scheduled."
            : "Post published."
      );
      setSummary("");
      setMediaUrl("");
      setScheduleAt("");
      router.refresh();
    } catch {
      setError("Failed to create post — try again");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = summary.trim().length > 0 && selected.length > 0;

  return (
    <div className="inv-card">
      <div className="inv-detail-label">Compose</div>

      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-field">
        <label className="inv-label" htmlFor="sc-summary">
          Post text
        </label>
        <textarea
          id="sc-summary"
          className="inv-textarea"
          rows={5}
          placeholder="What are we posting?"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="sc-media">
          Image / video URL (optional — must be a public link)
        </label>
        <input
          id="sc-media"
          className="inv-input"
          placeholder="https://…"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
        />
      </div>

      <div className="inv-field">
        <span className="inv-label">Post to</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.375rem" }}>
          {accounts.map((a) => (
            <label
              key={a.id}
              className="inv-btn inv-btn-ghost"
              style={{
                cursor: "pointer",
                opacity: selected.includes(a.id) ? 1 : 0.45,
                border: selected.includes(a.id) ? "1px solid currentColor" : undefined,
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(a.id)}
                onChange={() => toggleAccount(a.id)}
                style={{ display: "none" }}
              />
              {a.platform ?? a.type ?? "account"}: {a.name ?? a.id}
            </label>
          ))}
        </div>
      </div>

      <div className="inv-field">
        <label className="inv-label" htmlFor="sc-schedule">
          Schedule for (leave empty to post now or save a draft)
        </label>
        <input
          id="sc-schedule"
          type="datetime-local"
          className="inv-input"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
        />
      </div>

      <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="inv-btn inv-btn-secondary"
          disabled={busy || !canSubmit}
          onClick={() => submit("draft")}
        >
          Save draft
        </button>
        <button
          type="button"
          className="inv-btn inv-btn-secondary"
          disabled={busy || !canSubmit || !scheduleAt}
          onClick={() => submit("scheduled")}
        >
          Schedule
        </button>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          disabled={busy || !canSubmit}
          onClick={() => {
            if (window.confirm("Publish immediately to the selected accounts?")) {
              void submit("published");
            }
          }}
        >
          Post now
        </button>
      </div>
    </div>
  );
}
