"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function ProductionRightsForm({
  projectId,
  channels,
}: {
  projectId: string;
  channels: string[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [assetType, setAssetType] = useState("b_roll");
  const [sourceUrl, setSourceUrl] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [rightsBasis, setRightsBasis] = useState("client_owned");
  const [status, setStatus] = useState("pending");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/portal/admin/production/projects/${projectId}/rights`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label,
            assetType,
            sourceUrl,
            ownerName,
            rightsBasis,
            status,
            allowedChannels: channels,
            allowedTerritories: ["United States"],
            modificationAllowed: true,
            evidenceUrl,
          }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Asset could not be registered");
        return;
      }
      setLabel("");
      setSourceUrl("");
      setOwnerName("");
      setEvidenceUrl("");
      router.refresh();
    } catch {
      setError("Asset intake was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="prod-rights-form">
      <div className="inv-form-grid">
        <div className="inv-field">
          <label htmlFor="rights-label">Asset label</label>
          <input id="rights-label" className="inv-input" required value={label} onChange={(event) => setLabel(event.target.value)} />
        </div>
        <div className="inv-field">
          <label htmlFor="rights-type">Asset type</label>
          <select id="rights-type" className="inv-select" value={assetType} onChange={(event) => setAssetType(event.target.value)}>
            <option value="b_roll">B-roll</option>
            <option value="logo">Logo</option>
            <option value="product">Product</option>
            <option value="location">Location</option>
            <option value="talent_release">Talent release</option>
            <option value="music">Music</option>
            <option value="sfx">Sound effect</option>
            <option value="graphic">Graphic</option>
            <option value="reference">Concept reference</option>
            <option value="final_master">Final master</option>
          </select>
        </div>
        <div className="inv-field inv-form-grid-full">
          <label htmlFor="rights-source">Public source URL</label>
          <input id="rights-source" className="inv-input" type="url" required value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://…" />
        </div>
        <div className="inv-field">
          <label htmlFor="rights-owner">Rights holder</label>
          <input id="rights-owner" className="inv-input" required value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
        </div>
        <div className="inv-field">
          <label htmlFor="rights-basis">Rights basis</label>
          <select id="rights-basis" className="inv-select" value={rightsBasis} onChange={(event) => setRightsBasis(event.target.value)}>
            <option value="client_owned">Client owned</option>
            <option value="work_for_hire">Work for hire</option>
            <option value="stock">Stock license</option>
            <option value="licensed">Licensed</option>
            <option value="editorial">Editorial only</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div className="inv-field">
          <label htmlFor="rights-status">Clearance</label>
          <select id="rights-status" className="inv-select" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="pending">Pending</option>
            <option value="cleared">Cleared</option>
            <option value="restricted">Restricted</option>
            <option value="expired">Expired</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>
        <div className="inv-field">
          <label htmlFor="rights-evidence">License/release evidence URL</label>
          <input id="rights-evidence" className="inv-input" type="url" value={evidenceUrl} onChange={(event) => setEvidenceUrl(event.target.value)} placeholder="https://…" />
        </div>
      </div>
      <button type="submit" className="inv-btn inv-btn-secondary" disabled={busy} style={{ marginTop: 14 }}>
        {busy ? "Registering…" : "Register asset & rights"}
      </button>
      {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
    </form>
  );
}
