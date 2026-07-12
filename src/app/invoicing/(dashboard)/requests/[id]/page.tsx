import Link from "next/link";
import { notFound } from "next/navigation";
import { StaffRequestControls } from "@/components/portal/StaffRequestControls";
import {
  getClientById,
  getRequest,
  listFiles,
  listUpdates,
  statusLabel,
} from "@/lib/portal/service";

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
  client: "Client",
  staff: "Staff",
  system: "System",
} as const;

export default async function StaffRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = await getRequest(id);
  if (!request) notFound();

  const [client, updates, files] = await Promise.all([
    getClientById(request.client_id),
    listUpdates(id),
    listFiles(id),
  ]);

  return (
    <div>
      <Link href="/invoicing/requests" className="inv-link">
        ← All requests
      </Link>

      <div className="inv-page-header mt-3">
        <div>
          <h1 className="inv-page-title">{request.title}</h1>
          <p className="inv-page-subtitle">
            {client ? `${client.company} · ${client.contact_name} · ${client.email}` : "—"}
          </p>
        </div>
        <span className="inv-badge inv-badge-open">{statusLabel(request.status)}</span>
      </div>

      <div className="inv-detail-grid">
        <div>
          <div className="inv-card">
            <div className="inv-detail-label">Brief</div>
            <p style={{ whiteSpace: "pre-wrap" }}>{request.brief}</p>
            <div className="inv-detail-label" style={{ marginTop: "1rem" }}>
              Details
            </div>
            <p>
              {request.service_type} · {request.priority === "rush" ? "Rush" : "Standard"}
              {request.due_date ? ` · Needed by ${request.due_date}` : ""} · Submitted{" "}
              {formatDateTime(request.created_at)}
            </p>
          </div>

          {files.length > 0 ? (
            <div className="inv-card mt-4">
              <div className="inv-detail-label">Deliverables</div>
              <ul>
                {files.map((f) => (
                  <li key={f.id} style={{ marginBottom: "0.375rem" }}>
                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="inv-link">
                      {f.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="inv-card mt-4">
            <div className="inv-detail-label">Activity</div>
            <ol>
              {updates.map((u) => (
                <li key={u.id} style={{ marginBottom: "0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
                    {AUTHOR_LABELS[u.author]} · {formatDateTime(u.created_at)}
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }}>{u.body}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="inv-card">
          <StaffRequestControls requestId={request.id} status={request.status} />
        </div>
      </div>
    </div>
  );
}
