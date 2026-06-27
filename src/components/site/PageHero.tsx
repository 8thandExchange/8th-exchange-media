import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { AccentUnderline } from "@/components/editorial/Accent";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { FeatureIllustration } from "@/components/editorial/IllustrationFrame";

interface PageHeroProps {
  index: string;
  label: string;
  title: React.ReactNode;
  description: string;
  featureSrc?: string | null;
  featureAlt?: string;
  featureLabel?: string;
  aspect?: string;
}

export function PageHero({
  index,
  label,
  title,
  description,
  featureSrc,
  featureAlt,
  featureLabel,
  aspect = "21/9",
}: PageHeroProps) {
  return (
    <section className="border-b border-navy/8 bg-cream pb-16 pt-4 md:pb-20">
      <div className="container-content">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-end lg:gap-16">
          <EditorialReveal>
            <Eyebrow index={index} label={label} tone="light" className="mb-6" />
            <h1 className="type-display max-w-xl">{title}</h1>
            <p className="type-lead mt-6 max-w-lg text-ink/70">{description}</p>
          </EditorialReveal>

          {featureSrc ? (
            <EditorialReveal delay={0.1}>
              <FeatureIllustration src={featureSrc} alt={featureAlt ?? ""} aspect={aspect} />
            </EditorialReveal>
          ) : featureLabel ? (
            <EditorialReveal delay={0.1}>
              <div
                className="flex aspect-[4/3] items-center justify-center border border-dashed border-navy/15 bg-paper"
              >
                <span className="eyebrow text-ink/35">{featureLabel}</span>
              </div>
            </EditorialReveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function PageIntro({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <EditorialReveal>
      <Eyebrow index="" label={eyebrow} tone="light" className="mb-4" />
      <h2 className="type-h2 max-w-2xl">
        <AccentUnderline>{title}</AccentUnderline>
      </h2>
      <div className="type-body mt-6 space-y-4 text-ink/70">{children}</div>
    </EditorialReveal>
  );
}
