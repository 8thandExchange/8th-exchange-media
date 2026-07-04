import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

const PILLARS = [
  {
    title: "A dedicated team",
    body: "A real account lead who knows your business, answers the same day, and owns the plan — not a ticket queue.",
  },
  {
    title: "Transparent reporting",
    body: "You see what we see: one dashboard, revenue attribution, and a monthly review in plain language.",
  },
  {
    title: "Expert guidance",
    body: "Strategy included, always. We tell you what to run and what to skip — even when that means selling you less.",
  },
];

export function SupportTrio() {
  return (
    <section className="border-t border-navy/8 bg-paper py-24 md:py-32">
      <div className="container-content">
        <EditorialReveal className="mx-auto mb-14 max-w-2xl text-center">
          <Eyebrow index="10" label="Partnership" tone="light" className="mb-6" />
          <h2 className="type-h2">
            Keep pushing forward.{" "}
            <span className="text-navy">We&apos;ve got your back</span>.
          </h2>
        </EditorialReveal>

        <div className="grid gap-8 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <EditorialReveal key={p.title} delay={i * 0.08}>
              <div className="border-hairline h-full bg-cream p-8">
                <h3 className="type-h3 text-navy">{p.title}</h3>
                <p className="type-body mt-3 text-ink/70">{p.body}</p>
              </div>
            </EditorialReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
