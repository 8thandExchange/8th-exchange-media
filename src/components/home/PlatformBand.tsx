import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent } from "@/components/editorial/Accent";

const STACK = [
  "Mailchimp",
  "Klaviyo",
  "HubSpot",
  "Meta Ads",
  "Google Ads",
  "Shopify",
  "Stripe",
  "GA4",
];

export function PlatformBand() {
  return (
    <section className="surface-navy py-20 md:py-28">
      <div className="container-content relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
          <EditorialReveal>
            <Eyebrow index="07" label="Your Stack, Handled" tone="dark" className="mb-6" />
            <h2 className="type-h2 !text-cream max-w-xl">
              A powerful partner that&apos;s{" "}
              <span className="pivot-on-dark">easy to work with</span>.
            </h2>
            <p className="type-body mt-6 text-cream/70">
              We work inside the platforms you already use — or set up the right ones for you —
              and connect your store, CRM, and analytics so data flows where it should. You get
              one point of contact and a stack that simply works.
            </p>
            <Link
              href="/services#integrations"
              className="editorial-link mt-8 inline-flex !text-cream"
            >
              Integrations &amp; data services
              <Accent kind="arrow" width={32} height={16} />
            </Link>
          </EditorialReveal>

          <EditorialReveal delay={0.12}>
            <ul className="grid grid-cols-2 gap-px bg-cream/10">
              {STACK.map((tool) => (
                <li
                  key={tool}
                  className="flex items-center justify-center bg-navy px-4 py-6 text-center"
                >
                  <span className="eyebrow text-[0.6875rem] text-cream/75">{tool}</span>
                </li>
              ))}
            </ul>
          </EditorialReveal>
        </div>
      </div>
    </section>
  );
}
