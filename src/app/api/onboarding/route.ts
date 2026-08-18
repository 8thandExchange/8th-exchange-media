import { Resend } from "resend";
import { pushContactToGhl } from "@/lib/ghl";
import { clientHintsFromRequest, sendCapiEvent } from "@/lib/meta";
import { agencyMetaAuthForCapi } from "@/lib/portal/metaAuth";
import { createLead } from "@/lib/portal/service";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

const MAX_SHORT = 200;
const MAX_LONG = 5000;
const MAX_LIST = 20;

function clean(value: unknown, max = MAX_SHORT): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .slice(0, MAX_LIST)
    .map((v) => v.trim().slice(0, MAX_SHORT));
}

function cleanSocials(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>).slice(0, 12)) {
    const v = clean(val);
    if (v) out[key.slice(0, 40)] = v;
  }
  return out;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Honeypot: bots fill every field; humans never see this one.
  if (clean(body.fax)) {
    return Response.json({ ok: true });
  }

  const company = clean(body.company);
  const contactName = clean(body.contactName);
  const email = clean(body.email);

  if (!company || !contactName || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return Response.json(
      { error: "Company, your name, and a valid email are required." },
      { status: 400 }
    );
  }

  try {
    const lead = await createLead({
      company,
      contactName,
      email,
      phone: clean(body.phone),
      website: clean(body.website),
      industry: clean(body.industry),
      goals: cleanList(body.goals),
      services: cleanList(body.services),
      socials: cleanSocials(body.socials),
      brandAssets: clean(body.brandAssets, MAX_LONG),
      budget: clean(body.budget),
      timeline: clean(body.timeline),
      notes: clean(body.notes, MAX_LONG),
    });

    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      const resend = new Resend(apiKey);
      const from = process.env.CONTACT_FROM_EMAIL || "8th & Exchange Media <onboarding@resend.dev>";
      const to = process.env.CONTACT_TO_EMAIL || CONTACT_EMAIL;
      await resend.emails
        .send({
          from,
          to: [to],
          replyTo: email,
          subject: `New onboarding: ${company}`,
          text: [
            `New client onboarding submission`,
            ``,
            `Company: ${company}`,
            `Contact: ${contactName} <${email}>${lead.phone ? ` · ${lead.phone}` : ""}`,
            lead.website ? `Website: ${lead.website}` : null,
            lead.industry ? `Industry: ${lead.industry}` : null,
            lead.goals.length ? `Goals: ${lead.goals.join(", ")}` : null,
            lead.services.length ? `Services: ${lead.services.join(", ")}` : null,
            lead.budget ? `Budget: ${lead.budget}` : null,
            lead.timeline ? `Timeline: ${lead.timeline}` : null,
            lead.notes ? `\nNotes:\n${lead.notes}` : null,
            ``,
            `Review it in the dashboard: https://8emedia.com/invoicing/leads`,
          ]
            .filter((line): line is string => line !== null)
            .join("\n"),
        })
        .catch((err) => console.error("Lead notification email failed", err));
    }

    // Must be awaited: Vercel freezes the function once the response is
    // sent, so an un-awaited call would never execute. Failures are still
    // swallowed so a GHL outage can't break onboarding.
    await pushContactToGhl({
      name: contactName,
      email,
      phone: lead.phone ?? undefined,
      companyName: company,
      website: lead.website ?? undefined,
      source: "8emedia.com onboarding",
      tags: ["8e-onboarding", ...(lead.budget ? [`budget: ${lead.budget}`] : [])],
      notes: [
        lead.goals.length ? `Goals: ${lead.goals.join(", ")}` : null,
        lead.services.length ? `Services: ${lead.services.join(", ")}` : null,
        lead.timeline ? `Timeline: ${lead.timeline}` : null,
        lead.notes ? `Notes: ${lead.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    }).catch((err) => console.error("GHL contact push failed", err));

    const eventId =
      typeof body.eventId === "string" && body.eventId.trim() ? body.eventId.trim() : crypto.randomUUID();
    const eventSourceUrl =
      typeof body.eventSourceUrl === "string" && body.eventSourceUrl.trim()
        ? body.eventSourceUrl.trim()
        : `${SITE_URL}/onboarding`;
    const hints = clientHintsFromRequest(request);
    const metaAuth = await agencyMetaAuthForCapi();
    if (metaAuth) {
      await sendCapiEvent(metaAuth, {
        eventName: "Lead",
        eventId,
        eventSourceUrl,
        email,
        phone: lead.phone ?? undefined,
        ...hints,
        customData: { content_name: "onboarding wizard", content_category: lead.budget ?? undefined },
      }).catch((err) => console.error("Meta CAPI Lead failed", err));
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to store onboarding lead", error);
    return Response.json(
      { error: `Something went wrong. Email us at ${CONTACT_EMAIL} and we'll take it from there.` },
      { status: 500 }
    );
  }
}
