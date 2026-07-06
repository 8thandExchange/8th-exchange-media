import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    console.error(
      `[stripe-webhook] rejected: signature header ${signature ? "present" : "MISSING"}, ` +
        `STRIPE_WEBHOOK_SECRET ${secret ? `present (len ${secret.length})` : "MISSING"}`
    );
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature";
    console.error(`[stripe-webhook] signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  console.log(`[stripe-webhook] received ${event.type} (${event.id})`);

  switch (event.type) {
    case "invoice.paid":
    case "invoice.payment_failed":
    case "invoice.finalized":
    case "invoice.voided":
    case "checkout.session.completed":
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
