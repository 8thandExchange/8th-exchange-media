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
    <div className="mx-auto max-w-3xl">
      <div className="mb-10">
        <p className="eyebrow eyebrow-on-light mb-2">Approvals</p>
        <h1 className="font-display text-3xl text-navy">Posts awaiting your OK</h1>
        <p className="mt-2 text-sm text-ink/60">
          Nothing publishes to your social accounts until you approve it here.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="border-hairline bg-paper p-10 text-center">
          <p className="font-display text-xl text-navy">Nothing waiting on you.</p>
          <p className="mt-2 text-sm text-ink/60">
            When our team drafts a post for your brand, it appears here first.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((post) => (
            <div key={post.id} className="border-hairline bg-paper p-5">
              <p className="whitespace-pre-wrap text-sm text-ink">{post.summary}</p>
              {post.media.length > 0 ? (
                <p className="mt-2 text-xs text-ink/55">
                  Media:{" "}
                  {post.media.map((m, i) => (
                    <a
                      key={i}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-navy underline underline-offset-2"
                    >
                      {m.label ?? `attachment ${i + 1}`}
                    </a>
                  ))}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-ink/55">
                {platformsFor(post.account_ids) || "Platforms set at publish time"}
                {post.schedule_at ? ` · will go out ${formatDateTime(post.schedule_at)}` : " · publishes once approved"}
              </p>
              <div className="mt-4">
                <ApprovalActions postId={post.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 ? (
        <div className="mt-12">
          <h2 className="font-display text-xl text-navy">Recently decided</h2>
          <ul className="mt-3 space-y-2">
            {decided.slice(0, 10).map((post) => (
              <li key={post.id} className="border-hairline bg-paper p-4 text-sm">
                <span className="text-ink/70">
                  {post.summary.slice(0, 120)}
                  {post.summary.length > 120 ? "…" : ""}
                </span>
                <span className="mt-1 block text-xs text-ink/50">
                  {post.status === "rejected"
                    ? "Changes requested"
                    : post.status === "published"
                      ? "Published"
                      : post.status === "scheduled"
                        ? `Scheduled for ${formatDateTime(post.schedule_at)}`
                        : "Approved — publishing soon"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
