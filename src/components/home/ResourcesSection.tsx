import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent } from "@/components/editorial/Accent";

const RESOURCES = [
  {
    title: "Which channels does your business actually need?",
    body: "How we decide where email, SMS, social, and ads fit — and where they don't.",
    href: "/services",
  },
  {
    title: "The welcome series that pays for itself",
    body: "Why the first three messages a new subscriber receives matter more than the next thirty.",
    href: "/services#marketing-automation",
  },
  {
    title: "What a month of full-funnel marketing looks like",
    body: "Our cadence: one plan, one calendar, weekly production, and a monthly review of what earned.",
    href: "/services#insights",
  },
  {
    title: "Not sure where to start? Book a free audit",
    body: "We'll review your current presence across every channel and map a path forward.",
    href: "/contact",
  },
];

export function ResourcesSection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <EditorialReveal className="lg:sticky lg:top-32 lg:self-start">
            <Eyebrow index="09" label="Guidance" tone="light" className="mb-6" />
            <h2 className="type-h2 max-w-sm">
              Marketing advice that helps you{" "}
              <span className="text-navy">sell more</span>.
            </h2>
            <p className="type-body mt-6 text-ink/70">
              Straight answers about what to run, when, and why — from a team that plans this
              every day.
            </p>
          </EditorialReveal>

          <div>
            {RESOURCES.map((r, i) => (
              <EditorialReveal key={r.title} delay={i * 0.05}>
                <Link href={r.href} className="group block py-6">
                  <div className="flex items-baseline justify-between gap-6">
                    <div>
                      <h3 className="type-h3 text-navy transition-colors group-hover:text-gold-dark">
                        {r.title}
                      </h3>
                      <p className="type-body mt-2 text-sm text-ink/65">{r.body}</p>
                    </div>
                    <Accent kind="arrow" width={32} height={16} className="shrink-0 opacity-60" />
                  </div>
                </Link>
                {i < RESOURCES.length - 1 ? <HairlineReveal /> : null}
              </EditorialReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
