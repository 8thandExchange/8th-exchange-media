"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { newMetaEventId, trackMetaBrowser } from "@/lib/metaBrowser";

const GOALS = [
  "More leads & sales",
  "Launch or refresh my brand",
  "A website that converts",
  "Consistent social presence",
  "Email & SMS marketing",
  "Video & content production",
  "Rank in search & AI answers",
  "Full-service marketing partner",
];

const SERVICES = [
  "Brand & logo design",
  "Website design & build",
  "SEO / AEO / GEO",
  "Social media management",
  "Paid advertising",
  "Email & SMS campaigns",
  "Video & photography",
  "Print & signage",
];

const BUDGETS = ["Under $1k/mo", "$1k–$2.5k/mo", "$2.5k–$5k/mo", "$5k+/mo", "Project-based"];
const TIMELINES = ["ASAP", "Within a month", "This quarter", "Just exploring"];

const SOCIAL_FIELDS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "x", label: "X (Twitter)" },
  { key: "tiktok", label: "TikTok" },
  { key: "youtube", label: "YouTube" },
];

const STEPS = ["Your business", "Where you are today", "What you need", "Wrap up"];

function TogglePill({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`border px-4 py-2.5 text-left text-sm transition-colors ${
        selected
          ? "border-navy bg-navy text-cream"
          : "border-navy/20 text-ink/70 hover:border-navy/50"
      }`}
    >
      {label}
    </button>
  );
}

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [socials, setSocials] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<string[]>([]);
  const [services, setServices] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [brandAssets, setBrandAssets] = useState("");
  const [notes, setNotes] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function toggle(list: string[], setList: (v: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  function canContinue(): boolean {
    if (step === 0) return company.trim().length > 0;
    if (step === 2) return goals.length > 0 || services.length > 0;
    if (step === 3) return contactName.trim().length > 0 && email.trim().length > 0;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const eventId = newMetaEventId();
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          contactName,
          email,
          phone,
          website,
          industry,
          goals,
          services,
          socials,
          brandAssets,
          budget,
          timeline,
          notes,
          eventId,
          eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(data?.error ?? "Something went wrong — please try again.");
        return;
      }
      trackMetaBrowser("Lead", eventId);
      setDone(true);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="border-hairline bg-paper p-10 text-center md:p-14">
        <p className="eyebrow eyebrow-on-light mb-3">You&apos;re in</p>
        <h2 className="font-display text-3xl text-navy">We&apos;re on it.</h2>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink/65">
          Your onboarding is in our queue. We&apos;ll review everything you shared and reach out
          within one business day with next steps — including your client portal login.
        </p>
      </div>
    );
  }

  return (
    <div className="border-hairline bg-paper">
      {/* Progress */}
      <div className="border-b border-navy/10 px-6 py-4 md:px-10">
        <ol className="flex flex-wrap gap-x-6 gap-y-1">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={`text-[0.625rem] font-semibold uppercase tracking-[0.14em] ${
                i === step ? "text-navy" : i < step ? "text-gold-dark" : "text-ink/35"
              }`}
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </div>

      <div className="p-6 md:p-10">
        {error ? (
          <p className="mb-6 border border-navy/20 bg-navy/5 px-4 py-3 text-sm text-navy">
            {error}
          </p>
        ) : null}

        {step === 0 ? (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-navy">Tell us about your business.</h2>
            <div>
              <label htmlFor="ob-company" className="field-label field-label-on-light">
                Business name
              </label>
              <input
                id="ob-company"
                type="text"
                required
                className="field-input"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="ob-industry" className="field-label field-label-on-light">
                  Industry (optional)
                </label>
                <input
                  id="ob-industry"
                  type="text"
                  placeholder="e.g. Restaurant, Construction, Healthcare"
                  className="field-input"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ob-website" className="field-label field-label-on-light">
                  Current website (optional)
                </label>
                <input
                  id="ob-website"
                  type="text"
                  placeholder="yourbusiness.com — or “none yet”"
                  className="field-input"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-navy">Where can we find you today?</h2>
            <p className="text-sm text-ink/60">
              Drop in whatever exists — handles or links. Skip anything you don&apos;t have; that
              tells us just as much.
            </p>
            <div className="grid gap-5 sm:grid-cols-2">
              {SOCIAL_FIELDS.map((f) => (
                <div key={f.key}>
                  <label htmlFor={`ob-${f.key}`} className="field-label field-label-on-light">
                    {f.label}
                  </label>
                  <input
                    id={`ob-${f.key}`}
                    type="text"
                    placeholder="@handle or link"
                    className="field-input"
                    value={socials[f.key] ?? ""}
                    onChange={(e) => setSocials({ ...socials, [f.key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="ob-assets" className="field-label field-label-on-light">
                Existing brand assets (optional)
              </label>
              <textarea
                id="ob-assets"
                rows={3}
                placeholder="Links to your logo files, brand guide, photos — Google Drive or Dropbox links work great."
                className="field-input resize-y"
                value={brandAssets}
                onChange={(e) => setBrandAssets(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl text-navy">What are you trying to do?</h2>
              <p className="mt-1 text-sm text-ink/60">Pick everything that applies.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {GOALS.map((g) => (
                  <TogglePill
                    key={g}
                    label={g}
                    selected={goals.includes(g)}
                    onToggle={() => toggle(goals, setGoals, g)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="field-label field-label-on-light">Services you&apos;re interested in</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {SERVICES.map((s) => (
                  <TogglePill
                    key={s}
                    label={s}
                    selected={services.includes(s)}
                    onToggle={() => toggle(services, setServices, s)}
                  />
                ))}
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="ob-budget" className="field-label field-label-on-light">
                  Monthly budget (optional)
                </label>
                <select
                  id="ob-budget"
                  className="field-input"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                >
                  <option value="">Select…</option>
                  {BUDGETS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="ob-timeline" className="field-label field-label-on-light">
                  Timeline (optional)
                </label>
                <select
                  id="ob-timeline"
                  className="field-input"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                >
                  <option value="">Select…</option>
                  {TIMELINES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-6">
            <h2 className="font-display text-2xl text-navy">Last step — how do we reach you?</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="ob-name" className="field-label field-label-on-light">
                  Your name
                </label>
                <input
                  id="ob-name"
                  type="text"
                  required
                  autoComplete="name"
                  className="field-input"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="ob-phone" className="field-label field-label-on-light">
                  Phone (optional)
                </label>
                <input
                  id="ob-phone"
                  type="tel"
                  autoComplete="tel"
                  className="field-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="ob-email" className="field-label field-label-on-light">
                Email
              </label>
              <input
                id="ob-email"
                type="email"
                required
                autoComplete="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="ob-notes" className="field-label field-label-on-light">
                Anything else we should know? (optional)
              </label>
              <textarea
                id="ob-notes"
                rows={4}
                placeholder="Deadlines, competitors you admire, what hasn't worked before…"
                className="field-input resize-y"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-10 flex items-center justify-between">
          {step > 0 ? (
            <button type="button" className="nav-link" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          {step < STEPS.length - 1 ? (
            <Button
              type="button"
              tone="light"
              pill
              disabled={!canContinue()}
              onClick={() => setStep(step + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              tone="light"
              pill
              disabled={!canContinue() || loading}
              onClick={handleSubmit}
            >
              {loading ? "Submitting…" : "Submit onboarding"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
