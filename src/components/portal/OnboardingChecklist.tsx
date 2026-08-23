"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  checklistProgress,
  entryCompletedAt,
  itemRequired,
  visibleChecklist,
  type ChecklistEntry,
  type ChecklistState,
  type ClientType,
} from "@/lib/portal/checklist";

function formatWhen(iso?: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OnboardingChecklist({
  clientId,
  initialState,
  clientType,
  locked,
  lockReason,
}: {
  clientId: string;
  initialState: ChecklistState;
  clientType: ClientType;
  locked?: boolean;
  lockReason?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<ChecklistState>(initialState ?? {});
  const [staffName, setStaffName] = useState("");
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");

  const groups = useMemo(() => visibleChecklist(clientType), [clientType]);
  const progress = useMemo(() => checklistProgress(state, clientType), [state, clientType]);

  async function persist(key: string, entry: ChecklistEntry) {
    setSavingKey(key);
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/clients/${clientId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: { [key]: entry } }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(data?.error ?? "Couldn't save that change — try again.");
      router.refresh();
    } catch (err) {
      setState(initialState);
      setError(err instanceof Error ? err.message : "Couldn't save that change — try again.");
    } finally {
      setSavingKey("");
    }
  }

  async function toggle(key: string) {
    if (locked) return;
    const current = state[key] ?? { done: false };
    const next: ChecklistEntry = {
      ...current,
      done: !current.done,
      completedBy: !current.done ? staffName.trim() || current.completedBy : current.completedBy,
    };
    setState({ ...state, [key]: next });
    await persist(key, next);
  }

  async function patch(key: string, fields: Partial<ChecklistEntry>) {
    if (locked) return;
    const current = state[key] ?? { done: false };
    const next = { ...current, ...fields };
    setState({ ...state, [key]: next });
    await persist(key, next);
  }

  return (
    <div className="inv-card">
      <div className="inv-detail-label">Digital presence checklist</div>
      <p className="inv-page-subtitle" style={{ margin: "0 0 14px" }}>
        Required items carry 3× the weight of optional ones. Mode:{" "}
        <strong style={{ textTransform: "capitalize" }}>{clientType}</strong>.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
        <div
          style={{
            flex: 1,
            height: "6px",
            background: "var(--inv-neutral-bg)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              width: `${progress.percent}%`,
              height: "100%",
              background: progress.percent === 100 ? "var(--inv-success)" : "var(--inv-gold)",
              transition: "width 0.3s",
            }}
          />
        </div>
        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--inv-accent)", whiteSpace: "nowrap" }}>
          {progress.percent}% · req {progress.requiredDone}/{progress.requiredTotal} · opt{" "}
          {progress.optionalDone}/{progress.optionalTotal}
        </span>
      </div>

      <div className="inv-field" style={{ marginBottom: "16px", maxWidth: 320 }}>
        <label className="inv-label" htmlFor="ck-staff">
          Completed by (your name — stored on each item)
        </label>
        <input
          id="ck-staff"
          className="inv-input"
          placeholder="e.g. Troy"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          disabled={locked}
        />
      </div>

      {locked ? (
        <div className="inv-alert inv-alert-error" style={{ marginBottom: "16px" }}>
          {lockReason ??
            "Compliance is unanswered. BAA status, PHI-in-CRM, and the subprocessor list must be set before this checklist can move."}
        </div>
      ) : null}

      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div style={{ display: "grid", gap: "22px" }}>
        {groups.map((group) => (
          <section key={group.section}>
            <p
              style={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "var(--inv-gold-dark)",
                marginBottom: "10px",
              }}
            >
              {group.section}
            </p>
            <div style={{ display: "grid", gap: "16px" }}>
              {group.items.map((item) => {
                const entry = state[item.key];
                const checked = Boolean(entry?.done);
                const required = itemRequired(item, clientType);
                const completedAt = entryCompletedAt(entry);
                return (
                  <div
                    key={item.key}
                    style={{
                      border: "1px solid var(--inv-border)",
                      borderRadius: "var(--inv-radius-sm)",
                      padding: "12px",
                      background: checked ? "var(--inv-neutral-bg)" : "transparent",
                      opacity: locked ? 0.55 : 1,
                    }}
                  >
                    <label
                      style={{
                        display: "grid",
                        gridTemplateColumns: "18px 1fr",
                        gap: "10px",
                        alignItems: "start",
                        cursor: locked ? "not-allowed" : "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked || savingKey === item.key}
                        onChange={() => toggle(item.key)}
                        style={{ marginTop: "3px", accentColor: "var(--inv-accent)" }}
                      />
                      <span>
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: 500,
                            color: checked ? "var(--inv-text-muted)" : "var(--inv-text)",
                            textDecoration: checked ? "line-through" : "none",
                          }}
                        >
                          {item.label}
                        </span>
                        <span
                          className="inv-badge"
                          style={{
                            marginLeft: 8,
                            fontSize: 10,
                            verticalAlign: "middle",
                          }}
                        >
                          {required ? "Required" : "Optional"}
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: "12px",
                            color: "var(--inv-text-muted)",
                            marginTop: "2px",
                            maxWidth: "70ch",
                          }}
                        >
                          {item.help}
                        </span>
                      </span>
                    </label>

                    {item.valueLabel ? (
                      <div className="inv-field" style={{ marginTop: 10, marginLeft: 28 }}>
                        <label className="inv-label" htmlFor={`ck-val-${item.key}`}>
                          {item.valueLabel}
                        </label>
                        <input
                          id={`ck-val-${item.key}`}
                          className="inv-input"
                          placeholder={item.valuePlaceholder ?? ""}
                          defaultValue={entry?.value ?? ""}
                          disabled={locked}
                          onBlur={(e) => {
                            const value = e.target.value.trim();
                            if (value !== (entry?.value ?? "")) {
                              void patch(item.key, { value });
                            }
                          }}
                        />
                      </div>
                    ) : null}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                        marginTop: 10,
                        marginLeft: 28,
                      }}
                    >
                      <div className="inv-field">
                        <label className="inv-label" htmlFor={`ck-ev-${item.key}`}>
                          Evidence URL
                        </label>
                        <input
                          id={`ck-ev-${item.key}`}
                          className="inv-input"
                          placeholder="https://…"
                          defaultValue={entry?.evidenceUrl ?? ""}
                          disabled={locked}
                          onBlur={(e) => {
                            const evidenceUrl = e.target.value.trim();
                            if (evidenceUrl !== (entry?.evidenceUrl ?? "")) {
                              void patch(item.key, { evidenceUrl });
                            }
                          }}
                        />
                      </div>
                      <div className="inv-field">
                        <label className="inv-label" htmlFor={`ck-note-${item.key}`}>
                          Note
                        </label>
                        <input
                          id={`ck-note-${item.key}`}
                          className="inv-input"
                          defaultValue={entry?.note ?? ""}
                          disabled={locked}
                          onBlur={(e) => {
                            const note = e.target.value.trim();
                            if (note !== (entry?.note ?? "")) {
                              void patch(item.key, { note });
                            }
                          }}
                        />
                      </div>
                    </div>

                    {checked || entry?.completedBy || completedAt ? (
                      <p
                        style={{
                          margin: "8px 0 0 28px",
                          fontSize: 11.5,
                          color: "var(--inv-text-muted)",
                        }}
                      >
                        {entry?.completedBy ? `Completed by ${entry.completedBy}` : "Completed"}
                        {completedAt ? ` · ${formatWhen(completedAt)}` : ""}
                        {entry?.evidenceUrl ? (
                          <>
                            {" · "}
                            <a href={entry.evidenceUrl} className="inv-link" target="_blank" rel="noreferrer">
                              proof
                            </a>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
