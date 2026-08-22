"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CreativeProjectStatus } from "@/lib/production/types";

export function ProductionProjectActions({
  projectId,
  status,
  hasClient,
}: {
  projectId: string;
  status: CreativeProjectStatus;
  hasClient: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function act(action: string, endpoint = "") {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(
        `/api/portal/admin/production/projects/${projectId}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(endpoint ? {} : { action, note: note.trim() || undefined }),
        }
      );
      const data = (await response.json().catch(() => null)) as
        | { error?: string; message?: string }
        | null;
      if (!response.ok) {
        setError(data?.error ?? "Production action failed");
        return;
      }
      setNote("");
      setMessage(data?.message ?? "Production updated.");
      router.refresh();
    } catch {
      setError("Production action was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inv-card">
      <div className="inv-detail-section">
        <div className="inv-detail-label">Production governance</div>
        <p className="inv-page-subtitle">
          QA, rights, and exact revision hashes gate approval. Distribution creates drafts only.
        </p>
        {status === "in_review" ? (
          <textarea
            className="inv-textarea"
            rows={3}
            placeholder="Change request note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            style={{ marginTop: 12 }}
          />
        ) : null}
        <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
          {status === "planning" || status === "changes_requested" ? (
            <button type="button" className="inv-btn inv-btn-primary" disabled={busy} onClick={() => act("start_production")}>
              Start production
            </button>
          ) : null}
          {status === "in_production" ? (
            <button type="button" className="inv-btn inv-btn-primary" disabled={busy} onClick={() => act("submit_review")}>
              Run QA & submit review
            </button>
          ) : null}
          {status === "in_review" && !hasClient ? (
            <button type="button" className="inv-btn inv-btn-primary" disabled={busy} onClick={() => act("approve")}>
              Approve agency package
            </button>
          ) : null}
          {status === "in_review" ? (
            <button
              type="button"
              className="inv-btn inv-btn-secondary"
              disabled={busy || !note.trim()}
              onClick={() => act("request_changes")}
            >
              Return with changes
            </button>
          ) : null}
          {status === "approved" || status === "released" ? (
            <button type="button" className="inv-btn inv-btn-primary" disabled={busy} onClick={() => act("launch", "/launch")}>
              Create distribution drafts
            </button>
          ) : null}
          {status === "released" ? (
            <button type="button" className="inv-btn inv-btn-secondary" disabled={busy} onClick={() => act("complete")}>
              Complete production
            </button>
          ) : null}
        </div>
        {status === "in_review" && hasClient ? (
          <div className="inv-alert" style={{ marginTop: 12 }}>
            The exact package is waiting in the client portal.
          </div>
        ) : null}
        {message ? <div className="inv-alert inv-alert-success" style={{ marginTop: 12 }}>{message}</div> : null}
        {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>
    </div>
  );
}
