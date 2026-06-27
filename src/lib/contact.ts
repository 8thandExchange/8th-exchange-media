import { SITE_URL } from "@/lib/site";

export interface ContactPayload {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  budget?: string;
  services?: string[];
  message: string;
  company_website?: string;
}

export function validateContact(body: unknown): { ok: true; data: ContactPayload } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid request body." };
  }

  const b = body as Record<string, unknown>;

  if (b.company_website) {
    return { ok: false, error: "Spam detected." };
  }

  const name = String(b.name || "").trim();
  const email = String(b.email || "").trim();
  const message = String(b.message || "").trim();

  if (!name || name.length < 2) {
    return { ok: false, error: "Please enter your name." };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email." };
  }
  if (!message || message.length < 10) {
    return { ok: false, error: "Please tell us a bit more about your project." };
  }

  const services = Array.isArray(b.services)
    ? b.services.filter((s): s is string => typeof s === "string")
    : undefined;

  return {
    ok: true,
    data: {
      name,
      email,
      company: String(b.company || "").trim() || undefined,
      phone: String(b.phone || "").trim() || undefined,
      budget: String(b.budget || "").trim() || undefined,
      services,
      message,
    },
  };
}

export function formatContactEmail(data: ContactPayload): { subject: string; text: string } {
  const subject = `New project inquiry — ${data.company || data.name}`;
  const lines = [
    `Name: ${data.name}`,
    data.company ? `Company: ${data.company}` : null,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    data.budget ? `Budget: ${data.budget}` : null,
    data.services?.length ? `Services: ${data.services.join(", ")}` : null,
    "",
    data.message,
    "",
    "—",
    `Sent via ${SITE_URL.replace("https://", "")}`,
  ].filter(Boolean);

  return { subject, text: lines.join("\n") };
}
