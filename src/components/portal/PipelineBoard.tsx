"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  HashtagGroupRow,
  MediaAssetRow,
  PostingSlotRow,
  SocialAccountRow,
  SocialPostRow,
  SocialPostStatus,
} from "@/lib/portal/social";

/** Hard caps per platform; posting past these fails at publish time. */
const PLATFORM_LIMITS: Record<string, number> = {
  twitter: 280,
  x: 280,
  google: 1500,
  instagram: 2200,
  tiktok: 2200,
  linkedin: 3000,
  facebook: 63206,
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Local-time value for a datetime-local input. */
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const SECTIONS: { title: string; statuses: SocialPostStatus[]; hint?: string }[] = [
  { title: "Ideas & drafts", statuses: ["idea", "draft"] },
  {
    title: "Awaiting approval",
    statuses: ["pending_approval"],
    hint: "The client sees these in their portal under Approvals.",
  },
  { title: "Approved — ready to publish", statuses: ["approved"] },
  { title: "Needs changes", statuses: ["rejected"] },
  { title: "Publishing", statuses: ["publishing"] },
  { title: "Scheduled & published", statuses: ["scheduled", "published"] },
  { title: "Failed", statuses: ["failed"] },
];

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PipelineBoard({
  clientId,
  clientCompany,
  hasGhl,
  accounts,
  posts,
  media,
  hashtagGroups,
  slots,
}: {
  clientId: string | null;
  clientCompany: string | null;
  hasGhl: boolean;
  accounts: SocialAccountRow[];
  posts: SocialPostRow[];
  media: MediaAssetRow[];
  hashtagGroups: HashtagGroupRow[];
  slots: PostingSlotRow[];
}) {
  const router = useRouter();
  const connected = accounts.filter((a) => a.status === "connected");

  const [summary, setSummary] = useState("");
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [mediaUrl, setMediaUrl] = useState("");
  const [selected, setSelected] = useState<string[]>(connected.map((a) => a.ghl_account_id));
  const [scheduleAt, setScheduleAt] = useState("");
  const [category, setCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [assetLabel, setAssetLabel] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupTags, setGroupTags] = useState("");
  const [slotWeekday, setSlotWeekday] = useState(2);
  const [slotTime, setSlotTime] = useState("09:00");
  const [slotCategory, setSlotCategory] = useState("");

  const selectedPlatforms = [
    ...new Set(
      connected
        .filter((a) => selected.includes(a.ghl_account_id))
        .map((a) => a.platform)
    ),
  ];

  const effectiveText = (platform: string) => variants[platform]?.trim() || summary;

  const overLimit = selectedPlatforms.filter((p) => {
    const limit = PLATFORM_LIMITS[p];
    return limit !== undefined && effectiveText(p).length > limit;
  });

  /**
   * Next open queue slot: the soonest active slot time in the coming
   * four weeks that no scheduled post already occupies.
   */
  function nextOpenSlot(): Date | null {
    const active = slots.filter((s) => s.active);
    if (active.length === 0) return null;
    const taken = new Set(
      posts
        .filter((p) => p.schedule_at && ["approved", "scheduled", "pending_approval", "draft"].includes(p.status))
        .map((p) => new Date(p.schedule_at!).getTime())
    );
    const now = Date.now();
    const candidates: Date[] = [];
    for (let offset = 0; offset < 28; offset++) {
      const day = new Date();
      day.setDate(day.getDate() + offset);
      for (const slot of active) {
        if (day.getDay() !== slot.weekday) continue;
        const [h, m] = slot.slot_time.split(":").map(Number);
        const when = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
        if (when.getTime() > now && !taken.has(when.getTime())) candidates.push(when);
      }
    }
    candidates.sort((a, b) => a.getTime() - b.getTime());
    return candidates[0] ?? null;
  }

  function note(msg: string) {
    setMessage(msg);
    setError("");
  }

  function fail(msg: string) {
    setError(msg);
    setMessage("");
  }

  function resetComposer() {
    setSummary("");
    setVariants({});
    setMediaUrl("");
    setScheduleAt("");
    setCategory("");
    setEditingId(null);
    setSelected(connected.map((a) => a.ghl_account_id));
  }

  function loadIntoComposer(post: SocialPostRow) {
    setEditingId(post.id);
    setSummary(post.summary);
    setVariants(post.variants ?? {});
    setMediaUrl(post.media[0]?.url ?? "");
    setSelected(post.account_ids);
    setScheduleAt(post.schedule_at ? toLocalInputValue(new Date(post.schedule_at)) : "");
    setCategory(post.category ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveComposer(thenSubmit: boolean) {
    setBusy(true);
    try {
      const cleanVariants = Object.fromEntries(
        Object.entries(variants).filter(([, text]) => text.trim().length > 0)
      );
      const payload = {
        clientId: clientId ?? undefined,
        summary,
        variants: cleanVariants,
        media: mediaUrl.trim() ? [{ url: mediaUrl.trim() }] : [],
        accountIds: selected,
        scheduleAt: scheduleAt ? new Date(scheduleAt).toISOString() : editingId ? null : undefined,
        category: category.trim() || null,
      };

      let postId = editingId;
      const response = editingId
        ? await fetch(`/api/portal/admin/social/pipeline/${editingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/portal/admin/social/pipeline", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        post?: SocialPostRow;
      } | null;
      if (!response.ok) {
        fail(data?.error ?? "Failed to save");
        return;
      }
      postId = data?.post?.id ?? postId;

      if (thenSubmit && postId) {
        const submitResponse = await fetch(`/api/portal/admin/social/pipeline/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit" }),
        });
        if (!submitResponse.ok) {
          const submitData = (await submitResponse.json().catch(() => null)) as {
            error?: string;
          } | null;
          fail(submitData?.error ?? "Saved, but submitting for approval failed");
          return;
        }
        note(
          clientId
            ? `Sent to ${clientCompany ?? "the client"} for approval.`
            : "Saved and marked ready for approval."
        );
      } else {
        note(editingId ? "Post updated." : "Draft saved to the pipeline.");
      }
      resetComposer();
      router.refresh();
    } catch {
      fail("Failed to save — try again");
    } finally {
      setBusy(false);
    }
  }

  async function postAction(id: string, action: "submit" | "approve" | "cancel" | "push") {
    setBusy(true);
    try {
      const response = await fetch(`/api/portal/admin/social/pipeline/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        fail(data?.error ?? "Action failed");
        return;
      }
      note(
        action === "push"
          ? "Handed to Go High Level."
          : action === "approve"
            ? "Approved."
            : action === "submit"
              ? "Sent for approval."
              : "Canceled."
      );
      router.refresh();
    } catch {
      fail("Action failed — try again");
    } finally {
      setBusy(false);
    }
  }

  async function syncAccounts() {
    setBusy(true);
    try {
      const response = await fetch("/api/portal/admin/social/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: clientId ?? undefined }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        fail(data?.error ?? "Sync failed");
        return;
      }
      note("Accounts synced from Go High Level.");
      router.refresh();
    } catch {
      fail("Sync failed — try again");
    } finally {
      setBusy(false);
    }
  }

  async function addToLibrary(kind: "media" | "hashtags") {
    setBusy(true);
    try {
      const body =
        kind === "media"
          ? { clientId: clientId ?? undefined, kind, label: assetLabel, url: assetUrl }
          : {
              clientId: clientId ?? undefined,
              kind,
              name: groupName,
              hashtags: groupTags.split(/[\s,]+/).filter(Boolean),
            };
      const response = await fetch("/api/portal/admin/social/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        fail(data?.error ?? "Failed to save");
        return;
      }
      note(kind === "media" ? "Asset added to the library." : "Hashtag group saved.");
      if (kind === "media") {
        setAssetLabel("");
        setAssetUrl("");
      } else {
        setGroupName("");
        setGroupTags("");
      }
      router.refresh();
    } catch {
      fail("Failed to save — try again");
    } finally {
      setBusy(false);
    }
  }

  async function addSlot() {
    setBusy(true);
    try {
      const response = await fetch("/api/portal/admin/social/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId ?? undefined,
          weekday: slotWeekday,
          slotTime: slotTime,
          category: slotCategory.trim() || undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        fail(data?.error ?? "Failed to add the slot");
        return;
      }
      note("Queue slot added.");
      setSlotCategory("");
      router.refresh();
    } catch {
      fail("Failed to add the slot — try again");
    } finally {
      setBusy(false);
    }
  }

  async function removeSlot(id: string) {
    setBusy(true);
    try {
      const response = await fetch(`/api/portal/admin/social/slots?id=${id}`, { method: "DELETE" });
      if (!response.ok) {
        fail("Failed to remove the slot");
        return;
      }
      note("Queue slot removed.");
      router.refresh();
    } catch {
      fail("Failed to remove the slot — try again");
    } finally {
      setBusy(false);
    }
  }

  const accountName = (id: string) => {
    const account = accounts.find((a) => a.ghl_account_id === id);
    return account ? `${account.platform}: ${account.name ?? ""}` : "unknown account";
  };

  const canSave = summary.trim().length > 0;

  return (
    <div>
      {message ? <div className="inv-alert inv-alert-success">{message}</div> : null}
      {error ? <div className="inv-alert inv-alert-error">{error}</div> : null}

      {!hasGhl ? (
        <div className="inv-alert inv-alert-error">
          {clientCompany} has no Go High Level connection yet — drafts and approvals work, but
          publishing needs the location ID and token on the client page.
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.6fr) minmax(240px, 1fr)", gap: "1.25rem", alignItems: "start" }}>
        {/* Composer */}
        <div className="inv-card">
          <div className="inv-detail-label">
            {editingId ? "Edit post" : "New post"}
          </div>

          <div className="inv-field">
            <label className="inv-label" htmlFor="pb-summary">Post text</label>
            <textarea
              id="pb-summary"
              className="inv-textarea"
              rows={5}
              placeholder="What are we posting?"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>

          {hashtagGroups.length > 0 ? (
            <div className="inv-field">
              <span className="inv-label">Add hashtags</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.3rem" }}>
                {hashtagGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className="inv-btn inv-btn-ghost"
                    onClick={() =>
                      setSummary((s) => `${s.trimEnd()}\n\n${g.hashtags.join(" ")}`.trim())
                    }
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="inv-field">
            <label className="inv-label" htmlFor="pb-media">Image / video URL (public link)</label>
            <input
              id="pb-media"
              className="inv-input"
              placeholder="https://…"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
            />
          </div>

          <div className="inv-field">
            <span className="inv-label">Post to</span>
            {connected.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--inv-text-muted)", margin: "0.3rem 0 0" }}>
                No accounts in the registry yet.{" "}
                <button type="button" className="inv-btn inv-btn-ghost" onClick={syncAccounts} disabled={busy}>
                  Sync from Go High Level
                </button>
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.375rem" }}>
                {connected.map((a) => (
                  <label
                    key={a.ghl_account_id}
                    className="inv-btn inv-btn-ghost"
                    style={{
                      cursor: "pointer",
                      opacity: selected.includes(a.ghl_account_id) ? 1 : 0.45,
                      border: selected.includes(a.ghl_account_id)
                        ? "1px solid currentColor"
                        : undefined,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(a.ghl_account_id)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(a.ghl_account_id)
                            ? prev.filter((x) => x !== a.ghl_account_id)
                            : [...prev, a.ghl_account_id]
                        )
                      }
                      style={{ display: "none" }}
                    />
                    {a.platform}: {a.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedPlatforms.length > 0 && summary.trim() ? (
            <div className="inv-field">
              <span className="inv-label">Fit check</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.3rem" }}>
                {selectedPlatforms.map((p) => {
                  const limit = PLATFORM_LIMITS[p];
                  const length = effectiveText(p).length;
                  const over = limit !== undefined && length > limit;
                  return (
                    <span
                      key={p}
                      className={`inv-badge ${over ? "inv-badge-overdue" : "inv-badge-open"}`}
                      title={over ? `Over ${p}'s limit — this will fail to publish` : undefined}
                    >
                      {p} {length}
                      {limit !== undefined ? `/${limit}` : ""}
                      {variants[p]?.trim() ? " · custom" : ""}
                    </span>
                  );
                })}
              </div>
            </div>
          ) : null}

          {selectedPlatforms.length > 1 ? (
            <div className="inv-field">
              <span className="inv-label">Tailor per platform (optional — blank means the main text)</span>
              <div style={{ display: "grid", gap: "0.5rem", marginTop: "0.3rem" }}>
                {selectedPlatforms.map((p) => (
                  <details key={p}>
                    <summary style={{ fontSize: "13px", cursor: "pointer", color: "var(--inv-text-secondary)" }}>
                      {p}
                      {variants[p]?.trim() ? " — customized" : ""}
                    </summary>
                    <textarea
                      className="inv-textarea"
                      rows={3}
                      placeholder={`Version for ${p} (shorter for X, CTA for Google, hashtags for Instagram…)`}
                      value={variants[p] ?? ""}
                      onChange={(e) =>
                        setVariants((v) => ({ ...v, [p]: e.target.value }))
                      }
                      style={{ marginTop: "6px" }}
                    />
                  </details>
                ))}
              </div>
            </div>
          ) : null}

          <div className="inv-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div className="inv-field">
              <label className="inv-label" htmlFor="pb-schedule">Schedule for (optional)</label>
              <input
                id="pb-schedule"
                type="datetime-local"
                className="inv-input"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
              {slots.some((s) => s.active) ? (
                <button
                  type="button"
                  className="inv-btn inv-btn-ghost"
                  style={{ marginTop: "6px" }}
                  onClick={() => {
                    const slot = nextOpenSlot();
                    if (slot) {
                      setScheduleAt(toLocalInputValue(slot));
                      note(`Queued for ${slot.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.`);
                    } else {
                      fail("No open queue slot in the next four weeks — add slots on the right.");
                    }
                  }}
                >
                  Next open queue slot
                </button>
              ) : null}
            </div>
            <div className="inv-field">
              <label className="inv-label" htmlFor="pb-category">Category (optional)</label>
              <input
                id="pb-category"
                className="inv-input"
                placeholder="Educational, Promo, …"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="inv-action-row" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="inv-btn inv-btn-secondary"
              disabled={busy || !canSave}
              onClick={() => saveComposer(false)}
            >
              {editingId ? "Save changes" : "Save draft"}
            </button>
            <button
              type="button"
              className="inv-btn inv-btn-primary"
              disabled={busy || !canSave || overLimit.length > 0}
              title={overLimit.length ? `Over the limit for: ${overLimit.join(", ")}` : undefined}
              onClick={() => saveComposer(true)}
            >
              {clientId ? "Send for client approval" : "Mark ready"}
            </button>
            {editingId ? (
              <button type="button" className="inv-btn inv-btn-ghost" onClick={resetComposer}>
                Discard edit
              </button>
            ) : null}
          </div>
        </div>

        {/* Library */}
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <div className="inv-card">
            <div className="inv-detail-label">Media library</div>
            {media.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--inv-text-muted)" }}>
                Reusable images and videos for this brand.
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.4rem" }}>
                {media.slice(0, 8).map((m) => (
                  <li key={m.id} style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center", fontSize: "13px" }}>
                    {m.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt=""
                        width={32}
                        height={32}
                        loading="lazy"
                        style={{ width: 32, height: 32, objectFit: "cover", borderRadius: 4, border: "1px solid var(--inv-border)", flexShrink: 0 }}
                      />
                    ) : (
                      <span className="inv-badge inv-badge-open" style={{ flexShrink: 0 }}>{m.type}</span>
                    )}
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.label}</span>
                    <button type="button" className="inv-btn inv-btn-ghost" onClick={() => setMediaUrl(m.url)}>
                      Use
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="inv-field" style={{ marginTop: "0.75rem" }}>
              <input className="inv-input" placeholder="Label" value={assetLabel} onChange={(e) => setAssetLabel(e.target.value)} />
            </div>
            <div className="inv-field">
              <input className="inv-input" placeholder="https://…" value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} />
            </div>
            <button
              type="button"
              className="inv-btn inv-btn-secondary"
              disabled={busy || !assetLabel.trim() || !assetUrl.trim()}
              onClick={() => addToLibrary("media")}
            >
              Add asset
            </button>
          </div>

          <div className="inv-card">
            <div className="inv-detail-label">Hashtag groups</div>
            <div className="inv-field">
              <input className="inv-input" placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div className="inv-field">
              <input className="inv-input" placeholder="#augusta #wellness …" value={groupTags} onChange={(e) => setGroupTags(e.target.value)} />
            </div>
            <button
              type="button"
              className="inv-btn inv-btn-secondary"
              disabled={busy || !groupName.trim() || !groupTags.trim()}
              onClick={() => addToLibrary("hashtags")}
            >
              Save group
            </button>
          </div>

          <div className="inv-card">
            <div className="inv-detail-label">Posting queue</div>
            <p style={{ fontSize: "12.5px", color: "var(--inv-text-muted)", marginTop: 0 }}>
              Standing publish times for this brand. The composer&apos;s &quot;Next open queue
              slot&quot; button fills from these.
            </p>
            {slots.length > 0 ? (
              <ul style={{ listStyle: "none", margin: "0 0 0.75rem", padding: 0, display: "grid", gap: "0.35rem" }}>
                {slots.map((s) => (
                  <li key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", fontSize: "13px" }}>
                    <span>
                      {WEEKDAYS[s.weekday]} {s.slot_time.slice(0, 5)}
                      {s.category ? ` · ${s.category}` : ""}
                    </span>
                    <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={() => removeSlot(s.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="inv-form-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="inv-field">
                <select
                  className="inv-input"
                  value={slotWeekday}
                  onChange={(e) => setSlotWeekday(Number(e.target.value))}
                  aria-label="Weekday"
                >
                  {WEEKDAYS.map((d, i) => (
                    <option key={d} value={i}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="inv-field">
                <input
                  type="time"
                  className="inv-input"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  aria-label="Time"
                />
              </div>
            </div>
            <div className="inv-field">
              <input
                className="inv-input"
                placeholder="Category (optional)"
                value={slotCategory}
                onChange={(e) => setSlotCategory(e.target.value)}
              />
            </div>
            <button type="button" className="inv-btn inv-btn-secondary" disabled={busy} onClick={addSlot}>
              Add slot
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline sections */}
      {SECTIONS.map((section) => {
        const rows = posts.filter((p) => section.statuses.includes(p.status));
        if (rows.length === 0) return null;
        return (
          <div key={section.title} className="mt-6">
            <div className="inv-nav-section">
              {section.title} ({rows.length})
            </div>
            {section.hint ? (
              <p style={{ fontSize: "12.5px", color: "var(--inv-text-muted)", margin: "0 0 0.5rem" }}>
                {section.hint}
              </p>
            ) : null}
            <div style={{ display: "grid", gap: "0.6rem" }}>
              {rows.map((post) => (
                <div key={post.id} className="inv-card" style={{ padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: "1 1 320px" }}>
                      <div style={{ whiteSpace: "pre-wrap", fontSize: "13.5px" }}>
                        {post.summary.slice(0, 240)}
                        {post.summary.length > 240 ? "…" : ""}
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--inv-text-muted)", marginTop: "6px" }}>
                        {post.account_ids.map(accountName).join(" · ") || "no accounts selected"}
                        {post.schedule_at ? ` · scheduled ${formatDateTime(post.schedule_at)}` : ""}
                        {post.category ? ` · ${post.category}` : ""}
                        {post.approved_by && post.status === "approved"
                          ? ` · approved by ${post.approved_by}`
                          : ""}
                      </div>
                      {post.growth_campaign_id ? (
                        <Link
                          href={`/invoicing/growth/campaigns/${post.growth_campaign_id}`}
                          className="inv-link"
                          style={{ display: "inline-block", fontSize: "11px", marginTop: "6px" }}
                        >
                          View originating campaign →
                        </Link>
                      ) : null}
                      {post.creative_project_id ? (
                        <Link
                          href={`/invoicing/production/${post.creative_project_id}`}
                          className="inv-link"
                          style={{ display: "inline-block", fontSize: "11px", marginTop: "6px", marginLeft: "10px" }}
                        >
                          View production package →
                        </Link>
                      ) : null}
                      {post.status === "rejected" && post.approval_note ? (
                        <div className="inv-alert inv-alert-error" style={{ marginTop: "8px", marginBottom: 0 }}>
                          {post.approved_by}: {post.approval_note}
                        </div>
                      ) : null}
                      {post.status === "failed" && post.error ? (
                        <div className="inv-alert inv-alert-error" style={{ marginTop: "8px", marginBottom: 0 }}>
                          {post.error}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "flex-start" }}>
                      {(post.status === "idea" || post.status === "draft" || post.status === "rejected") ? (
                        <>
                          <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={() => loadIntoComposer(post)}>
                            Edit
                          </button>
                          <button type="button" className="inv-btn inv-btn-secondary" disabled={busy} onClick={() => postAction(post.id, "submit")}>
                            {clientId ? "Send for approval" : "Mark ready"}
                          </button>
                        </>
                      ) : null}
                      {!clientId && (post.status === "pending_approval" || post.status === "draft" || post.status === "idea") ? (
                        <button type="button" className="inv-btn inv-btn-secondary" disabled={busy} onClick={() => postAction(post.id, "approve")}>
                          Approve (staff)
                        </button>
                      ) : null}
                      {post.status === "approved" || post.status === "failed" ? (
                        <button
                          type="button"
                          className="inv-btn inv-btn-primary"
                          disabled={busy || !hasGhl}
                          onClick={() => {
                            const label = post.schedule_at
                              ? `Schedule in Go High Level for ${formatDateTime(post.schedule_at)}?`
                              : "Publish now to the selected accounts?";
                            if (window.confirm(label)) void postAction(post.id, "push");
                          }}
                        >
                          {post.status === "failed" ? "Retry" : post.schedule_at ? "Schedule" : "Publish now"}
                        </button>
                      ) : null}
                      {!["publishing", "published", "canceled"].includes(post.status) ? (
                        <button type="button" className="inv-btn inv-btn-ghost" disabled={busy} onClick={() => postAction(post.id, "cancel")}>
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {posts.length === 0 ? (
        <div className="inv-empty mt-6">
          <div className="inv-empty-title">Nothing in the pipeline yet</div>
          <p className="inv-empty-text">
            Draft the first post above. It flows draft → approval → approved → published, and
            nothing reaches a social account until it&apos;s approved and pushed.
          </p>
        </div>
      ) : null}
    </div>
  );
}
