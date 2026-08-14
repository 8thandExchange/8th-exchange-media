import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { BrandTile } from "@/components/editorial/BrandTile";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { PORTFOLIO, PORTFOLIO_DISCLOSURE } from "@/lib/portfolio";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Work",
  description:
    "The 8th & Exchange family of brands — healthcare, construction, hospitality, and sport. We operate these companies and build for them first; clients get the same system.",
  path: "/work",
  image: ILLUSTRATIONS.features.family,
});

export default function WorkPage() {
  return (
    <PageShell>
      <PageHero
        index="Portfolio"
        label="Work"
        title={
          <>
            We build for our own brands <span className="text-navy">first</span>.
          </>
        }
        description="Most agencies show you logos they rented. This is the 8th & Exchange family — real operating companies in healthcare, construction, hospitality, and sport, run on the same system we sell. When it works, it works with our own money on the line."
        featureSrc={ILLUSTRATIONS.features.family}
        featureAlt="Hand-drawn family of brand marks on cream paper"
        aspect="4/3"
      />

      <section className="surface-navy py-20 md:py-28">
        <div className="container-content">
          <EditorialReveal className="mb-12 max-w-2xl">
            <Eyebrow index="01" label="The Family" tone="dark" className="mb-5" />
            <h2 className="type-h2 !text-cream">Nine ventures. One operating system.</h2>
            <p className="type-body mt-5 text-cream/70">{PORTFOLIO_DISCLOSURE}</p>
          </EditorialReveal>

          <div className="grid gap-6 md:grid-cols-2">
            {PORTFOLIO.map((brand, i) => (
              <EditorialReveal key={brand.name} delay={(i % 2) * 0.08} className="h-full">
                <BrandTile brand={brand} index={i} />
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="max-w-2xl">
            <Eyebrow index="02" label="Case studies" tone="light" className="mb-5" />
            <h2 className="type-h2">Numbers over adjectives.</h2>
            <p className="type-body mt-5 text-ink/70">
              We publish case studies when there are real numbers to stand behind — acquisition
              cost, bookings, growth — and not before. The first, Elevated Health Augusta, is
              being instrumented now; its results will appear here as they accrue.
            </p>
          </EditorialReveal>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Want this system pointed at <span className="text-navy">your</span> business?
          </>
        }
        description="Start with the Growth Map — a free strategy session with a written 90-day plan you keep either way."
      />
    </PageShell>
  );
}
