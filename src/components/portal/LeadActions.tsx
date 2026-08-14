"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadActions({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [converted, setConverted] = useState(false);
  const [error, setError] = useState("");

  async function setStatus(next: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        setError("Update failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/leads/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Convert failed");
        return;
      }
      setConverted(true);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (converted) {
    return (
      <span>
        Converted — they can sign in at 8emedia.com/portal with their email.
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
      {error ? <span style={{ color: "#b3261e", fontSize: "0.75rem" }}>{error}</span> : null}
      {status !== "converted" ? (
        <button type="button" className="inv-btn inv-btn-primary" onClick={convert} disabled={busy}>
          Convert to client
        </button>
      ) : null}
      {status === "new" ? (
        <button
          type="button"
          className="inv-btn inv-btn-ghost"
          onClick={() => setStatus("contacted")}
          disabled={busy}
        >
          Mark contacted
        </button>
      ) : null}
      {status !== "archived" && status !== "converted" ? (
        <button
          type="button"
          className="inv-btn inv-btn-ghost"
          onClick={() => setStatus("archived")}
          disabled={busy}
        >
          Archive
        </button>
      ) : null}
    </span>
  );
}
