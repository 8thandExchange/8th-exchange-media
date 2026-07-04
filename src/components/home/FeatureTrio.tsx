import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Accent } from "@/components/editorial/Accent";

const FEATURES = [
  {
    title: "One partner",
    body: "Strategy, creative, channels, and reporting under one roof — no juggling vendors, no gaps between them.",
    href: "/services",
    cta: "See how it works",
  },
  {
    title: "Launch faster",
    body: "Template systems, a content library, and a team on call turn campaign ideas into live sends in days, not months.",
    href: "/services#creative",
    cta: "Explore the studio",
  },
  {
    title: "Generate demand",
    body: "Automated journeys and always-on ads keep finding new customers — and bringing back the ones who almost bought.",
    href: "/services#automation",
    cta: "Explore automation",
  },
];

export function FeatureTrio() {
  return (
    <section className="border-b border-navy/8 bg-paper">
      <div className="container-content">
        <div className="grid divide-y divide-navy/8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {FEATURES.map((f, i) => (
            <EditorialReveal key={f.title} delay={i * 0.08} className="py-10 md:px-8 md:py-12 md:first:pl-0 md:last:pr-0">
              <h3 className="type-h3 text-navy">{f.title}</h3>
              <p className="type-body mt-3 text-ink/70">{f.body}</p>
              <Link href={f.href} className="editorial-link mt-5 inline-flex">
                {f.cta}
                <Accent kind="arrow" width={28} height={14} />
              </Link>
            </EditorialReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
