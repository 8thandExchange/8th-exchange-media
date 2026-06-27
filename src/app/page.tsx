import Link from "next/link";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { EditorialHero } from "@/components/home/EditorialHero";
import { ContactSection } from "@/components/home/ContactSection";
import { EditorialServiceGrid } from "@/components/editorial/EditorialServiceGrid";
import { EditorialApproach } from "@/components/editorial/EditorialApproach";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { FeatureIllustration } from "@/components/editorial/IllustrationFrame";
import { Accent, AccentUnderline } from "@/components/editorial/Accent";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";

const SERVICES = [
  {
    tag: "01 — Brand",
    title: "Brand & Strategy",
    description:
      "Identity systems, positioning, and messaging frameworks that give your brand a clear voice.",
    spot: ILLUSTRATIONS.spots.svcBrand,
    spotAlt: "Hand-drawn creative workspace flat lay with camera, sketchbook, and pencils",
    spotLabel: "SVC BRAND",
  },
  {
    tag: "02 — Web",
    title: "Web & Digital Experience",
    description:
      "Websites and platforms engineered for clarity, speed, accessibility, and conversion.",
    spot: ILLUSTRATIONS.spots.svcWeb,
    spotAlt: "Hand-drawn browser window with upward trend line",
    spotLabel: "SVC WEB",
  },
  {
    tag: "03 — Content",
    title: "Content & Social",
    description:
      "Organic and paid social, content creation, and community management that build steady momentum.",
    spot: ILLUSTRATIONS.spots.svcContent,
    spotAlt: "Hand-drawn speech bubbles and smartphone for content and social",
    spotLabel: "SVC CONTENT",
  },
  {
    tag: "04 — Search",
    title: "Search & Performance",
    description:
      "SEO, paid search, and performance marketing with transparent reporting and steady optimization.",
    spot: ILLUSTRATIONS.spots.svcSearch,
    spotAlt: "Hand-drawn magnifying glass with upward trend arrow",
    spotLabel: "SVC SEARCH",
  },
  {
    tag: "05 — Video",
    title: "Video & Production",
    description:
      "Commercial video, brand films, and full production — from concept through final cut.",
    spot: ILLUSTRATIONS.spots.svcVideo,
    spotAlt: "Hand-drawn vintage film camera on a tripod",
    spotLabel: "SVC VIDEO",
  },
  {
    tag: "06 — Drone",
    title: "Drone & Aerial",
    description:
      "FAA-certified aerial cinematography and photography for real estate, hospitality, and events.",
    spot: ILLUSTRATIONS.spots.svcDrone,
    spotAlt: "Hand-drawn quadcopter drone with camera gimbal",
    spotLabel: "SVC DRONE",
  },
];

