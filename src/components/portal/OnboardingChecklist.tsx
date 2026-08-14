"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CHECKLIST_TOTAL,
  ONBOARDING_CHECKLIST,
  checklistProgress,
  type ChecklistState,
} from "@/lib/portal/checklist";

/**
 * The digital-presence checklist — Google, Meta, X, LinkedIn, TikTok,
 * YouTube, GHL wiring, and the access audit. Checkbox state persists per
 * client; the progress bar is the "is this client fully armed?" answer.
 */
export function OnboardingChecklist({
  clientId,
  initialState,
}: {
  clientId: string;
  initialState: ChecklistState;
}) {
  const router = useRouter();
  const [state, setState] = useState<ChecklistState>(initialState ?? {});
  const [error, setError] = useState("");

  const done = useMemo(() => checklistProgress(state), [state]);
  const pct = Math.round((done / CHECKLIST_TOTAL) * 100);

  async function toggle(key: string) {
    const next = { ...state, [key]: { ...state[key], done: !state[key]?.done } };
    setState(next);
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/clients/${clientId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: { [key]: { done: next[key].done } } }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setState(state); // roll back optimistic update
      setError("Couldn't save that change — try again.");
    }
  }

  return (
    <div className="inv-card">
      <div className="inv-detail-label">Digital presence checklist</div>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
        <div
          style={{
            flex: 1,
            height: "6px",
            background: "var(--inv-neutral-bg)",
            borderRadius: "999px",
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuenow={done}
          aria-valuemin={0}
          aria-valuemax={CHECKLIST_TOTAL}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: pct === 100 ? "var(--inv-success)" : "var(--inv-gold)",
              transition: "width 0.3s",
            }}
          />
        </div>
        <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--inv-accent)", whiteSpace: "nowrap" }}>
          {done} / {CHECKLIST_TOTAL}
        </span>
      </div>

      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div style={{ display: "grid", gap: "22px" }}>
        {ONBOARDING_CHECKLIST.map((group) => (
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
            <div style={{ display: "grid", gap: "10px" }}>
              {group.items.map((item) => {
                const checked = Boolean(state[item.key]?.done);
                return (
                  <label
                    key={item.key}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "18px 1fr",
                      gap: "10px",
                      alignItems: "start",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
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
                        style={{
                          display: "block",
                          fontSize: "12px",
                          color: "var(--inv-text-muted)",
                          marginTop: "2px",
                          maxWidth: "62ch",
                        }}
                      >
                        {item.help}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
