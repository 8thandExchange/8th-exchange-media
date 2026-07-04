import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Services",
  description:
    "Full-funnel marketing as a service — email, SMS, social, ads, automation, audience management, creative production, and analytics. Every channel, one agency.",
  path: "/services",
  image: ILLUSTRATIONS.features.studio,
});

export default function ServicesPage() {
  return (
    <PageShell>
      <PageHero
        index="Capabilities"
        label="Services"
        title={
          <>
            Every channel. One <span className="text-navy">agency</span>.
          </>
        }
        description="Everything a modern marketing platform can do — email, SMS, automation, audiences, ads, and analytics — delivered as a managed service, backed by a full creative studio."
        featureSrc={ILLUSTRATIONS.features.studio}
        featureAlt="Hand-drawn fountain pen and compass on cream paper"
        aspect="4/3"
      />

      {/* Category index */}
      <section className="border-b border-navy/8 bg-paper py-8">
        <div className="container-content">
          <nav aria-label="Service categories" className="flex flex-wrap gap-x-8 gap-y-3">
            {SERVICE_CATEGORIES.map((cat) => (
              <Link key={cat.slug} href={`#${cat.slug}`} className="nav-link">
                {cat.eyebrow}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      {SERVICE_CATEGORIES.map((cat, catIndex) => (
        <section
          key={cat.slug}
          id={cat.slug}
          className={`scroll-mt-28 py-20 md:py-24 ${catIndex % 2 === 1 ? "border-y border-navy/8 bg-paper" : ""}`}
        >
          <div className="container-content">
            <EditorialReveal className="mb-14 max-w-2xl">
              <Eyebrow
                index={String(catIndex + 1).padStart(2, "0")}
                label={cat.eyebrow}
                tone="light"
                className="mb-5"
              />
              <h2 className="type-h2">{cat.title}</h2>
              <p className="type-body mt-5 text-ink/70">{cat.intro}</p>
            </EditorialReveal>

            <div className="space-y-16 md:space-y-20">
              {cat.services.map((service, i) => (
                <EditorialReveal key={service.slug} delay={(i % 3) * 0.06}>
                  <article
                    id={service.slug}
                    className="grid scroll-mt-28 items-start gap-8 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-10 lg:gap-14"
                  >
                    <SpotIllustration
                      src={service.spot}
                      alt={service.spotAlt}
                      label={service.spotLabel}
                      size={104}
                      className="mx-auto sm:mx-0"
                    />
                    <div className="min-w-0 text-center sm:text-left">
                      <h3 className="type-h3 text-navy">{service.title}</h3>
                      <p className="type-body mt-4 text-ink/70">{service.description}</p>
                      <ul className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
                        {service.deliverables.map((d) => (
                          <li
                            key={d}
                            className="border border-navy/12 px-3 py-1.5 text-xs font-medium text-ink/60"
                          >
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                  {i < cat.services.length - 1 ? (
                    <HairlineReveal className="mt-16 md:mt-20" />
                  ) : null}
                </EditorialReveal>
              ))}
            </div>
          </div>
        </section>
      ))}

      <CtaBand
        title={
          <>
            Not sure which services you <span className="text-navy">need</span>?
          </>
        }
        description="Book a free audit. We'll review your marketing across every channel and map a path forward — no obligation."
        buttonText="Book a Free Audit"
      />
    </PageShell>
  );
}
