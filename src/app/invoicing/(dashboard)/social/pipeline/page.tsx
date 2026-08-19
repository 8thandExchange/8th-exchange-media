import Link from "next/link";
import { PipelineBoard } from "@/components/portal/PipelineBoard";
import { listClients } from "@/lib/portal/service";
import {
  listAccountRegistry,
  listHashtagGroups,
  listMediaAssets,
  listPipelinePosts,
} from "@/lib/portal/social";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const params = await searchParams;
  const selectedClientId = params.client ?? null;

  let clients: Awaited<ReturnType<typeof listClients>> = [];
  try {
    clients = await listClients();
  } catch (error) {
    console.error("Pipeline: could not load client list", error);
  }
  const activeClients = clients.filter((c) => c.active);
  const selectedClient = selectedClientId
    ? clients.find((c) => c.id === selectedClientId) ?? null
    : null;
  const brandLabel = selectedClient?.company ?? "8E Media";

  const [posts, accounts, media, hashtagGroups] = await Promise.all([
    listPipelinePosts(selectedClientId),
    listAccountRegistry(selectedClientId),
    listMediaAssets(selectedClientId),
    listHashtagGroups(selectedClientId),
  ]);

  return (
    <div>
      <div className="inv-page-header">
        <div>
          <h1 className="inv-page-title">Content Pipeline</h1>
          <p className="inv-page-subtitle">
            Draft → approval → scheduled → published, for <strong>{brandLabel}</strong>.
            Approved posts publish through Go High Level.{" "}
            <Link href={`/invoicing/social${selectedClientId ? `?client=${selectedClientId}` : ""}`}>
              Direct composer →
            </Link>
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          alignItems: "center",
          marginBottom: "1.25rem",
        }}
      >
        <span className="inv-detail-label" style={{ margin: 0 }}>
          Brand
        </span>
        <Link
          href="/invoicing/social/pipeline"
          className={`inv-btn ${selectedClientId ? "inv-btn-ghost" : "inv-btn-secondary"}`}
        >
          8E Media
        </Link>
        {activeClients.map((c) => (
          <Link
            key={c.id}
            href={`/invoicing/social/pipeline?client=${c.id}`}
            className={`inv-btn ${selectedClientId === c.id ? "inv-btn-secondary" : "inv-btn-ghost"}`}
          >
            {c.company}
          </Link>
        ))}
      </div>

      <PipelineBoard
        key={selectedClientId ?? "agency"}
        clientId={selectedClientId}
        clientCompany={selectedClient?.company ?? null}
        hasGhl={selectedClient ? Boolean(selectedClient.ghl_location_id) : true}
        accounts={accounts}
        posts={posts}
        media={media}
        hashtagGroups={hashtagGroups}
      />
    </div>
  );
}
