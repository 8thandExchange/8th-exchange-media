import { SocialComposer } from "@/components/portal/SocialComposer";
import { listSocialAccounts, listSocialPosts, type GhlSocialPost } from "@/lib/ghl";

export const dynamic = "force-dynamic";

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function StaffSocialPage() {
  let accounts: Awaited<ReturnType<typeof listSocialAccounts>>["accounts"] = [];
  let posts: GhlSocialPost[] = [];
  let ghlError: string | null = null;

  try {
    [{ accounts }, posts] = await Promise.all([listSocialAccounts(), listSocialPosts()]);
  } catch (error) {
    ghlError = error instanceof Error ? error.message : "Could not reach Go High Level";
  }

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Social Planner</h1>
          <p className="inv-page-subtitle">
            Compose, schedule, and publish to every connected account — powered by Go High Level
            (8E Media sub-account).
          </p>
        </div>
      </div>

      {ghlError ? (
        <div className="inv-alert inv-alert-error">
          Go High Level error: {ghlError}. Check GHL_API_TOKEN / GHL_LOCATION_ID.
        </div>
      ) : accounts.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-title">No social accounts connected yet</div>
          <p className="inv-empty-text">
            Connect them once in Go High Level: open the <strong>8E Media</strong> sub-account →
            Marketing → Social Planner → Settings → connect Facebook, Instagram, LinkedIn, X,
            TikTok, and Google Business. They appear here automatically — then this page can post
            to all of them at once.
          </p>
        </div>
      ) : (
        <SocialComposer accounts={accounts} />
      )}

      {posts.length > 0 ? (
        <div className="mt-6">
          <div className="inv-nav-section">Upcoming & recent posts</div>
          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Status</th>
                  <th>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p._id ?? p.id ?? p.createdAt}>
                    <td style={{ maxWidth: 420 }}>
                      {(p.summary ?? "").slice(0, 140) || "(no text)"}
                      {(p.summary ?? "").length > 140 ? "…" : ""}
                    </td>
                    <td>
                      <span className="inv-badge inv-badge-open">{p.status ?? "—"}</span>
                    </td>
                    <td>{formatDateTime(p.scheduleDate ?? p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
