import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Accent } from "@/components/editorial/Accent";
import { ContactForm } from "@/components/forms/ContactForm";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { CONTACT_EMAIL } from "@/lib/site";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-28 bg-paper py-24 md:py-32">
      <div className="container-content">
        <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <EditorialReveal>
            <Eyebrow index="06" label="Start" tone="light" className="mb-6" />
            <h2 className="type-h2 max-w-md">
              The next chapter of your brand begins with{" "}
              <span className="text-navy">one conversation</span>.
            </h2>
            <p className="type-body mt-6 text-ink/70">
              Tell us where you are and where you want to go. We&apos;ll bring the strategy,
              creative, and media plan to get you there — with the discipline to make it last.
            </p>

            <div className="mt-10 flex items-start gap-6">
              <SpotIllustration
                src={ILLUSTRATIONS.spots.contact}
                alt="Hand-drawn envelope sealed with antique gold wax"
                size={110}
              />
              <div>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-display text-xl italic text-navy underline decoration-navy/15 underline-offset-8"
                >
                  {CONTACT_EMAIL}
                </a>
                <p className="mt-3 text-sm text-ink/50">Augusta, Georgia · Southeast & beyond</p>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-3">
              <Accent kind="laurel" width={64} height={38} />
              <p className="max-w-xs text-sm italic text-ink/60">
                &ldquo;We respond to every serious inquiry within one business day.&rdquo;
              </p>
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.12}>
            <ContactForm tone="light" showPhone showServiceSelect submitLabel="Send inquiry" />
          </EditorialReveal>
        </div>
      </div>
    </section>
  );
}
