"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ShotListContent } from "@/lib/production/types";

export function ShotPlanEditor({
  projectId,
  initial,
  revision,
  editable,
}: {
  projectId: string;
  initial: ShotListContent;
  revision: number;
  editable: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update(index: number, key: "subject" | "action" | "location" | "equipment", value: string) {
    setContent((current) => ({
      shots: current.shots.map((shot, shotIndex) =>
        shotIndex === index ? { ...shot, [key]: value } : shot
      ),
    }));
  }

  async function save() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(
        `/api/portal/admin/production/projects/${projectId}/artifact`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ artifactType: "shot_list", content }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Shot plan revision could not be saved");
        return;
      }
      setMessage("New immutable shot-plan revision saved.");
      router.refresh();
    } catch {
      setError("Shot plan request was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inv-card">
      <div className="inv-detail-section">
        <div className="flex items-center justify-between gap-3">
          <div className="inv-detail-label">Shot plan · v{revision}</div>
          <span className="inv-badge inv-badge-draft">{content.shots.length} shots</span>
        </div>
        <div className="prod-shot-editor" style={{ marginTop: 14 }}>
          {content.shots.map((shot, index) => (
            <fieldset key={shot.id} className="prod-shot-row">
              <legend>
                #{shot.shotNumber} · {shot.framing.replaceAll("_", " ")} · {shot.priority}
              </legend>
              <div className="inv-form-grid">
                <div className="inv-field">
                  <label htmlFor={`${shot.id}-subject`}>Subject</label>
                  <input id={`${shot.id}-subject`} className="inv-input" disabled={!editable} value={shot.subject} onChange={(event) => update(index, "subject", event.target.value)} />
                </div>
                <div className="inv-field">
                  <label htmlFor={`${shot.id}-location`}>Location</label>
                  <input id={`${shot.id}-location`} className="inv-input" disabled={!editable} value={shot.location} onChange={(event) => update(index, "location", event.target.value)} />
                </div>
                <div className="inv-field inv-form-grid-full">
                  <label htmlFor={`${shot.id}-action`}>Action and composition</label>
                  <textarea id={`${shot.id}-action`} className="inv-textarea" rows={2} disabled={!editable} value={shot.action} onChange={(event) => update(index, "action", event.target.value)} />
                </div>
                <div className="inv-field inv-form-grid-full">
                  <label htmlFor={`${shot.id}-equipment`}>Equipment / production note</label>
                  <input id={`${shot.id}-equipment`} className="inv-input" disabled={!editable} value={shot.equipment} onChange={(event) => update(index, "equipment", event.target.value)} />
                </div>
              </div>
            </fieldset>
          ))}
        </div>
        {editable ? (
          <button type="button" className="inv-btn inv-btn-secondary" disabled={busy} onClick={save} style={{ marginTop: 14 }}>
            {busy ? "Saving…" : "Save shot-plan revision"}
          </button>
        ) : null}
        {message ? <div className="inv-alert inv-alert-success" style={{ marginTop: 12 }}>{message}</div> : null}
        {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>
    </div>
  );
}
