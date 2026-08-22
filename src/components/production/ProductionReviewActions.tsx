"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductionReviewActions({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(decision: "approved" | "changes_requested") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/production/projects/${projectId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Review could not be recorded");
        return;
      }
      router.refresh();
    } catch {
      setError("Review request was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}
      {requesting ? (
        <div className="space-y-3">
          <textarea
            className="inv-textarea"
            rows={4}
            placeholder="What should the studio change?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="inv-action-row">
            <button type="button" className="inv-btn inv-btn-primary" disabled={busy || !note.trim()} onClick={() => decide("changes_requested")}>
              Send change request
            </button>
            <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={() => setRequesting(false)}>
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="inv-action-row">
          <button type="button" className="inv-btn inv-btn-primary" disabled={busy} onClick={() => decide("approved")}>
            Approve exact package
          </button>
          <button type="button" className="inv-btn inv-btn-secondary" disabled={busy} onClick={() => setRequesting(true)}>
            Request changes
          </button>
        </div>
      )}
    </div>
  );
}
