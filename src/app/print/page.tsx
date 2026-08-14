import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { PARTNER, PRINT_CATEGORIES, QUOTE_PROCESS } from "@/lib/print-catalog";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Print & Signage",
  description:
    "Signs, banners, vehicle wraps, apparel, and print collateral through our 411 Graphics production partnership — Quick Quote pricing within one business day.",
  path: "/print",
  image: ILLUSTRATIONS.spots.svcPrint,
});

const QUOTE_HREF = "/contact?service=Print+%26+Signage+Quote";

export default function PrintPage() {
  return (
    <PageShell>
      <PageHero
        index="Production"
        label="Print & Signage"
        title={
          <>
            From file to <span className="text-navy">physical</span>.
          </>
        }
        description={`Signs, banners, wraps, apparel, and print collateral — produced through our ${PARTNER.name} partnership, quoted through our Quick Quote program, and managed end to end by the studio so everything that leaves the shop looks unmistakably like you.`}
        featureSrc={ILLUSTRATIONS.spots.svcPrint}
        featureAlt="Hand-drawn framed artwork with gallery plaque"
        aspect="4/3"
      />

      {/* Quick Quote process */}
      <section className="border-b border-navy/8 bg-paper py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="mb-12 max-w-2xl">
            <Eyebrow index="01" label="Quick Quote" tone="light" className="mb-5" />
            <h2 className="type-h2">Priced in one business day.</h2>
            <p className="type-body mt-5 text-ink/70">
              Tell us what you need and we come back with real pricing — not a range, not a
              callback loop. Design happens in the studio; production runs through{" "}
              {PARTNER.name}.
            </p>
          </EditorialReveal>
          <div className="grid gap-10 md:grid-cols-4 md:gap-8">
            {QUOTE_PROCESS.map((s, i) => (
              <EditorialReveal key={s.step} delay={i * 0.06}>
                <article>
                  <div className="eyebrow text-gold-dark">{s.step}</div>
                  <h3 className="type-h3 mt-2">{s.title}</h3>
                  <p className="type-body mt-3 text-ink/70">{s.body}</p>
                </article>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="mb-4 max-w-2xl">
            <Eyebrow index="02" label="The Catalog" tone="light" className="mb-5" />
            <h2 className="type-h2">Everything the shop runs.</h2>
            <p className="type-body mt-5 text-ink/70">
              Seven categories, quoted per job. Turnaround times start at artwork approval.
            </p>
          </EditorialReveal>

          <nav aria-label="Print categories" className="mb-14 flex flex-wrap gap-x-7 gap-y-2 border-b border-navy/8 pb-6">
            {PRINT_CATEGORIES.map((cat) => (
              <a key={cat.id} href={`#${cat.id}`} className="nav-link">
                {cat.title}
              </a>
            ))}
          </nav>

          <div className="space-y-16">
            {PRINT_CATEGORIES.map((cat, catIndex) => (
              <EditorialReveal key={cat.id}>
                <section id={cat.id} className="scroll-mt-28">
                  <div className="mb-6 max-w-2xl">
                    <p className="eyebrow eyebrow-on-light mb-2">
                      {String(catIndex + 1).padStart(2, "0")}
                    </p>
                    <h3 className="font-display text-2xl italic text-navy">{cat.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink/65">{cat.summary}</p>
                  </div>
                  <div className="elevate grid gap-px overflow-hidden border border-navy/10 bg-navy/10 sm:grid-cols-2">
                    {cat.products.map((p) => (
                      <article key={p.name} className="bg-paper p-6">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h4 className="font-semibold text-navy">{p.name}</h4>
                          <span className="eyebrow text-[0.5625rem] text-ink/45">
                            {p.turnaround}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-ink/70">{p.description}</p>
                        {p.options?.length ? (
                          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                            {p.options.map((o) => (
                              <li key={o} className="eyebrow text-[0.5625rem] text-gold-dark">
                                {o}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              </EditorialReveal>
            ))}
          </div>

          <EditorialReveal className="mt-14 border border-navy/10 bg-paper p-8 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <h3 className="type-h3">Installation, handled.</h3>
                <p className="type-body mt-3 text-ink/70">
                  Signage mounting, vehicle wrap installation, and on-site graphics go through
                  the same pipeline — one point of contact from artwork to install.
                </p>
              </div>
              <Button href={QUOTE_HREF} tone="light" pill>
                Request a Quick Quote
              </Button>
            </div>
          </EditorialReveal>

          <p className="mt-8 text-xs leading-relaxed text-ink/50">
            Production fulfilled by {PARTNER.name}, our print &amp; signage partner. Quotes,
            design, and project management by 8th &amp; Exchange Media.{" "}
            <Link href="/services#print-signage" className="underline underline-offset-4">
              See the full service
            </Link>
            .
          </p>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Have artwork? Have <span className="text-navy">nothing yet</span>? Either works.
          </>
        }
        description="Send what you have — a file, a photo of the wall, a napkin sketch. Quick Quote pricing comes back within one business day."
        buttonText="Request a Quick Quote"
        href={QUOTE_HREF}
      />
    </PageShell>
  );
}
