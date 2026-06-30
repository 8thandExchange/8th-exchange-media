import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { Accent, AccentUnderline } from "@/components/editorial/Accent";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import {
  PARTNER,
  PRINT_CATEGORIES,
  QUOTE_PROCESS,
} from "@/lib/print-catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Print & Signage",
  description:
    "Custom print, signage, vinyl, apparel, and promotional products through 8th & Exchange Media — produced in partnership with 411 Graphics.",
  path: "/print",
  image: ILLUSTRATIONS.spots.svcPrint,
});

export default function PrintPage() {
  return (
    <PageShell>
      <PageHero
        index="Production"
        label="Print & Signage"
        title={
          <>
            Print, signage, and graphics —{" "}
            <span className="text-navy">quoted fast</span>.
          </>
        }
        description="Through our production partnership with 411 Graphics, we offer a full catalog of custom print, signage, vinyl, apparel, and promotional products — with quick turnaround and transparent pricing."
        featureSrc={ILLUSTRATIONS.spots.svcPrint}
        featureAlt="Hand-drawn framed artwork with gallery plaque for print and signage"
        aspect="4/3"
      />

      {/* Partnership intro */}
      <section className="py-20 md:py-28">
        <div className="container-content">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <EditorialReveal>
              <Eyebrow index="Partner" label="411 Graphics" tone="light" className="mb-6" />
              <h2 className="type-h2 max-w-lg">
                Production you can trust,{" "}
                <AccentUnderline>quoted through us</AccentUnderline>.
              </h2>
              <div className="type-body mt-8 space-y-5 text-ink/70">
                <p>
                  8th & Exchange Media partners with {PARTNER.name} — Billy&apos;s shop in
                  Augusta — to deliver print and signage at scale. You work with us; we handle
                  quoting, project management, and quality control.
                </p>
                <p>
                  Our Quick Quote program covers everything from a single yard sign to bulk
                  sticker runs, vehicle wraps, trade show banners, and team apparel. Send us
                  your specs and we&apos;ll return pricing within one business day.
                </p>
              </div>
            </EditorialReveal>

            <EditorialReveal delay={0.12}>
              <div className="border border-navy/10 bg-paper p-8 md:p-10">
                <p className="eyebrow eyebrow-on-light mb-6">How it works</p>
                <ol className="space-y-6">
                  {QUOTE_PROCESS.map((item) => (
                    <li key={item.step} className="flex gap-5">
                      <span className="eyebrow shrink-0 text-gold">{item.step}</span>
                      <div>
                        <p className="font-display text-lg italic text-navy">{item.title}</p>
                        <p className="mt-1 text-sm text-ink/60">{item.body}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <div className="mt-10">
                  <Button href="/contact?service=Print+%26+Signage+Quote" tone="light" pill>
                    Request a Quote
                  </Button>
                </div>
              </div>
            </EditorialReveal>
          </div>
        </div>
      </section>

      <HairlineReveal className="container-content" />

      {/* Product catalog */}
      <section className="py-20 md:py-28">
        <div className="container-content">
          <EditorialReveal className="mb-16 max-w-2xl">
            <Eyebrow index="Catalog" label="Products" tone="light" className="mb-6" />
            <h2 className="type-h2">
              What we can{" "}
              <span className="text-navy">produce for you</span>.
            </h2>
            <p className="type-body mt-5 text-ink/70">
              Pricing depends on size, quantity, and material. Every item below is available
              through our Quick Quote program — contact us with your specs for an exact quote.
            </p>
          </EditorialReveal>

          <div className="space-y-20 md:space-y-24">
            {PRINT_CATEGORIES.map((category, catIndex) => (
              <EditorialReveal key={category.id} delay={(catIndex % 3) * 0.08}>
                <div>
                  <div className="mb-10 max-w-xl">
                    <p className="eyebrow eyebrow-on-light mb-3">
                      {String(catIndex + 1).padStart(2, "0")}
                    </p>
                    <h3 className="type-h3 text-navy">{category.title}</h3>
                    <p className="type-body mt-3 text-ink/70">{category.summary}</p>
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {category.products.map((product) => (
                      <article
                        key={product.name}
                        className="border border-navy/10 bg-paper p-6 transition-colors hover:border-navy/20"
                      >
                        <h4 className="font-display text-lg italic text-navy">{product.name}</h4>
                        <p className="mt-2 text-sm text-ink/65">{product.description}</p>
                        {product.options ? (
                          <ul className="mt-4 flex flex-wrap gap-1.5">
                            {product.options.map((opt) => (
                              <li
                                key={opt}
                                className="border border-navy/10 px-2 py-0.5 text-[0.6875rem] font-medium text-ink/50"
                              >
                                {opt}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        <p className="mt-4 text-xs text-ink/45">
                          Turnaround: {product.turnaround}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
                {catIndex < PRINT_CATEGORIES.length - 1 ? (
                  <HairlineReveal className="mt-20 md:mt-24" />
                ) : null}
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Install note */}
      <section className="border-t border-navy/10 bg-paper py-16 md:py-20">
        <div className="container-content">
          <EditorialReveal>
            <div className="grid items-center gap-10 lg:grid-cols-[7rem_minmax(0,1fr)] lg:gap-14">
              <SpotIllustration
                src={ILLUSTRATIONS.spots.svcPrint}
                alt="Print and signage illustration"
                label="INSTALL"
                size={104}
                className="mx-auto lg:mx-0"
              />
              <div className="text-center lg:text-left">
                <h3 className="type-h3 text-navy">Installation available</h3>
                <p className="type-body mt-4 max-w-2xl text-ink/70">
                  Need signage installed on-site or a vehicle wrap applied? We offer professional
                  installation through our partner shop — in-shop, on-site, and wrap specialists
                  available by the hour or day.
                </p>
                <Link
                  href="/contact?service=Print+%26+Signage+Quote"
                  className="editorial-link mt-6 inline-flex"
                >
                  Ask about installation
                  <Accent kind="arrow" width={32} height={16} />
                </Link>
              </div>
            </div>
          </EditorialReveal>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Ready for a{" "}
            <span className="text-navy">quick quote</span>?
          </>
        }
        description="Tell us what you need — product, quantity, size, and timeline. We'll get you pricing within one business day."
        buttonText="Request a Quote"
        href="/contact?service=Print+%26+Signage+Quote"
      />
    </PageShell>
  );
}