const APPROACH = [
  {
    num: "01 — Listen",
    title: "Listen & Diagnose",
    body: "We start with the business, not the deliverable. Discovery, audience, market position, and the honest conversation about where you actually stand.",
    spot: ILLUSTRATIONS.spots.step1,
    spotAlt: "Hand-drawn ear with sound wave for listening and discovery",
    spotLabel: "STEP 1",
  },
  {
    num: "02 — Strategy",
    title: "Strategy & Story",
    body: "A clear, defensible plan — positioning, message architecture, and the creative platform that everything else is built on.",
    spot: ILLUSTRATIONS.spots.step2,
    spotAlt: "Hand-drawn treasure map with path to an X mark",
    spotLabel: "STEP 2",
  },
  {
    num: "03 — Create",
    title: "Create & Produce",
    body: "Identity, websites, film, and content produced to a single standard: broadcast quality, on brand, on time.",
    spot: ILLUSTRATIONS.spots.step3,
    spotAlt: "Hand-drawn crossed paintbrush and pencil",
    spotLabel: "STEP 3",
  },
  {
    num: "04 — Launch",
    title: "Launch & Compound",
    body: "Media, optimization, and transparent reporting. We don't disappear at launch — we compound results month over month.",
    spot: ILLUSTRATIONS.spots.step4,
    spotAlt: "Hand-drawn rocket with dashed flight trail",
    spotLabel: "STEP 4",
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <EditorialHero />

        {/* Studio */}
        <section id="studio" className="scroll-mt-28 py-24 md:py-32">
          <div className="container-content">
            <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
              <EditorialReveal>
                <Eyebrow index="02" label="The Studio" tone="light" className="mb-6" />
                <h2 className="type-h2 max-w-lg">
                  A media company for brands that prefer{" "}
                  <AccentUnderline>substance over noise</AccentUnderline>.
                </h2>
                <div className="type-body mt-8 space-y-5 text-ink/70">
                  <p>
                    8th & Exchange Media is the creative and performance arm of the 8th & Exchange
                    family — bringing institutional discipline and long-horizon thinking to every
                    campaign, website, and production.
                  </p>
                  <p>
                    From brand identity to broadcast-quality film, from search to social momentum,
                    we are the single partner that connects strategy to execution to measurable
                    growth.
                  </p>
                </div>
                <Link href="/about" className="editorial-link mt-8 inline-flex">
                  About the studio
                  <Accent kind="arrow" width={32} height={16} />
                </Link>
              </EditorialReveal>

              <EditorialReveal delay={0.12}>
                <FeatureIllustration
                  src={ILLUSTRATIONS.features.studio}
                  alt="Hand-drawn fountain pen and drafting compass on cream paper"
                  aspect="4/3"
                />
              </EditorialReveal>
            </div>
          </div>
        </section>

        <HairlineReveal className="container-content" />

        {/* Capabilities */}
        <section id="services" className="scroll-mt-28 py-24 md:py-32">
          <div className="container-content">
            <EditorialReveal className="mb-16 max-w-2xl">
              <Eyebrow index="03" label="Capabilities" tone="light" className="mb-6" />
              <h2 className="type-h2">
                Everything your brand needs to work{" "}
                <span className="text-navy">with intention</span>.
              </h2>
            </EditorialReveal>

            <EditorialServiceGrid items={SERVICES} />

            <EditorialReveal delay={0.1} className="mt-16 text-center">
              <Button href="/services" tone="light" pill>
                Full capabilities
              </Button>
            </EditorialReveal>
          </div>
        </section>

        <HairlineReveal className="container-content" />

        {/* Approach */}
        <section id="approach" className="scroll-mt-28 py-24 md:py-32">
          <div className="container-content">
            <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <EditorialReveal className="lg:sticky lg:top-32 lg:self-start">
                <Eyebrow index="04" label="Approach" tone="light" className="mb-6" />
                <h2 className="type-h2 max-w-sm">
                  A process built to make the work{" "}
                  <AccentUnderline>hold up</AccentUnderline>.
                </h2>
                <p className="type-body mt-6 text-ink/70">
                  Creativity informs everything we do — and intellect guides every artistic choice.
                  Our process is measured, collaborative, and designed for results that last.
                </p>
              </EditorialReveal>

              <EditorialApproach steps={APPROACH} />
            </div>
          </div>
        </section>

        {/* Family */}
        <section className="relative overflow-hidden">
          <FeatureIllustration
            src={ILLUSTRATIONS.features.family}
            alt="Hand-drawn row of traditional buildings on cream paper"
            aspect="21/9"
            className="min-h-[50vh]"
          />
          <div className="absolute inset-0 flex items-center bg-gradient-to-r from-cream/95 via-cream/70 to-transparent">
            <div className="container-content py-20 md:py-28">
              <EditorialReveal className="max-w-xl">
                <Eyebrow index="05" label="The Family" tone="light" className="mb-6" />
                <h2 className="type-h2">
                  Rooted in a holding company that builds for{" "}
                  <span className="text-navy">decades</span>.
                </h2>
                <p className="type-body mt-6 text-ink/70">
                  8th & Exchange Media operates alongside 8th Street Construction, Exchange House
                  Hospitality, and Exchange Pictures — a portfolio united by craft, discipline,
                  and long-term vision.
                </p>
                <a
                  href="https://8thandexchangecapital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="editorial-link mt-8 inline-flex"
                >
                  8th & Exchange Capital
                  <Accent kind="arrow" width={32} height={16} />
                </a>
              </EditorialReveal>
            </div>
          </div>
        </section>

        <ContactSection />
      </main>
      <SiteFooter />
    </>
  );
}
