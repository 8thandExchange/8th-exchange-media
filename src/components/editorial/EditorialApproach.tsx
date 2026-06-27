import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";

interface Step {
  num: string;
  title: string;
  body: string;
  spot: string | null;
  spotAlt: string;
  spotLabel: string;
}

export function EditorialApproach({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => (
        <li key={step.num}>
          <EditorialReveal delay={i * 0.1}>
            <div className="grid gap-8 py-10 md:grid-cols-[100px_1fr] md:gap-12">
              <SpotIllustration
                src={step.spot}
                alt={step.spotAlt}
                label={step.spotLabel}
                size={88}
                className="mx-auto md:mx-0"
              />
              <div>
                <p className="eyebrow eyebrow-on-light mb-2">{step.num}</p>
                <h3 className="font-display text-2xl italic text-navy">{step.title}</h3>
                <p className="mt-4 max-w-prose text-ink/70">{step.body}</p>
              </div>
            </div>
          </EditorialReveal>
          {i < steps.length - 1 ? <HairlineReveal /> : null}
        </li>
      ))}
    </ol>
  );
}
