import Link from "next/link";
import { redirect } from "next/navigation";
import { getPortalClientId } from "@/lib/portal/auth";
import { listAccountRegistry, listPipelinePosts } from "@/lib/portal/social";

/**
 * Read-only content feed: what is queued to publish and what already went
 * out. Approvals live on their own page; nothing here can trigger a
 * publish — the client side only reads the pipeline.
 */

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function PortalSocialPage() {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const [upcoming, published, accounts] = await Promise.all([
    listPipelinePosts(clientId, ["approved", "scheduled"]),
    listPipelinePosts(clientId, ["published"]),
    listAccountRegistry(clientId),
  ]);

  const platformsFor = (ids: string[]) =>
    ids
      .map((id) => accounts.find((a) => a.ghl_account_id === id)?.platform)
      .filter((p): p is string => Boolean(p))
      .join(" · ");

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Your content</h1>
          <p className="inv-page-subtitle">
            What&apos;s queued for your social accounts and what has already published.
          </p>
        </div>
        <Link href="/portal/approvals" className="inv-btn inv-btn-secondary">
          Approvals
        </Link>
      </div>

      <div className="inv-card" style={{ marginBottom: 24 }}>
        <div className="inv-detail-section">
          <div className="inv-detail-label">Upcoming</div>
          {upcoming.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--inv-text-secondary)" }}>
              Nothing scheduled right now. Approved posts appear here with their publish time.
            </p>
          ) : (
            <div className="divide-y divide-[#e4e4e7]">
              {upcoming.map((post) => (
                <div key={post.id} className="py-3">
                  <p className="whitespace-pre-wrap text-sm">{post.summary}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--inv-text-muted)" }}>
                    {platformsFor(post.account_ids) || "Platforms set at publish time"}
                    {post.schedule_at
                      ? ` · goes out ${formatDateTime(post.schedule_at)}`
                      : " · publishing soon"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="inv-card">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Published</div>
          {published.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--inv-text-secondary)" }}>
              Published posts will appear here.
            </p>
          ) : (
            <div className="divide-y divide-[#e4e4e7]">
              {published.slice(0, 20).map((post) => (
                <div key={post.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="whitespace-pre-wrap text-sm">{post.summary}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--inv-text-muted)" }}>
                      {platformsFor(post.account_ids)}
                    </p>
                  </div>
                  <span className="inv-badge inv-badge-paid shrink-0">published</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
