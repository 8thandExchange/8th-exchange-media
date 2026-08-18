import { Resend } from "resend";
import { formatContactEmail, validateContact } from "@/lib/contact";
import { pushContactToGhl } from "@/lib/ghl";
import {
  clientIpFrom,
  readMetaClickIds,
  sendAgencyCapiEvent,
} from "@/lib/meta/capi";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const validated = validateContact(body);
  if (!validated.ok) {
    const status = validated.error === "Spam detected." ? 200 : 400;
    if (status === 200) return Response.json({ ok: true });
    return Response.json({ error: validated.error }, { status });
  }

  const { data } = validated;
  const { subject, text } = formatContactEmail(data);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured");
    return Response.json(
      { error: `Contact form is not configured. Email ${CONTACT_EMAIL} directly.` },
      { status: 503 }
    );
  }

  const resend = new Resend(apiKey);
  const from = process.env.CONTACT_FROM_EMAIL || "8th & Exchange Media <onboarding@resend.dev>";
  const to = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL;

  const { error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: data.email,
    subject,
    text,
  });

  if (error) {
    console.error("Resend error:", error);
    return Response.json({ error: "Failed to send message. Please try again." }, { status: 500 });
  }

  const nameParts = data.name.trim().split(/\s+/);
  await pushContactToGhl({
    name: data.name,
    email: data.email,
    phone: data.phone,
    companyName: data.company,
    source: "8emedia.com contact",
    tags: ["8e-contact", ...(data.services ?? []).map((s) => `need: ${s}`)],
    notes: [data.budget ? `Budget: ${data.budget}` : null, data.message]
      .filter(Boolean)
      .join("\n"),
  }).catch((err) => console.error("GHL contact push failed", err));

  const { eventId } = await sendAgencyCapiEvent({
    eventName: "Lead",
    eventSourceUrl: request.headers.get("referer") || `${SITE_URL}/contact`,
    user: {
      email: data.email,
      phone: data.phone,
      firstName: nameParts[0],
      lastName: nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined,
      clientIp: clientIpFrom(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
      ...readMetaClickIds(request),
    },
    customData: { content_name: "contact" },
  });

  return Response.json({ ok: true, eventId });
}
