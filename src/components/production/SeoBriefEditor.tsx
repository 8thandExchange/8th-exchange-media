"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SeoBriefContent } from "@/lib/production/types";

export function SeoBriefEditor({
  projectId,
  initial,
  revision,
  editable,
}: {
  projectId: string;
  initial: SeoBriefContent;
  revision: number;
  editable: boolean;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function lines(value: string): string[] {
    return value.split("\n").map((item) => item.trim()).filter(Boolean);
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
          body: JSON.stringify({ artifactType: "seo_brief", content }),
        }
      );
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "SEO brief revision could not be saved");
        return;
      }
      setMessage("New immutable SEO brief revision saved.");
      router.refresh();
    } catch {
      setError("SEO brief request was interrupted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inv-card">
      <div className="inv-detail-section">
        <div className="inv-detail-label">SEO content brief · v{revision}</div>
        <div className="inv-form-grid" style={{ marginTop: 14 }}>
          <div className="inv-field">
            <label htmlFor="seo-keyword">Primary keyword</label>
            <input
              id="seo-keyword"
              className="inv-input"
              disabled={!editable}
              value={content.primaryKeyword.term}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  primaryKeyword: { ...current.primaryKeyword, term: event.target.value },
                }))
              }
            />
            <span className="inv-field-hint">Source: {content.primaryKeyword.source}</span>
          </div>
          <div className="inv-field">
            <label htmlFor="seo-intent">Search intent</label>
            <select
              id="seo-intent"
              className="inv-select"
              disabled={!editable}
              value={content.searchIntent}
              onChange={(event) =>
                setContent((current) => ({
                  ...current,
                  searchIntent: event.target.value as SeoBriefContent["searchIntent"],
                }))
              }
            >
              <option value="informational">Informational</option>
              <option value="commercial">Commercial</option>
              <option value="transactional">Transactional</option>
              <option value="local">Local</option>
            </select>
          </div>
          <div className="inv-field">
            <label htmlFor="seo-slug">Proposed slug</label>
            <input id="seo-slug" className="inv-input" disabled={!editable} value={content.proposedSlug} onChange={(event) => setContent((current) => ({ ...current, proposedSlug: event.target.value }))} />
          </div>
          <div className="inv-field">
            <label htmlFor="seo-question">Audience question</label>
            <input id="seo-question" className="inv-input" disabled={!editable} value={content.audienceQuestion} onChange={(event) => setContent((current) => ({ ...current, audienceQuestion: event.target.value }))} />
          </div>
          <div className="inv-field">
            <label htmlFor="seo-titles">Title options · one per line</label>
            <textarea id="seo-titles" className="inv-textarea" rows={4} disabled={!editable} value={content.titleOptions.join("\n")} onChange={(event) => setContent((current) => ({ ...current, titleOptions: lines(event.target.value) }))} />
          </div>
          <div className="inv-field">
            <label htmlFor="seo-descriptions">Meta descriptions · one per line</label>
            <textarea id="seo-descriptions" className="inv-textarea" rows={4} disabled={!editable} value={content.metaDescriptions.join("\n")} onChange={(event) => setContent((current) => ({ ...current, metaDescriptions: lines(event.target.value) }))} />
          </div>
          <div className="inv-field inv-form-grid-full">
            <label htmlFor="seo-outline">Outline headings · one per line</label>
            <textarea
              id="seo-outline"
              className="inv-textarea"
              rows={6}
              disabled={!editable}
              value={content.outline.map((item) => item.heading).join("\n")}
              onChange={(event) => {
                const headings = lines(event.target.value);
                setContent((current) => ({
                  ...current,
                  outline: headings.map((heading, index) => ({
                    level: current.outline[index]?.level ?? 2,
                    heading,
                    purpose: current.outline[index]?.purpose ?? "Explain this section clearly and support every claim.",
                  })),
                }));
              }}
            />
          </div>
        </div>
        {editable ? (
          <button type="button" className="inv-btn inv-btn-secondary" disabled={busy} onClick={save} style={{ marginTop: 14 }}>
            {busy ? "Saving…" : "Save SEO brief revision"}
          </button>
        ) : null}
        {message ? <div className="inv-alert inv-alert-success" style={{ marginTop: 12 }}>{message}</div> : null}
        {error ? <div className="inv-alert inv-alert-error" style={{ marginTop: 12 }}>{error}</div> : null}
      </div>
    </div>
  );
}
