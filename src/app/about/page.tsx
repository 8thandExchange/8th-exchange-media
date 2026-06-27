import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialApproach } from "@/components/editorial/EditorialApproach";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { FeatureIllustration } from "@/components/editorial/IllustrationFrame";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { Logo } from "@/components/brand/Logo";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { pageMetadata } from "@/lib/seo";

const VALUES = [
  {
    title: "Respect",
    body: "Every client, teammate, and idea earns a seat at the table. Great work starts with great relationships.",
  },
  {
    title: "Trust",
    body: "Transparency in process, pricing, and performance. We earn trust by delivering on every promise.",
  },
  {
    title: "Creativity",
    body: "Original thinking beyond the expected — solutions that cut through noise without shouting.",
  },
  {
    title: "Results",
    body: "Work that performs. Every campaign is built on data, tested steadily, and optimized for ROI.",
  },
];

const FAMILY = [
  {
    name: "8th Street Construction",
    sector: "Construction",
    description: "Residential and commercial building with institutional discipline.",
    url: "https://8thstreetconstruction.com",
  },
  {
    name: "Exchange House Hospitality",
    sector: "Hospitality",
    description: "Curated hospitality experiences rooted in place and craft.",
    url: "#",
  },
  {
    name: "Exchange Pictures",
    sector: "Film & Media",
    description: "Original film and media production with distribution at scale.",
    url: "#",
  },
];

const APPROACH = [
  {
    num: "01 — Listen",
    title: "Listen & Diagnose",
    body: "Discovery, audience, market position, and the honest conversation about where you actually stand.",
    spot: ILLUSTRATIONS.spots.step1,
    spotAlt: "Hand-drawn ear with sound wave for listening and discovery",
    spotLabel: "STEP 1",
  },
  {
    num: "02 — Strategy",
    title: "Strategy & Story",
    body: "Positioning, message architecture, and the creative platform everything else is built on.",
    spot: ILLUSTRATIONS.spots.step2,
    spotAlt: "Hand-drawn treasure map with path to an X mark",
    spotLabel: "STEP 2",
  },
  {
    num: "03 — Create",
    title: "Create & Produce",
    body: "Identity, websites, film, and content produced to broadcast quality — on brand, on time.",
    spot: ILLUSTRATIONS.spots.step3,
    spotAlt: "Hand-drawn crossed paintbrush and pencil",
    spotLabel: "STEP 3",
  },
  {
    num: "04 — Launch",
    title: "Launch & Compound",
    body: "Media, optimization, and transparent reporting that compounds results month over month.",
    spot: ILLUSTRATIONS.spots.step4,
    spotAlt: "Hand-drawn rocket with dashed flight trail",
    spotLabel: "STEP 4",
  },
];

