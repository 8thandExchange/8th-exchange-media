"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { REQUEST_STATUSES, type RequestStatus } from "@/lib/portal/types";

interface StaffRequestControlsProps {
  requestId: string;
  status: RequestStatus;
}

export function StaffRequestControls({ requestId, status }: StaffRequestControlsProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileLabel, setFileLabel] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [reply, setReply] = useState("");

  async function call(path: string, init: RequestInit): Promise<boolean> {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(path, {
        ...init,
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "Request failed");
        return false;
      }
      router.refresh();
      return true;
    } catch {
      setError("Request failed — try again");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inv-detail-section">
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-field">
        <label className="inv-label" htmlFor="req-status">
          Status
        </label>
        <select
          id="req-status"
          className="inv-select"
          value={status}
          disabled={busy}
          onChange={(e) =>
            call(`/api/portal/admin/requests/${requestId}`, {
              method: "PATCH",
              body: JSON.stringify({ status: e.target.value }),
            })
          }
        >
          {REQUEST_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <form
        className="inv-field"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!reply.trim()) return;
          const ok = await call(`/api/portal/admin/requests/${requestId}/updates`, {
            method: "POST",
            body: JSON.stringify({ body: reply }),
          });
          if (ok) setReply("");
        }}
      >
        <label className="inv-label" htmlFor="req-reply">
          Reply to client
        </label>
        <textarea
          id="req-reply"
          className="inv-textarea"
          rows={3}
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Visible to the client in their portal…"
        />
        <div className="inv-action-row">
          <button type="submit" className="inv-btn inv-btn-primary" disabled={busy || !reply.trim()}>
            Post reply
          </button>
        </div>
      </form>

      <form
        className="inv-field"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!fileLabel.trim() || !fileUrl.trim()) return;
          const ok = await call(`/api/portal/admin/requests/${requestId}/files`, {
            method: "POST",
            body: JSON.stringify({ label: fileLabel, url: fileUrl }),
          });
          if (ok) {
            setFileLabel("");
            setFileUrl("");
          }
        }}
      >
        <label className="inv-label">Add deliverable link</label>
        <input
          className="inv-input"
          placeholder="Label, e.g. Final logo package"
          value={fileLabel}
          onChange={(e) => setFileLabel(e.target.value)}
        />
        <input
          className="inv-input mt-2"
          placeholder="https://drive.google.com/…"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
        />
        <div className="inv-action-row">
          <button
            type="submit"
            className="inv-btn inv-btn-secondary"
            disabled={busy || !fileLabel.trim() || !fileUrl.trim()}
          >
            Add deliverable
          </button>
        </div>
      </form>
    </div>
  );
}
