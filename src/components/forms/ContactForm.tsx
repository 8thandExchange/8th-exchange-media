"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const BUDGETS = [
  "Select a range",
  "$10k – $25k",
  "$25k – $50k",
  "$50k – $100k",
  "$100k+",
  "Let's talk",
];

const SERVICE_OPTIONS = [
  "Brand & Strategy",
  "Web & Digital",
  "Content & Social",
  "Search & Performance",
  "Video & Production",
  "Drone & Aerial",
  "Print & Signage",
  "Print & Signage Quote",
  "360 Virtual Tours",
  "Full-Service Partnership",
];

interface ContactFormProps {
  showPhone?: boolean;
  showServiceSelect?: boolean;
  submitLabel?: string;
  tone?: "dark" | "light";
  initialService?: string;
}

export function ContactForm({
  showPhone = false,
  showServiceSelect = false,
  submitLabel = "Send Inquiry",
  tone = "dark",
  initialService = "",
}: ContactFormProps) {
  const validService = SERVICE_OPTIONS.includes(initialService) ? initialService : "";

  const [selected, setSelected] = useState<string[]>([]);
  const [service, setService] = useState(validService);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const dark = tone === "dark";

  const toggle = (s: string) =>
    setSelected((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = new FormData(form);

    if (data.get("company_website")) {
      setStatus("success");
      return;
    }

    const payload = {
      name: data.get("name"),
      company: data.get("company"),
      email: data.get("email"),
      phone: data.get("phone"),
      budget: data.get("budget"),
      services: showServiceSelect && service ? [service] : selected,
      message: data.get("message"),
      company_website: data.get("company_website"),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Failed to send message.");

      setStatus("success");
      form.reset();
      setSelected([]);
      setService("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div
        className={`flex min-h-[360px] flex-col items-center justify-center border p-10 text-center md:p-14 ${
          dark ? "border-white/10 bg-navy/50" : "border-hairline-ink bg-paper"
        }`}
      >
        <p className={`type-h2 ${dark ? "text-cream" : "text-ink"}`}>Thank you.</p>
        <p className={`type-body mx-auto mt-4 ${dark ? "text-cream/65" : "text-ink/65"}`}>
          Your message is on its way. We&apos;ll be in touch within one business day.
        </p>
      </div>
    );
  }

  const labelClass = dark ? "field-label field-label-on-dark" : "field-label field-label-on-light";
  const inputClass = dark ? "field-input field-input-on-dark" : "field-input";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="grid gap-8 md:grid-cols-2">
        <Field label="Name" name="name" required labelClass={labelClass} inputClass={inputClass} />
        <Field label="Company" name="company" labelClass={labelClass} inputClass={inputClass} />
        <Field
          label="Email"
          name="email"
          type="email"
          required
          labelClass={labelClass}
          inputClass={inputClass}
        />
        {showPhone ? (
          <Field label="Phone" name="phone" type="tel" labelClass={labelClass} inputClass={inputClass} />
        ) : (
          <div>
            <label className={labelClass}>Budget</label>
            <select name="budget" className={`${inputClass} mt-2 cursor-pointer`}>
              {BUDGETS.map((b) => (
                <option key={b} value={b} className={dark ? "bg-navy text-cream" : "bg-paper text-ink"}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {showPhone && (
        <div>
          <label className={labelClass}>Budget</label>
          <select name="budget" className={`${inputClass} mt-2 cursor-pointer`}>
            {BUDGETS.map((b) => (
              <option key={b} value={b} className={dark ? "bg-navy text-cream" : "bg-paper text-ink"}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      {showServiceSelect ? (
        <div>
          <label className={labelClass}>How can we help?</label>
          <select
            name="service"
            required
            value={service}
            onChange={(e) => setService(e.target.value)}
            className={`${inputClass} mt-2 cursor-pointer`}
          >
            <option value="" disabled>
              Select a service
            </option>
            {SERVICE_OPTIONS.map((s) => (
              <option key={s} value={s} className={dark ? "bg-navy text-cream" : "bg-paper text-ink"}>
                {s}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className={labelClass}>What do you need?</label>
          <div className="mt-4 flex flex-wrap gap-2">
            {SERVICE_OPTIONS.slice(0, 6).map((s) => {
              const on = selected.includes(s);
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggle(s)}
                  className={`border px-3 py-2 eyebrow text-[0.6875rem] transition-colors ${
                    on
                      ? dark
                        ? "border-cream bg-cream text-navy"
                        : "border-navy bg-navy text-cream"
                      : dark
                        ? "border-white/20 text-cream/60 hover:border-gold/50 hover:text-cream"
                        : "border-hairline-ink text-ink/60 hover:border-navy hover:text-ink"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className={labelClass}>Tell us about the project</label>
        <textarea
          name="message"
          rows={4}
          required
          placeholder="Goals, timeline, and what success looks like."
          className={`${inputClass} mt-2 resize-none`}
        />
      </div>

      <input
        type="text"
        name="company_website"
        tabIndex={-1}
        autoComplete="off"
        className="hp-field"
        aria-hidden
      />

      {status === "error" && (
        <p className="text-sm text-red-400" role="alert">
          {errorMsg}
        </p>
      )}

      <Button type="submit" tone={dark ? "dark" : "light"} pill={!dark} disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : submitLabel}
      </Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  labelClass,
  inputClass,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  labelClass: string;
  inputClass: string;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span aria-hidden> *</span>}
      </label>
      <input type={type} name={name} required={required} className={`${inputClass} mt-2`} />
    </div>
  );
}
