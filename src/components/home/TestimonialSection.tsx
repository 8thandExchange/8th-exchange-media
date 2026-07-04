import Image from "next/image";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Accent } from "@/components/editorial/Accent";
import { ILLUSTRATIONS } from "@/lib/illustrations";

export function TestimonialSection() {
  return (
    <section className="surface-navy py-20 md:py-28">
      <div className="container-content relative">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <EditorialReveal>
            <div className="border border-cream/15 bg-cream p-5 md:p-6">
              <div className="relative aspect-[4/3]">
                <Image
                  src={ILLUSTRATIONS.features.family}
                  alt="Hand-drawn row of traditional buildings on cream paper"
                  fill
                  sizes="(max-width: 1024px) 100vw, 36rem"
                  className="object-cover object-center"
                />
              </div>
              <p className="eyebrow mt-4 text-center text-[0.5625rem] text-ink/45">
                Hospitality group · Augusta, GA
              </p>
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.12}>
            <Accent kind="laurel" width={72} height={42} className="opacity-70" />
            <blockquote className="mt-6">
              <p className="font-display text-2xl italic leading-relaxed text-cream md:text-3xl">
                &ldquo;With 8th &amp; Exchange, we can finally see what messaging worked — for
                email, for social, for ads — and apply those learnings everywhere. It&apos;s one
                team, one plan, and it saves us time every single week.&rdquo;
              </p>
              <footer className="mt-8">
                <p className="eyebrow eyebrow-on-dark">Managing Partner</p>
                <p className="mt-1 text-sm text-cream/60">Hospitality group · Augusta, GA</p>
              </footer>
            </blockquote>
          </EditorialReveal>
        </div>
      </div>
    </section>
  );
}
