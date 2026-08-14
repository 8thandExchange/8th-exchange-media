import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { EditorialHero } from "@/components/home/EditorialHero";
import { ContactSection } from "@/components/home/ContactSection";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { EditorialServiceGrid } from "@/components/editorial/EditorialServiceGrid";
import { EditorialApproach } from "@/components/editorial/EditorialApproach";
import { BrandTile } from "@/components/editorial/BrandTile";
import { Accent } from "@/components/editorial/Accent";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { PORTFOLIO, PORTFOLIO_DISCLOSURE } from "@/lib/portfolio";

/**
 * Home — the editorial agency site, structured to convert:
 * hero → manifesto → what we do → proof (the family) → how we work →
 * the Growth Map offer → contact. No mock products, no invented numbers.
 */

const SERVICES = [
  {
    tag: "Strategy",
    title: "Brand & Positioning",
    description:
      "Who you're for, why you win, and the words and marks that carry it — the thinking every other deliverable inherits.",
    spot: ILLUSTRATIONS.spots.svcBrand,
    spotAlt: "Hand-drawn compass rose",
    spotLabel: "SVC BRAND",
  },
  {
    tag: "Production",
    title: "Creative Studio",
    description:
      "Design, copy, photography, film, and aerial — produced in-house, so every asset looks unmistakably like you.",
    spot: ILLUSTRATIONS.spots.svcVideo,
    spotAlt: "Hand-drawn film camera",
    spotLabel: "SVC STUDIO",
  },
  {
    tag: "Channels",
    title: "Web, Email, SMS & Social",
    description:
      "Sites and landing pages built to convert, and the always-on channels — email, text, social — run as one program.",
    spot: ILLUSTRATIONS.spots.svcWeb,
    spotAlt: "Hand-drawn browser window with rising trend line",
    spotLabel: "SVC WEB",
  },
  {
    tag: "Performance",
    title: "Ads, Search & Analytics",
    description:
      "Paid media and SEO with one scoreboard: what a customer costs, what they're worth, and where the next dollar goes.",
    spot: ILLUSTRATIONS.spots.svcSearch,
    spotAlt: "Hand-drawn magnifying glass over a chart",
    spotLabel: "SVC PERF",
  },
];

const APPROACH = [
  {
    num: "( 01 )",
    title: "Map",
    body: "Every engagement starts with the Growth Map — an audit of your ads, funnel, and follow-up, and a written 90-day plan. You keep it whether or not you hire us.",
    spot: ILLUSTRATIONS.spots.step1,
    spotAlt: "Hand-drawn folded map",
    spotLabel: "STEP 01",
  },
  {
    num: "( 02 )",
    title: "Build",
    body: "Brand, pages, offers, and the channel program — built in priority order from the map, not from a retainer's worth of busywork.",
    spot: ILLUSTRATIONS.spots.step2,
    spotAlt: "Hand-drawn drafting tools",
    spotLabel: "STEP 02",
  },
  {
    num: "( 03 )",
    title: "Run",
    body: "Campaigns ship on a weekly cadence — creative, email, social, ads — with one team accountable for the whole funnel, not a slice of it.",
    spot: ILLUSTRATIONS.spots.step3,
    spotAlt: "Hand-drawn printing press",
    spotLabel: "STEP 03",
  },
  {
    num: "( 04 )",
    title: "Compound",
    body: "Every month we report what a customer cost, what they're worth, and what changes next. Spend follows evidence. The work compounds.",
    spot: ILLUSTRATIONS.spots.step4,
    spotAlt: "Hand-drawn rocket with dashed flight trail",
    spotLabel: "STEP 04",
  },
];

export default function HomePage() {
  return (
    <PageShell>
      <EditorialHero />

      {/* Manifesto */}
      <section id="studio" className="scroll-mt-28 py-24 md:py-32">
        <div className="container-content">
          <EditorialReveal className="max-w-3xl">
            <Eyebrow index="01" label="The Studio" tone="light" className="mb-6" />
            <h2 className="type-h2">
              Marketing you can hold <span className="text-navy">accountable</span>.
            </h2>
            <p className="type-body mt-6 max-w-2xl text-ink/70">
              8th &amp; Exchange Media is the in-house studio of a family of operating companies
              — healthcare, construction, hospitality, sport. We build brands, sites, and
              campaigns for our own ventures first, with our own money on the line, and we run
              the same system for a small roster of clients. One team, one plan, one scoreboard:
              what did a customer cost, and what are they worth.
            </p>
            <div className="mt-10 flex items-center gap-4">
              <Accent kind="underline" width={120} height={12} />
            </div>
          </EditorialReveal>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="scroll-mt-28 border-y border-navy/8 bg-paper py-24 md:py-32">
        <div className="container-content">
          <EditorialReveal className="mb-14 max-w-2xl">
            <Eyebrow index="02" label="What We Do" tone="light" className="mb-6" />
            <h2 className="type-h2">Full-service, in the literal sense.</h2>
            <p className="type-body mt-5 text-ink/70">
              Strategy through production through performance — under one roof, so nothing gets
              lost between vendors.
            </p>
          </EditorialReveal>

          <EditorialServiceGrid items={SERVICES} />

          <EditorialReveal className="mt-12">
            <Link href="/services" className="editorial-link">
              Every service, in detail
              <Accent kind="arrow" width={32} height={16} />
            </Link>
          </EditorialReveal>
        </div>
      </section>

      {/* Proof — the family */}
      <section id="work" className="scroll-mt-28 surface-navy py-24 md:py-32">
        <div className="container-content">
          <EditorialReveal className="mb-12 max-w-2xl">
            <Eyebrow index="03" label="The Family" tone="dark" className="mb-6" />
            <h2 className="type-h2 !text-cream">
              Our proof isn&apos;t a logo wall. It&apos;s a <span className="pivot-on-dark">payroll</span>.
            </h2>
            <p className="type-body mt-5 text-cream/70">{PORTFOLIO_DISCLOSURE}</p>
          </EditorialReveal>

          <div className="grid gap-6 md:grid-cols-2">
            {PORTFOLIO.slice(0, 4).map((brand, i) => (
              <EditorialReveal key={brand.name} delay={(i % 2) * 0.08} className="h-full">
                <BrandTile brand={brand} index={i} />
              </EditorialReveal>
            ))}
          </div>

          <EditorialReveal className="mt-10">
            <Link href="/work" className="editorial-link !text-cream">
              The whole family
              <Accent kind="arrow" width={32} height={16} />
            </Link>
          </EditorialReveal>
        </div>
      </section>

      {/* Approach */}
      <section id="approach" className="scroll-mt-28 py-24 md:py-32">
        <div className="container-content">
          <EditorialReveal className="mb-10 max-w-2xl">
            <Eyebrow index="04" label="How We Work" tone="light" className="mb-6" />
            <h2 className="type-h2">Four steps. No mystery.</h2>
          </EditorialReveal>
          <EditorialApproach steps={APPROACH} />
        </div>
      </section>

      {/* The offer */}
      <CtaBand
        title={
          <>
            Start with the <span className="text-navy">Growth Map</span> — free, and yours to keep.
          </>
        }
        description="A 30-minute strategy session backed by a real audit of your ads, funnel, and follow-up. You leave with a written 90-day plan, whether or not you ever hire us."
      />

      <ContactSection />
    </PageShell>
  );
}
