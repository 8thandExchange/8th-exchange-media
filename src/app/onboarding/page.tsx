import { PageShell } from "@/components/site/PageShell";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Get Started",
  description:
    "Tell us about your business in four quick steps and we'll build your marketing plan — branding, website, social, and advertising, all under one roof.",
  path: "/onboarding",
});

export default function OnboardingPage() {
  return (
    <PageShell>
      <section className="container-content py-14 md:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="eyebrow eyebrow-on-light mb-3">Get Started</p>
            <h1 className="font-display text-4xl text-navy md:text-5xl">
              Four steps. Then we take it from here.
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink/65">
              Tell us where your business is and where you want it to go. We&apos;ll come back
              within one business day with a plan — and your own client portal to watch it happen.
            </p>
          </div>
          <OnboardingWizard />
        </div>
      </section>
    </PageShell>
  );
}
