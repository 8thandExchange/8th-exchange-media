import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandKitEditor } from "@/components/portal/BrandKitEditor";
import { GhlSettingsForm } from "@/components/portal/GhlSettingsForm";
import { getBrandKit, getClientById } from "@/lib/portal/service";

export default async function StaffClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const kit = (await getBrandKit(id)) ?? {};

  return (
    <div>
      <Link href="/invoicing/clients" className="inv-link">
        ← All portal clients
      </Link>

      <div className="inv-page-header mt-3">
        <div>
          <h1 className="inv-page-title">{client.company}</h1>
          <p className="inv-page-subtitle">
            {client.contact_name} · {client.email} — brand kit powers every asset we produce for
            this client.
          </p>
        </div>
      </div>

      {client.brand_notes ? (
        <div className="inv-notice inv-notice-warn" style={{ whiteSpace: "pre-wrap" }}>
          <strong>Onboarding notes:</strong> {client.brand_notes}
        </div>
      ) : null}

      <div className="inv-card" style={{ marginTop: "1rem" }}>
        <GhlSettingsForm clientId={client.id} connectedLocationId={client.ghl_location_id} />
      </div>

      <div className="inv-card" style={{ marginTop: "1rem" }}>
        <BrandKitEditor clientId={client.id} initialKit={kit} />
      </div>
    </div>
  );
}
