"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type {
  HashtagGroupRow,
  MediaAssetRow,
  SocialAccountRow,
  SocialPostRow,
  SocialPostStatus,
} from "@/lib/portal/social";

const SECTIONS: { title: string; statuses: SocialPostStatus[]; hint?: string }[] = [
  { title: "Ideas & drafts", statuses: ["idea", "draft"] },
  {
    title: "Awaiting approval",
    statuses: ["pending_approval"],
    hint: "The client sees these in their portal under Approvals.",
  },
  { title: "Approved — ready to publish", statuses: ["approved"] },
  { title: "Needs changes", statuses: ["rejected"] },
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
}: {
  clientId: string | null;
  clientCompany: string | null;
  hasGhl: boolean;
  accounts: SocialAccountRow[];
  posts: SocialPostRow[];
  media: MediaAssetRow[];
  hashtagGroups: HashtagGroupRow[];
}) {
  const router = useRouter();
  const connected = accounts.filter((a) => a.status === "connected");

  const [summary, setSummary] = useState("");
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
    setMediaUrl("");
    setScheduleAt("");
    setCategory("");
    setEditingId(null);
    setSelected(connected.map((a) => a.ghl_account_id));
  }

  function loadIntoComposer(post: SocialPostRow) {
    setEditingId(post.id);
    setSummary(post.summary);
    setMediaUrl(post.media[0]?.url ?? "");
    setSelected(post.account_ids);
    setScheduleAt(post.schedule_at ? post.schedule_at.slice(0, 16) : "");
    setCategory(post.category ?? "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveComposer(thenSubmit: boolean) {
    setBusy(true);
    try {
      const payload = {
        clientId: clientId ?? undefined,
        summary,
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
              disabled={busy || !canSave}
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
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.label}</span>
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
                      {(post.status === "pending_approval" || post.status === "draft" || post.status === "idea") ? (
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
                      {post.status !== "published" && post.status !== "canceled" ? (
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
