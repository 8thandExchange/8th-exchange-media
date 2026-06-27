import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";

interface ServiceItem {
  tag: string;
  title: string;
  description: string;
  spot: string | null;
  spotAlt: string;
  spotLabel: string;
}

export function EditorialServiceGrid({ items }: { items: ServiceItem[] }) {
  return (
    <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <EditorialReveal key={item.title} delay={i * 0.08}>
          <article className="flex flex-col items-start gap-6">
            <SpotIllustration
              src={item.spot}
              alt={item.spotAlt}
              label={item.spotLabel}
              size={100}
            />
            <div>
              <p className="eyebrow eyebrow-on-light mb-3">{item.tag}</p>
              <h3 className="type-h3 text-navy">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.description}</p>
            </div>
            {i < items.length - 1 ? <HairlineReveal className="mt-2 w-full md:hidden" /> : null}
          </article>
        </EditorialReveal>
      ))}
    </div>
  );
}
