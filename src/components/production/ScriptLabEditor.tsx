"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type {
  HookSetContent,
  ScriptContent,
} from "@/lib/production/types";

export function ScriptLabEditor({
  projectId,
  initialHooks,
  initialScript,
  hookRevision,
  scriptRevision,
  editable,
}: {
  projectId: string;
  initialHooks: HookSetContent;
  initialScript: ScriptContent;
  hookRevision: number;
  scriptRevision: number;
  editable: boolean;
}) {
  const router = useRouter();
  const [hooks, setHooks] = useState(initialHooks);
  const [script, setScript] = useState(initialScript);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const estimatedSeconds = useMemo(
    () => script.beats.reduce((sum, beat) => sum + beat.estimatedSeconds, 0),
    [script]
  );
  const wordCount = useMemo(
    () =>
      script.beats.reduce(
        (sum, beat) => sum + beat.spokenCopy.trim().split(/\s+/).filter(Boolean).length,
        0
      ),
    [script]
  );

  function selectHook(id: string) {
    const nextHooks = {
      hooks: hooks.hooks.map((hook) => ({ ...hook, selected: hook.id === id })),
    };
    const selected = nextHooks.hooks.find((hook) => hook.id === id)!;
    setHooks(nextHooks);
    setScript((current) => ({
      ...current,
      selectedHookId: id,
      beats: current.beats.map((beat) =>
        beat.role === "hook"
          ? {
              ...beat,
              spokenCopy: selected.spokenText,
              onScreenCopy: selected.onScreenText,
              estimatedSeconds: selected.estimatedSeconds,
            }
          : beat
      ),
    }));
  }

  function updateBeat(index: number, key: "spokenCopy" | "onScreenCopy" | "visualIntent", value: string) {
    setScript((current) => ({
      ...current,
      beats: current.beats.map((beat, beatIndex) =>
        beatIndex === index ? { ...beat, [key]: value } : beat
      ),
    }));
  }

  async function save() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      for (const payload of [
        { artifactType: "hook_set", content: hooks },
        { artifactType: "script", content: script },
      ]) {
        const response = await fetch(
          `/api/portal/admin/production/projects/${projectId}/artifact`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) throw new Error(data?.error ?? "Script revision could not be saved");
      }
      setMessage("New immutable Script Lab revisions saved.");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Script revision could not be saved");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="prod-script-lab">
      <div className="prod-script-sidebar inv-card">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Hook library · v{hookRevision}</div>
          <div className="space-y-2" style={{ marginTop: 12 }}>
            {hooks.hooks.map((hook) => (
              <button
                key={hook.id}
                type="button"
                className={`prod-hook ${hook.selected ? "selected" : ""}`}
                onClick={() => editable && selectHook(hook.id)}
                disabled={!editable}
              >
                <span>{hook.framework}</span>
                <strong>{hook.spokenText}</strong>
                <small>{hook.estimatedSeconds}s · {hook.intendedEmotion}</small>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="inv-card">
        <div className="inv-detail-section">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="inv-detail-label">Timed script · v{scriptRevision}</div>
              <p className="inv-page-subtitle">
                {wordCount} words · {estimatedSeconds}s estimated · {script.targetDurationSeconds}s target
              </p>
            </div>
            <span className={`inv-badge ${
              Math.abs(estimatedSeconds - script.targetDurationSeconds) <= script.targetDurationSeconds * 0.25
                ? "inv-badge-paid"
                : "inv-badge-overdue"
            }`}>
              duration {estimatedSeconds}s
            </span>
          </div>
          <div className="space-y-4" style={{ marginTop: 18 }}>
            {script.beats.map((beat, index) => (
              <fieldset key={beat.id} className="prod-beat">
                <legend>{index + 1}. {beat.role} · {beat.estimatedSeconds}s</legend>
                <div className="inv-field">
                  <label htmlFor={`${beat.id}-spoken`}>Spoken copy</label>
                  <textarea
                    id={`${beat.id}-spoken`}
                    className="inv-textarea"
                    rows={3}
                    value={beat.spokenCopy}
                    disabled={!editable}
                    onChange={(event) => updateBeat(index, "spokenCopy", event.target.value)}
                  />
                </div>
                <div className="inv-form-grid" style={{ marginTop: 10 }}>
                  <div className="inv-field">
                    <label htmlFor={`${beat.id}-screen`}>On-screen copy</label>
                    <input
                      id={`${beat.id}-screen`}
                      className="inv-input"
                      value={beat.onScreenCopy}
                      disabled={!editable}
                      onChange={(event) => updateBeat(index, "onScreenCopy", event.target.value)}
                    />
                  </div>
                  <div className="inv-field">
                    <label htmlFor={`${beat.id}-visual`}>Visual intent</label>
                    <textarea
                      id={`${beat.id}-visual`}
                      className="inv-textarea"
                      rows={2}
                      value={beat.visualIntent}
                      disabled={!editable}
                      onChange={(event) => updateBeat(index, "visualIntent", event.target.value)}
                    />
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
          {editable ? (
            <button type="button" className="inv-btn inv-btn-primary" disabled={busy} onClick={save} style={{ marginTop: 16 }}>
              {busy ? "Saving revision…" : "Save new revisions"}
            </button>
          ) : (
            <div className="inv-alert" style={{ marginTop: 16 }}>
              This exact revision is locked for review or approval.
            </div>
          )}
          {message ? <div className="inv-alert inv-alert-success" style={{ marginTop: 12 }}>{message}</div> : null}
          {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
        </div>
      </div>
    </section>
  );
}
