"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApprovalActions({ postId }: { postId: string }) {
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/social/approvals/${postId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Something went wrong — try again");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}
      {rejecting ? (
        <div className="space-y-3">
          <textarea
            className="inv-textarea"
            rows={3}
            placeholder="What should we change?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="inv-action-row">
            <button
              type="button"
              className="inv-btn inv-btn-primary"
              disabled={busy || !note.trim()}
              onClick={() => decide("rejected")}
            >
              Send changes
            </button>
            <button
              type="button"
              className="inv-btn inv-btn-ghost"
              onClick={() => setRejecting(false)}
              disabled={busy}
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="inv-action-row">
          <button
            type="button"
            className="inv-btn inv-btn-primary"
            disabled={busy}
            onClick={() => decide("approved")}
          >
            Approve
          </button>
          <button
            type="button"
            className="inv-btn inv-btn-secondary"
            onClick={() => setRejecting(true)}
            disabled={busy}
          >
            Request changes
          </button>
        </div>
      )}
    </div>
  );
}
