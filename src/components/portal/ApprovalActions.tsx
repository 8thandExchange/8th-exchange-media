"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

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
      {error ? <p className="mb-2 text-sm text-red-700">{error}</p> : null}
      {rejecting ? (
        <div className="space-y-3">
          <textarea
            className="border-hairline w-full bg-cream p-3 text-sm"
            rows={3}
            placeholder="What should we change?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex flex-wrap gap-3">
            <Button tone="light" pill disabled={busy || !note.trim()} onClick={() => decide("rejected")}>
              Send changes
            </Button>
            <button
              type="button"
              className="text-sm text-ink/60 underline underline-offset-4"
              onClick={() => setRejecting(false)}
              disabled={busy}
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button tone="light" pill disabled={busy} onClick={() => decide("approved")}>
            Approve
          </Button>
          <button
            type="button"
            className="text-sm text-ink/60 underline underline-offset-4"
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
