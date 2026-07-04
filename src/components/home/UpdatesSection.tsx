import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent } from "@/components/editorial/Accent";
import { ILLUSTRATIONS } from "@/lib/illustrations";

const UPDATES = [
  {
    tag: "New service",
    title: "SMS & mobile messaging programs",
    body: "Compliant text campaigns and automated reminders that complement your email program — now available as a managed service.",
    href: "/services#sms-marketing",
    spot: ILLUSTRATIONS.spots.svcContent,
    spotAlt: "Hand-drawn speech bubbles and smartphone",
    spotLabel: "SMS",
  },
  {
    tag: "New service",
    title: "Predictive segments & send-time optimization",
    body: "We now build predictive audiences that surface your likeliest buyers — and time every send to when each contact actually reads.",
    href: "/services#personalization",
    spot: ILLUSTRATIONS.spots.svcSearch,
    spotAlt: "Hand-drawn magnifying glass with upward trend arrow",
    spotLabel: "PREDICT",
  },
  {
    tag: "Expanded",
    title: "Unified cross-channel reporting",
    body: "Email, SMS, social, and ads in one monthly dashboard — with revenue attribution and a plain-language review of what to do next.",
    href: "/services#analytics-reporting",
    spot: ILLUSTRATIONS.spots.svcWeb,
    spotAlt: "Hand-drawn browser window with upward trend line",
    spotLabel: "REPORT",
  },
];

export function UpdatesSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-content">
        <EditorialReveal className="mb-14 max-w-2xl">
          <Eyebrow index="08" label="Agency Updates" tone="light" className="mb-6" />
          <h2 className="type-h2">
            New ways we can help you{" "}
            <span className="text-navy">grow</span>.
          </h2>
        </EditorialReveal>

        <div className="space-y-10">
          {UPDATES.map((u, i) => (
            <EditorialReveal key={u.title} delay={i * 0.06}>
              <article className="grid items-center gap-6 sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-10">
                <SpotIllustration
                  src={u.spot}
                  alt={u.spotAlt}
                  label={u.spotLabel}
                  size={88}
                  className="mx-auto sm:mx-0"
                />
                <div className="min-w-0 text-center sm:text-left">
                  <p className="eyebrow eyebrow-on-light mb-2">{u.tag}</p>
                  <h3 className="type-h3 text-navy">{u.title}</h3>
                  <p className="type-body mt-2 text-ink/70">{u.body}</p>
                </div>
                <Link href={u.href} className="editorial-link justify-self-center sm:justify-self-end">
                  Learn more
                  <Accent kind="arrow" width={28} height={14} />
                </Link>
              </article>
              {i < UPDATES.length - 1 ? <HairlineReveal className="mt-10" /> : null}
            </EditorialReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
