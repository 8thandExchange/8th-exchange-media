"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadActions({ leadId, status }: { leadId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState<string | null>(null);
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
      const data = (await response.json().catch(() => null)) as
        | { accessCode?: string; error?: string }
        | null;
      if (!response.ok || !data?.accessCode) {
        setError(data?.error ?? "Convert failed");
        return;
      }
      setCode(data.accessCode);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (code) {
    return (
      <span title="One-time access code — share securely">
        Portal code: <code style={{ fontWeight: 700 }}>{code}</code>
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
