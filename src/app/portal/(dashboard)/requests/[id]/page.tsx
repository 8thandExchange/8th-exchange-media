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
    <div className="mx-auto max-w-3xl">
      <Link href="/portal" className="nav-link">
        ← Back to requests
      </Link>

      <div className="mb-8 mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow eyebrow-on-light mb-2">{request.service_type}</p>
          <h1 className="font-display text-3xl text-navy">{request.title}</h1>
          <p className="mt-2 text-xs text-ink/55">
            Submitted {formatDateTime(request.created_at)}
            {request.priority === "rush" ? " · Rush" : ""}
            {request.due_date ? ` · Needed by ${request.due_date}` : ""}
          </p>
        </div>
        <StatusBadge status={request.status} />
      </div>

      <section className="border-hairline bg-paper p-6">
        <p className="eyebrow eyebrow-on-light mb-3">The brief</p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{request.brief}</p>
      </section>

      {files.length > 0 ? (
        <section className="border-hairline mt-6 bg-paper p-6">
          <p className="eyebrow eyebrow-on-light mb-4">Deliverables</p>
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-link normal-case tracking-normal"
                >
                  {f.label} ↗
                </a>
                <span className="ml-2 text-xs text-ink/45">{formatDateTime(f.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <p className="eyebrow eyebrow-on-light mb-4">Activity</p>
        <ol className="space-y-4">
          {updates.map((u) => (
            <li
              key={u.id}
              className={`border-hairline p-4 ${
                u.author === "client"
                  ? "bg-navy/[0.04]"
                  : u.author === "staff"
                    ? "bg-paper"
                    : "bg-transparent"
              }`}
            >
              <p className="mb-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink/50">
                {AUTHOR_LABELS[u.author]} · {formatDateTime(u.created_at)}
              </p>
              <p className="whitespace-pre-wrap text-sm text-ink/80">{u.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6">
          <CommentForm
            endpoint={`/api/portal/requests/${id}/comments`}
            placeholder="Reply, add context, or share more links…"
          />
        </div>
      </section>
    </div>
  );
}
