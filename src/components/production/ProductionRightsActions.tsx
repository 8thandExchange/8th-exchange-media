"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CreativeRightsAsset } from "@/lib/production/types";

export function ProductionRightsActions({
  projectId,
  assetId,
  status,
}: {
  projectId: string;
  assetId: string;
  status: CreativeRightsAsset["status"];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function update(next: CreativeRightsAsset["status"]) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/admin/production/projects/${projectId}/rights`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId, status: next }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Rights status could not be updated");
        return;
      }
      router.refresh();
    } catch {
      setError("Rights update was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Remove this asset and its rights record?")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/admin/production/projects/${projectId}/rights`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assetId }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Asset could not be removed");
        return;
      }
      router.refresh();
    } catch {
      setError("Asset removal was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {status !== "cleared" ? (
          <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={() => update("cleared")}>
            Clear
          </button>
        ) : (
          <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={() => update("pending")}>
            Reopen
          </button>
        )}
        {status !== "revoked" ? (
          <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={() => update("revoked")}>
            Revoke
          </button>
        ) : null}
        <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={remove}>
          Remove
        </button>
      </div>
      {error ? <small style={{ color: "var(--inv-danger)" }}>{error}</small> : null}
    </div>
  );
}