export const metadata = pageMetadata({
  title: "Studio",
  description:
    "About 8th & Exchange Media — a full-service media company and division of 8th & Exchange Capital, headquartered in Augusta, Georgia.",
  path: "/about",
  image: ILLUSTRATIONS.features.studio,
});

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        index="The Studio"
        label="About"
        title={
          <>
            Where strategy meets{" "}
            <span className="text-navy">execution</span>.
          </>
        }
        description="8th & Exchange Media is the creative and performance arm of the 8th & Exchange family — bringing institutional discipline and long-horizon thinking to every campaign."
        featureSrc={ILLUSTRATIONS.features.studio}
        featureAlt="Hand-drawn fountain pen and drafting compass on cream paper"
        aspect="4/3"
      />

      <section className="py-20 md:py-28">
        <div className="container-content grid gap-16 lg:grid-cols-2 lg:gap-24">
          <EditorialReveal>
            <Eyebrow index="Mission" label="" tone="light" className="mb-6" />
            <h2 className="type-h2">Our mission</h2>
            <p className="type-body mt-6 text-ink/70">
              To deliver high-impact media solutions fueled by creativity, grounded in trust,
              and driven by results. We believe in respectful collaboration — where every idea
              counts and every client relationship is built on transparency, integrity, and
              measurable success.
            </p>
          </EditorialReveal>
          <EditorialReveal delay={0.1}>
            <Eyebrow index="Vision" label="" tone="light" className="mb-6" />
            <h2 className="type-h2">Our vision</h2>
            <p className="type-body mt-6 text-ink/70">
              To become the go-to creative growth partner for brands ready to scale. Through
              powerful partnerships, seamless collaboration, and steady focus on ROI, we build
              a future where marketing isn&apos;t just seen — it performs.
            </p>
          </EditorialReveal>
        </div>
      </section>

      <HairlineReveal className="container-content" />

      <section className="py-20 md:py-28">
        <div className="container-content">
          <EditorialReveal className="mb-14 text-center">
            <Eyebrow index="Foundation" label="Values" tone="light" className="mb-6" />
            <h2 className="type-h2 mx-auto max-w-xl">
              Built on principles that{" "}
              <span className="text-navy">endure</span>.
            </h2>
          </EditorialReveal>
          <div className="grid gap-px border border-navy/10 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => (
              <EditorialReveal
                key={value.title}
                delay={i * 0.06}
                className="bg-paper p-8 md:p-10"
              >
                <h3 className="type-h3 text-navy">{value.title}</h3>
                <p className="mt-4 text-sm leading-relaxed text-ink/65">{value.body}</p>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-navy/8 bg-paper py-20 md:py-28">
        <div className="container-content grid gap-14 lg:grid-cols-2 lg:gap-20">
          <EditorialReveal>
            {ILLUSTRATIONS.features.architecture ? (
              <FeatureIllustration
                src={ILLUSTRATIONS.features.architecture}
                alt="Hand-drawn architectural sketch on cream paper"
                aspect="4/3"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-navy/15 bg-cream">
                <span className="eyebrow text-ink/35">ARCHITECTURE ILLUSTRATION</span>
              </div>
            )}
          </EditorialReveal>
          <EditorialReveal delay={0.1}>
            <Eyebrow index="Place" label="Augusta" tone="light" className="mb-6" />
            <h2 className="type-h2">Local roots, national reach.</h2>
            <p className="type-body mt-6 text-ink/70">
              Based in Augusta, Georgia, we serve clients across the Southeast and beyond —
              bringing the same disciplined standards to every engagement, whether around the
              corner or across the country.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Logo variant="coin" className="h-14 w-14" />
              <p className="text-xs uppercase tracking-widest text-ink/45">
                Augusta, Georgia · Est. with purpose
              </p>
            </div>
          </EditorialReveal>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-content">
          <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <EditorialReveal className="lg:sticky lg:top-32 lg:self-start">
              <Eyebrow index="Approach" label="Process" tone="light" className="mb-6" />
              <h2 className="type-h2 max-w-sm">
                Work that{" "}
                <span className="text-navy">holds up</span>.
              </h2>
              <p className="type-body mt-6 text-ink/70">
                Creativity informs everything we do — and intellect guides every artistic
                choice. Our process is built to make the work work.
              </p>
            </EditorialReveal>
            <EditorialApproach steps={APPROACH} />
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <FeatureIllustration
          src={ILLUSTRATIONS.features.family}
          alt="Hand-drawn buildings representing the 8th and Exchange family portfolio"
          aspect="21/9"
        />
        <div className="absolute inset-0 flex items-center bg-gradient-to-r from-cream/95 via-cream/75 to-transparent">
          <div className="container-content max-w-2xl py-20 md:py-28">
            <EditorialReveal>
              <Eyebrow index="The Family" label="Portfolio" tone="light" className="mb-6" />
              <h2 className="type-h2">Part of the 8th & Exchange portfolio.</h2>
              <p className="type-body mt-6 text-ink/70">
                8th & Exchange Media is a division of 8th & Exchange Capital — a private holding
                company headquartered in Augusta, Georgia, investing in construction, hospitality,
                and media.
              </p>
              <a
                href="https://8thandexchangecapital.com"
                target="_blank"
                rel="noopener noreferrer"
                className="editorial-link mt-8 inline-flex"
              >
                8th & Exchange Capital
              </a>
            </EditorialReveal>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-content">
          <div className="grid gap-px border border-navy/10 md:grid-cols-3">
            {FAMILY.map((co, i) => (
              <EditorialReveal key={co.name} delay={i * 0.07} className="bg-paper p-8 md:p-10">
                <p className="eyebrow eyebrow-on-light text-[0.625rem]">{co.sector}</p>
                <h3 className="type-h3 mt-3 text-navy">{co.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/65">{co.description}</p>
                {co.url !== "#" ? (
                  <a
                    href={co.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="editorial-link mt-5 inline-flex normal-case"
                  >
                    Visit
                  </a>
                ) : null}
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Local roots.{" "}
            <span className="text-navy">National ambition</span>.
          </>
        }
        description="Based in Augusta with reach across the Southeast and beyond — we bring disciplined creative standards to every client we serve."
        buttonText="Work With Us"
      />
    </PageShell>
  );
}
