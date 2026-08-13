"use client";

import { useState } from "react";
import type { BrandColor, BrandKit, BrandLink } from "@/lib/portal/service";

interface BrandKitEditorProps {
  clientId: string;
  initialKit: BrandKit;
}

function linesToList(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function listToLines(list?: string[]): string {
  return (list ?? []).join("\n");
}

const SOCIAL_KEYS = ["instagram", "facebook", "linkedin", "x", "tiktok", "youtube", "google"];

export function BrandKitEditor({ clientId, initialKit }: BrandKitEditorProps) {
  const [tagline, setTagline] = useState(initialKit.tagline ?? "");
  const [mission, setMission] = useState(initialKit.mission ?? "");
  const [audience, setAudience] = useState(initialKit.audience ?? "");
  const [voiceTone, setVoiceTone] = useState(initialKit.voiceTone ?? "");
  const [voiceDos, setVoiceDos] = useState(listToLines(initialKit.voiceDos));
  const [voiceDonts, setVoiceDonts] = useState(listToLines(initialKit.voiceDonts));
  const [colors, setColors] = useState<BrandColor[]>(initialKit.colors ?? []);
  const [headingFont, setHeadingFont] = useState(initialKit.headingFont ?? "");
  const [bodyFont, setBodyFont] = useState(initialKit.bodyFont ?? "");
  const [typographyNotes, setTypographyNotes] = useState(initialKit.typographyNotes ?? "");
  const [logos, setLogos] = useState<BrandLink[]>(initialKit.logos ?? []);
  const [assets, setAssets] = useState<BrandLink[]>(initialKit.assets ?? []);
  const [socials, setSocials] = useState<Record<string, string>>(initialKit.socials ?? {});
  const [keywords, setKeywords] = useState(listToLines(initialKit.keywords));
  const [competitors, setCompetitors] = useState(listToLines(initialKit.competitors));
  const [notes, setNotes] = useState(initialKit.notes ?? "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`/api/portal/admin/clients/${clientId}/brand-kit`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagline,
          mission,
          audience,
          voiceTone,
          voiceDos: linesToList(voiceDos),
          voiceDonts: linesToList(voiceDonts),
          colors,
          headingFont,
          bodyFont,
          typographyNotes,
          logos,
          assets,
          socials,
          keywords: linesToList(keywords),
          competitors: linesToList(competitors),
          notes,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Save failed");
        return;
      }
      setMessage("Brand kit saved.");
    } catch {
      setError("Save failed — try again");
    } finally {
      setSaving(false);
    }
  }

  function updateLink(
    list: BrandLink[],
    setList: (v: BrandLink[]) => void,
    index: number,
    patch: Partial<BrandLink>
  ) {
    setList(list.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  return (
    <div className="inv-form-grid" style={{ maxWidth: 860 }}>
      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      <div className="inv-detail-label">Identity</div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="bk-tagline">
          Tagline
        </label>
        <input
          id="bk-tagline"
          className="inv-input"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="bk-mission">
          Mission / positioning
        </label>
        <textarea
          id="bk-mission"
          className="inv-textarea"
          rows={3}
          value={mission}
          onChange={(e) => setMission(e.target.value)}
        />
      </div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="bk-audience">
          Target audience
        </label>
        <textarea
          id="bk-audience"
          className="inv-textarea"
          rows={2}
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
        />
      </div>

      <div className="inv-detail-label" style={{ marginTop: "1rem" }}>
        Voice
      </div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="bk-tone">
          Tone of voice
        </label>
        <textarea
          id="bk-tone"
          className="inv-textarea"
          rows={2}
          placeholder="e.g. Warm, expert, plain-spoken. Southern hospitality without the clichés."
          value={voiceTone}
          onChange={(e) => setVoiceTone(e.target.value)}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="inv-field">
          <label className="inv-label" htmlFor="bk-dos">
            Always (one per line)
          </label>
          <textarea
            id="bk-dos"
            className="inv-textarea"
            rows={4}
            value={voiceDos}
            onChange={(e) => setVoiceDos(e.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="bk-donts">
            Never (one per line)
          </label>
          <textarea
            id="bk-donts"
            className="inv-textarea"
            rows={4}
            value={voiceDonts}
            onChange={(e) => setVoiceDonts(e.target.value)}
          />
        </div>
      </div>

      <div className="inv-detail-label" style={{ marginTop: "1rem" }}>
        Colors
      </div>
      {colors.map((c, i) => (
        <div
          key={i}
          style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}
        >
          <span
            aria-hidden
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: "1px solid rgba(0,0,0,0.15)",
              background: /^#[0-9a-fA-F]{3,8}$/.test(c.hex) ? c.hex : "transparent",
              flexShrink: 0,
            }}
          />
          <input
            className="inv-input"
            style={{ maxWidth: 180 }}
            placeholder="Name"
            aria-label={`Color ${i + 1} name`}
            value={c.name}
            onChange={(e) =>
              setColors(colors.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))
            }
          />
          <input
            className="inv-input"
            style={{ maxWidth: 120 }}
            placeholder="#0B1B3D"
            aria-label={`Color ${i + 1} hex`}
            value={c.hex}
            onChange={(e) =>
              setColors(colors.map((x, j) => (j === i ? { ...x, hex: e.target.value } : x)))
            }
          />
          <input
            className="inv-input"
            style={{ flex: 1, minWidth: 140 }}
            placeholder="Usage (e.g. primary, backgrounds)"
            aria-label={`Color ${i + 1} usage`}
            value={c.usage ?? ""}
            onChange={(e) =>
              setColors(colors.map((x, j) => (j === i ? { ...x, usage: e.target.value } : x)))
            }
          />
          <button
            type="button"
            className="inv-btn inv-btn-ghost"
            onClick={() => setColors(colors.filter((_, j) => j !== i))}
          >
            Remove
          </button>
        </div>
      ))}
      <div>
        <button
          type="button"
          className="inv-btn inv-btn-secondary"
          onClick={() => setColors([...colors, { name: "", hex: "" }])}
        >
          Add color
        </button>
      </div>

      <div className="inv-detail-label" style={{ marginTop: "1rem" }}>
        Typography
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="inv-field">
          <label className="inv-label" htmlFor="bk-heading-font">
            Heading font
          </label>
          <input
            id="bk-heading-font"
            className="inv-input"
            value={headingFont}
            onChange={(e) => setHeadingFont(e.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="bk-body-font">
            Body font
          </label>
          <input
            id="bk-body-font"
            className="inv-input"
            value={bodyFont}
            onChange={(e) => setBodyFont(e.target.value)}
          />
        </div>
      </div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="bk-typo-notes">
          Typography notes
        </label>
        <textarea
          id="bk-typo-notes"
          className="inv-textarea"
          rows={2}
          value={typographyNotes}
          onChange={(e) => setTypographyNotes(e.target.value)}
        />
      </div>

      {(
        [
          ["Logos", logos, setLogos, "e.g. Primary logo (SVG)"],
          ["Asset library", assets, setAssets, "e.g. Photo library, templates folder"],
        ] as [string, BrandLink[], (v: BrandLink[]) => void, string][]
      ).map(([label, list, setList, placeholder]) => (
        <div key={label}>
          <div className="inv-detail-label" style={{ marginTop: "1rem" }}>
            {label}
          </div>
          {list.map((item, i) => (
            <div
              key={i}
              style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}
            >
              <input
                className="inv-input"
                style={{ maxWidth: 240 }}
                placeholder={placeholder}
                aria-label={`${label} ${i + 1} label`}
                value={item.label}
                onChange={(e) => updateLink(list, setList, i, { label: e.target.value })}
              />
              <input
                className="inv-input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="https://…"
                aria-label={`${label} ${i + 1} URL`}
                value={item.url}
                onChange={(e) => updateLink(list, setList, i, { url: e.target.value })}
              />
              <button
                type="button"
                className="inv-btn inv-btn-ghost"
                onClick={() => setList(list.filter((_, j) => j !== i))}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="inv-btn inv-btn-secondary"
            onClick={() => setList([...list, { label: "", url: "" }])}
          >
            Add link
          </button>
        </div>
      ))}

      <div className="inv-detail-label" style={{ marginTop: "1rem" }}>
        Social accounts
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        {SOCIAL_KEYS.map((key) => (
          <div className="inv-field" key={key}>
            <label className="inv-label" htmlFor={`bk-social-${key}`}>
              {key === "x" ? "X (Twitter)" : key === "google" ? "Google Business" : key}
            </label>
            <input
              id={`bk-social-${key}`}
              className="inv-input"
              placeholder="@handle or URL"
              value={socials[key] ?? ""}
              onChange={(e) => setSocials({ ...socials, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div className="inv-detail-label" style={{ marginTop: "1rem" }}>
        Strategy
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div className="inv-field">
          <label className="inv-label" htmlFor="bk-keywords">
            SEO / AEO keywords (one per line)
          </label>
          <textarea
            id="bk-keywords"
            className="inv-textarea"
            rows={4}
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
        </div>
        <div className="inv-field">
          <label className="inv-label" htmlFor="bk-competitors">
            Competitors (one per line)
          </label>
          <textarea
            id="bk-competitors"
            className="inv-textarea"
            rows={4}
            value={competitors}
            onChange={(e) => setCompetitors(e.target.value)}
          />
        </div>
      </div>
      <div className="inv-field">
        <label className="inv-label" htmlFor="bk-notes">
          Internal notes
        </label>
        <textarea
          id="bk-notes"
          className="inv-textarea"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="inv-action-row" style={{ marginTop: "1rem" }}>
        <button
          type="button"
          className="inv-btn inv-btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save brand kit"}
        </button>
      </div>
    </div>
  );
}
