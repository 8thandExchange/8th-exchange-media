import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandKitEditor } from "@/components/portal/BrandKitEditor";
import { ClientProvisioningCard } from "@/components/portal/ClientProvisioningCard";
import { GhlSettingsForm } from "@/components/portal/GhlSettingsForm";
import { getBrandKit, getClientById } from "@/lib/portal/service";
import { getStripe } from "@/lib/stripe";

/** Card-on-file check; null when Stripe is unreachable (page still renders). */
async function checkCardOnFile(stripeCustomerId: string | null): Promise<boolean | null> {
  if (!stripeCustomerId) return false;
  try {
    const methods = await getStripe().paymentMethods.list({
      customer: stripeCustomerId,
      type: "card",
      limit: 1,
    });
    return methods.data.length > 0;
  } catch {
    return null;
  }
}

export default async function StaffClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const kit = (await getBrandKit(id)) ?? {};
  const cardOnFile = await checkCardOnFile(client.stripe_customer_id);

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

      <div style={{ marginTop: "1rem" }}>
        <ClientProvisioningCard client={client} cardOnFile={cardOnFile} />
      </div>

      <div className="inv-card" style={{ marginTop: "1rem" }}>
        <GhlSettingsForm clientId={client.id} connectedLocationId={client.ghl_location_id} />
      </div>

      <div className="inv-card" style={{ marginTop: "1rem" }}>
        <BrandKitEditor clientId={client.id} initialKit={kit} />
      </div>
    </div>
  );
}
