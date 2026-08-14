import { NextResponse } from "next/server";
import { requireInvoicingAuth } from "@/lib/invoicing/auth";
import { getStripe } from "@/lib/stripe";
import { getClientById, setClientStripeCustomer } from "@/lib/portal/service";
import { SITE_URL } from "@/lib/site";

/**
 * Creates a Stripe-hosted card-setup link for a client.
 *
 * Card data never touches this application or database: the client enters
 * their payment method on Stripe's own page (Checkout in setup mode), and
 * we keep only the Stripe customer id. Staff send the returned URL to the
 * client; once completed, the client page shows "card on file".
 */
export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireInvoicingAuth();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const client = await getClientById(id);
  if (!client) return NextResponse.json({ error: "Unknown client" }, { status: 404 });

  try {
    const stripe = getStripe();

    let customerId = client.stripe_customer_id;
    if (customerId) {
      // Guard against a stale/deleted customer reference.
      try {
        const existing = await stripe.customers.retrieve(customerId);
        if (existing.deleted) customerId = null;
      } catch {
        customerId = null;
      }
    }
    if (!customerId) {
      const customer = await stripe.customers.create({
        name: client.company,
        email: client.email,
        phone: client.phone ?? undefined,
        metadata: { portal_client_id: client.id, contact_name: client.contact_name },
      });
      customerId = customer.id;
      await setClientStripeCustomer(id, customerId);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customerId,
      payment_method_types: ["card"],
      success_url: `${SITE_URL}/pay/setup-complete`,
      cancel_url: `${SITE_URL}/portal/login`,
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create setup link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
