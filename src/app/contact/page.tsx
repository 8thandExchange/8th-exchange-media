import { Suspense } from "react";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { ContactFormFromParams } from "@/components/forms/ContactFormFromParams";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { Accent } from "@/components/editorial/Accent";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { CONTACT_EMAIL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Start a project with 8th & Exchange Media. Book a consultation for brand, web, video, and performance marketing.",
  path: "/contact",
  image: ILLUSTRATIONS.spots.contact ?? undefined,
});

export default function ContactPage() {
  return (
    <PageShell>
      <PageHero
        index="Start"
        label="Contact"
        title={
          <>
            Let&apos;s build something{" "}
            <span className="text-navy">worth keeping</span>.
          </>
        }
        description="Whether you need a full rebrand, a new website, or a performance marketing partner — tell us about your project and we'll be in touch within one business day."
        featureSrc={ILLUSTRATIONS.spots.contact}
        featureAlt="Hand-drawn envelope with antique gold wax seal"
        aspect="1/1"
      />

      <section className="py-20 md:py-28">
        <div className="container-content">
          <div className="grid gap-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <EditorialReveal>
              <Eyebrow index="Connect" label="Direct" tone="light" className="mb-6" />
              <h2 className="type-h2 max-w-lg">
                The success of your brand is one conversation away.
              </h2>
              <p className="type-body mt-6 text-ink/70">
                We respond to every serious inquiry within one business day. For urgent
                production needs, note your timeline in the message.
              </p>

              <div className="mt-12 space-y-8">
                <div>
                  <p className="eyebrow eyebrow-on-light mb-3">Email</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="font-display text-2xl italic text-navy underline decoration-navy/15 underline-offset-8 md:text-3xl"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
                <div>
                  <p className="eyebrow eyebrow-on-light mb-3">Location</p>
                  <p className="font-display text-xl italic text-navy">Augusta, Georgia</p>
                  <p className="mt-2 text-sm text-ink/50">Serving the Southeast & beyond</p>
                </div>
              </div>

              <div className="mt-12 flex items-center gap-3">
                <Accent kind="laurel" width={56} height={34} />
                <p className="max-w-xs text-sm italic text-ink/55">
                  Plainspoken conversations. No pitch decks required.
                </p>
              </div>
            </EditorialReveal>

            <EditorialReveal delay={0.12}>
              <Suspense fallback={<div className="min-h-[360px] border border-hairline-ink bg-paper" />}>
                <ContactFormFromParams
                  tone="light"
                  showPhone
                  showServiceSelect
                  submitLabel="Send inquiry"
                />
              </Suspense>
            </EditorialReveal>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
