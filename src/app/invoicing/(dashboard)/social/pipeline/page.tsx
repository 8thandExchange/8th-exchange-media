import Link from "next/link";
import { PipelineBoard } from "@/components/portal/PipelineBoard";
import { PipelineCalendar } from "@/components/portal/PipelineCalendar";
import { getBrandKit, listClients } from "@/lib/portal/service";
import {
  listAccountRegistry,
  listHashtagGroups,
  listMediaAssets,
  listPipelinePosts,
  listPostingSlots,
} from "@/lib/portal/social";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string; month?: string }>;
}) {
  const params = await searchParams;
  const selectedClientId = params.client ?? null;
  const now = new Date();
  const month = /^\d{4}-\d{2}$/.test(params.month ?? "")
    ? params.month!
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

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

  const [posts, accounts, media, hashtagGroups, slots, brandKit] = await Promise.all([
    listPipelinePosts(selectedClientId),
    listAccountRegistry(selectedClientId),
    listMediaAssets(selectedClientId),
    listHashtagGroups(selectedClientId),
    listPostingSlots(selectedClientId),
    selectedClientId ? getBrandKit(selectedClientId) : Promise.resolve(null),
  ]);

  const voiceLines = [
    brandKit?.voiceTone ? `Voice: ${brandKit.voiceTone}` : null,
    brandKit?.services?.length ? `Services: ${brandKit.services.join(" · ")}` : null,
    brandKit?.priceAnchor ? `Price: ${brandKit.priceAnchor}` : null,
    brandKit?.primaryConversion ? `Convert: ${brandKit.primaryConversion}` : null,
    brandKit?.voiceDos?.length ? `Do: ${brandKit.voiceDos.join(" · ")}` : null,
    brandKit?.voiceDonts?.length ? `Don't: ${brandKit.voiceDonts.join(" · ")}` : null,
  ].filter((line): line is string => Boolean(line));
  const guardrails = selectedClient?.brand_notes ?? null;

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

      {voiceLines.length > 0 || guardrails ? (
        <div className="inv-card" style={{ marginBottom: "1.25rem" }}>
          <div className="inv-detail-label">Brand voice & guardrails — {brandLabel}</div>
          {voiceLines.map((line) => (
            <p key={line} style={{ fontSize: "13px", margin: "2px 0", color: "var(--inv-text-secondary)" }}>
              {line}
            </p>
          ))}
          {guardrails ? (
            <p style={{ fontSize: "12.5px", margin: "6px 0 0", color: "var(--inv-text-muted)", whiteSpace: "pre-wrap" }}>
              {guardrails}
            </p>
          ) : null}
        </div>
      ) : null}

      <PipelineBoard
        key={selectedClientId ?? "agency"}
        clientId={selectedClientId}
        clientCompany={selectedClient?.company ?? null}
        hasGhl={selectedClient ? Boolean(selectedClient.ghl_location_id) : true}
        accounts={accounts}
        posts={posts}
        media={media}
        hashtagGroups={hashtagGroups}
        slots={slots}
      />

      <PipelineCalendar posts={posts} month={month} clientId={selectedClientId} />
    </div>
  );
}
