import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/portal/StatusBadge";
import { getPortalClientId } from "@/lib/portal/auth";
import { listRequestsForClient } from "@/lib/portal/service";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function PortalHomePage() {
  const clientId = await getPortalClientId();
  if (!clientId) redirect("/portal/login");

  const requests = await listRequestsForClient(clientId);
  const active = requests.filter((r) => r.status !== "closed");
  const closed = requests.filter((r) => r.status === "closed");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow eyebrow-on-light mb-2">Requests</p>
          <h1 className="font-display text-3xl text-navy">Your work queue</h1>
        </div>
        <Button href="/portal/requests/new" tone="light" pill>
          New Request
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="border-hairline bg-paper p-10 text-center">
          <p className="font-display text-xl text-navy">No requests yet.</p>
          <p className="mt-2 text-sm text-ink/60">
            Submit your first request and our team will take it from there.
          </p>
          <div className="mt-6">
            <Button href="/portal/requests/new" tone="light" pill>
              Submit a request
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          <section className="space-y-3">
            {active.length === 0 ? (
              <p className="text-sm text-ink/55">Nothing in progress right now.</p>
            ) : (
              active.map((r) => (
                <Link
                  key={r.id}
                  href={`/portal/requests/${r.id}`}
                  className="border-hairline block bg-paper p-5 transition-colors hover:border-navy/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-navy">{r.title}</p>
                      <p className="mt-1 text-xs text-ink/55">
                        {r.service_type} · Submitted {formatDate(r.created_at)}
                        {r.priority === "rush" ? " · Rush" : ""}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                </Link>
              ))
            )}
          </section>

          {closed.length > 0 ? (
            <section>
              <p className="eyebrow eyebrow-on-light mb-3">Closed</p>
              <div className="space-y-3">
                {closed.map((r) => (
                  <Link
                    key={r.id}
                    href={`/portal/requests/${r.id}`}
                    className="border-hairline block bg-paper/60 p-5 opacity-70 transition-opacity hover:opacity-100"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="truncate font-semibold text-navy">{r.title}</p>
                      <StatusBadge status={r.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
