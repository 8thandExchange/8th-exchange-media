import { Resend } from "resend";
import { formatContactEmail, validateContact } from "@/lib/contact";
import { clientHintsFromRequest, sendCapiEvent } from "@/lib/meta";
import { agencyMetaAuthForCapi } from "@/lib/portal/metaAuth";
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

  const raw = body as Record<string, unknown>;
  const eventId = typeof raw.eventId === "string" && raw.eventId.trim() ? raw.eventId.trim() : crypto.randomUUID();
  const eventSourceUrl =
    typeof raw.eventSourceUrl === "string" && raw.eventSourceUrl.trim()
      ? raw.eventSourceUrl.trim()
      : `${SITE_URL}/contact`;
  const hints = clientHintsFromRequest(request);
  const auth = await agencyMetaAuthForCapi();
  if (auth) {
    await sendCapiEvent(auth, {
      eventName: "Contact",
      eventId,
      eventSourceUrl,
      email: data.email,
      phone: data.phone,
      ...hints,
      customData: { content_name: "contact form" },
    }).catch((err) => console.error("Meta CAPI Contact failed", err));
  }

  return Response.json({ ok: true });
}
