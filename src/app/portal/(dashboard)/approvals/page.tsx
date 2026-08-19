import { redirect } from "next/navigation";
import { ApprovalActions } from "@/components/portal/ApprovalActions";
import { getPortalClientId } from "@/lib/portal/auth";
import { listAccountRegistry, listPipelinePosts } from "@/lib/portal/social";

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function ApprovalsPage() {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const [pending, decided, accounts] = await Promise.all([
    listPipelinePosts(clientId, ["pending_approval"]),
    listPipelinePosts(clientId, ["approved", "rejected", "scheduled", "published"]),
    listAccountRegistry(clientId),
  ]);

  const platformsFor = (ids: string[]) =>
    ids
      .map((id) => accounts.find((a) => a.ghl_account_id === id)?.platform)
      .filter((p): p is string => Boolean(p))
      .join(", ");

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Approvals</h1>
          <p className="inv-page-subtitle">
            Nothing publishes to your social accounts until you approve it here.
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="inv-card" style={{ marginBottom: 24 }}>
          <div className="inv-empty">
            <p className="inv-empty-title">Nothing waiting on you.</p>
            <p className="inv-empty-text">
              When our team drafts a post for your brand, it appears here first.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4" style={{ marginBottom: 24 }}>
          {pending.map((post) => (
            <div key={post.id} className="inv-card">
              <div className="inv-detail-section">
                <p className="whitespace-pre-wrap text-sm">{post.summary}</p>
                {post.media.length > 0 ? (
                  <p className="mt-2 text-xs" style={{ color: "var(--inv-text-muted)" }}>
                    Media:{" "}
                    {post.media.map((m, i) => (
                      <a
                        key={i}
                        href={m.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inv-link"
                        style={{ marginRight: 8 }}
                      >
                        {m.label ?? `attachment ${i + 1}`}
                      </a>
                    ))}
                  </p>
                ) : null}
                <p className="mt-2 text-xs" style={{ color: "var(--inv-text-muted)" }}>
                  {platformsFor(post.account_ids) || "Platforms set at publish time"}
                  {post.schedule_at
                    ? ` · will go out ${formatDateTime(post.schedule_at)}`
                    : " · publishes once approved"}
                </p>
                <div className="mt-4">
                  <ApprovalActions postId={post.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 ? (
        <div className="inv-card">
          <div className="inv-detail-section">
            <div className="inv-detail-label">Recently decided</div>
            <div className="divide-y divide-[#e4e4e7]">
              {decided.slice(0, 10).map((post) => (
                <div key={post.id} className="flex items-start justify-between gap-4 py-3">
                  <p className="min-w-0 text-sm" style={{ color: "var(--inv-text-secondary)" }}>
                    {post.summary.slice(0, 120)}
                    {post.summary.length > 120 ? "…" : ""}
                  </p>
                  <span
                    className={`inv-badge shrink-0 ${
                      post.status === "rejected"
                        ? "inv-badge-overdue"
                        : post.status === "published"
                          ? "inv-badge-paid"
                          : "inv-badge-open"
                    }`}
                  >
                    {post.status === "rejected"
                      ? "changes requested"
                      : post.status === "scheduled"
                        ? `scheduled ${formatDateTime(post.schedule_at)}`
                        : post.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
