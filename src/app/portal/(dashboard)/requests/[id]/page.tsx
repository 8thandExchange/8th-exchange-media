import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { CommentForm } from "@/components/portal/CommentForm";
import { getPortalClientId } from "@/lib/portal/auth";
import { getRequest, listFiles, listUpdates } from "@/lib/portal/service";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const AUTHOR_LABELS = {
  client: "You",
  staff: "8th & Exchange",
  system: "System",
} as const;

export default async function PortalRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const { id } = await params;
  const request = await getRequest(id);
  if (!request || request.client_id !== clientId) notFound();

  const [updates, files] = await Promise.all([listUpdates(id), listFiles(id)]);

  return (
    <div style={{ maxWidth: 760 }}>
      <Link href="/portal/requests" className="inv-link text-sm">
        ← Back to requests
      </Link>

      <div className="inv-page-header" style={{ marginTop: 12 }}>
        <div className="min-w-0">
          <h1 className="inv-page-title">{request.title}</h1>
          <p className="inv-page-subtitle">
            {request.service_type} · Submitted {formatDateTime(request.created_at)}
            {request.priority === "rush" ? " · Rush" : ""}
            {request.due_date ? ` · Needed by ${request.due_date}` : ""}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="inv-card" style={{ marginBottom: 24 }}>
        <div className="inv-detail-section">
          <div className="inv-detail-label">The brief</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{request.brief}</p>
        </div>
      </div>

      {files.length > 0 ? (
        <div className="inv-card" style={{ marginBottom: 24 }}>
          <div className="inv-detail-section">
            <div className="inv-detail-label">Deliverables</div>
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id}>
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inv-link text-sm"
                  >
                    {f.label} ↗
                  </a>
                  <span className="ml-2 text-xs" style={{ color: "var(--inv-text-muted)" }}>
                    {formatDateTime(f.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <div className="inv-card">
        <div className="inv-detail-section">
          <div className="inv-detail-label">Activity</div>
          <div className="divide-y divide-[#e4e4e7]">
            {updates.map((u) => (
              <div key={u.id} className="py-3">
                <p className="mb-1 text-xs font-medium" style={{ color: "var(--inv-text-muted)" }}>
                  {AUTHOR_LABELS[u.author]} · {formatDateTime(u.created_at)}
                </p>
                <p className="whitespace-pre-wrap text-sm">{u.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <CommentForm
              endpoint={`/api/portal/requests/${id}/comments`}
              placeholder="Reply, add context, or share more links…"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
