import Link from "next/link";
import { SocialComposer } from "@/components/portal/SocialComposer";
import { listSocialAccounts, listSocialPosts, type GhlSocialPost } from "@/lib/ghl";
import { resolveGhlAuth } from "@/lib/portal/ghlAuth";
import { listClients } from "@/lib/portal/service";

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

export default async function StaffSocialPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const selectedClientId = params.client ?? null;

  // The brand picker must never take the whole planner down with it —
  // agency posting works even if the portal database is unreachable.
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  try {
    clients = await listClients();
  } catch (error) {
    console.error("Social Planner: could not load client list", error);
  }
  const ghlClients = clients.filter((c) => c.active && c.ghl_location_id);
  const selectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId) ?? null
    : null;

  let accounts: Awaited<ReturnType<typeof listSocialAccounts>>["accounts"] = [];
  let posts: GhlSocialPost[] = [];
  let ghlError: string | null = null;
  let brandLabel = "8E Media";

  try {
    const { auth, label } = await resolveGhlAuth(selectedClientId);
    brandLabel = label;
    [{ accounts }, posts] = await Promise.all([
      listSocialAccounts(auth),
      listSocialPosts(auth),
    ]);
  } catch (error) {
    ghlError = error instanceof Error ? error.message : "Could not reach Go High Level";
    if (selectedClient) brandLabel = selectedClient.company;
  }

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Social Planner</h1>
          <p className="inv-page-subtitle">
            Compose, schedule, and publish through Go High Level — posting as{" "}
            <strong>{brandLabel}</strong>
            {selectedClientId ? "’s sub-account" : " (agency sub-account)"}.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          justifyContent: "flex-start",
          marginBottom: "1.25rem",
        }}
      >
        <span className="inv-detail-label" style={{ margin: 0 }}>
          Brand
        </span>
        <Link
          href="/invoicing/social"
          className={`inv-btn ${selectedClientId ? "inv-btn-ghost" : "inv-btn-secondary"}`}
        >
          8E Media
        </Link>
        {ghlClients.map((c) => (
          <Link
            key={c.id}
            href={`/invoicing/social?client=${c.id}`}
            className={`inv-btn ${selectedClientId === c.id ? "inv-btn-secondary" : "inv-btn-ghost"}`}
          >
            {c.company}
          </Link>
        ))}
        <span style={{ fontSize: "12.5px", color: "var(--inv-text-muted)" }}>
          Connect more clients from their client page.
        </span>
      </div>

      {ghlError ? (
        <div className="inv-alert inv-alert-error">Go High Level error: {ghlError}</div>
      ) : accounts.length === 0 ? (
        <div className="inv-empty">
          <div className="inv-empty-title">No social accounts connected yet</div>
          <p className="inv-empty-text">
            Connect them once in Go High Level: open the <strong>{brandLabel}</strong> sub-account
            → Marketing → Social Planner → Settings → connect Facebook, Instagram, LinkedIn, X,
            TikTok, and Google Business. They appear here automatically — then this page can post
            to all of them at once.
          </p>
        </div>
      ) : (
        <SocialComposer
          key={selectedClientId ?? "agency"}
          accounts={accounts}
          clientId={selectedClientId}
        />
      )}

      {posts.length > 0 ? (
        <div className="mt-6">
          <div className="inv-nav-section">Upcoming & recent posts — {brandLabel}</div>
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
