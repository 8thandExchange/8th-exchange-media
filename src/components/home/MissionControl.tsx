import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent } from "@/components/editorial/Accent";
import { ILLUSTRATIONS } from "@/lib/illustrations";

const BLOCKS = [
  {
    num: "01",
    title: "Start with your audience",
    body: "We organize your contacts into one clean, segmented view — so you can turn what you know about your customers into campaigns that feel personal.",
    bullets: ["CRM setup & segmentation", "Signup forms & lead capture", "Behavioral targeting"],
    href: "/services#audience",
    cta: "Audience & CRM services",
    spot: ILLUSTRATIONS.spots.step1,
    spotAlt: "Hand-drawn ear with sound wave for listening",
    spotLabel: "AUDIENCE",
  },
  {
    num: "02",
    title: "Create content, your way",
    body: "A full studio behind every campaign — template systems, copywriting, design, photography, and film that keep everything on brand without slowing you down.",
    bullets: ["Email & landing templates", "Copywriting & design", "Video, photo & aerial"],
    href: "/services#creative",
    cta: "Creative studio services",
    spot: ILLUSTRATIONS.spots.step3,
    spotAlt: "Hand-drawn crossed paintbrush and pencil",
    spotLabel: "CREATE",
  },
  {
    num: "03",
    title: "More sales, less effort",
    body: "Automated journeys do the following up for you — welcome series, cart recovery, win-backs, and retargeting that quietly compound while you run the business.",
    bullets: ["Customer journeys", "Cart & browse recovery", "Always-on retargeting"],
    href: "/services#automation",
    cta: "Automation services",
    spot: ILLUSTRATIONS.spots.step2,
    spotAlt: "Hand-drawn treasure map with path to an X mark",
    spotLabel: "AUTOMATE",
  },
  {
    num: "04",
    title: "Get smarter as you go",
    body: "Every campaign reports back to one dashboard. We benchmark, attribute revenue, and tell you in plain language what worked and where the next dollar should go.",
    bullets: ["Unified reporting", "Revenue attribution", "Monthly strategy reviews"],
    href: "/services#insights",
    cta: "Analytics & insights",
    spot: ILLUSTRATIONS.spots.step4,
    spotAlt: "Hand-drawn rocket with dashed flight trail",
    spotLabel: "LEARN",
  },
];

export function MissionControl() {
  return (
    <section id="mission-control" className="scroll-mt-28 py-24 md:py-32">
      <div className="container-content">
        <EditorialReveal className="mb-16 max-w-2xl">
          <Eyebrow index="06" label="How We Work" tone="light" className="mb-6" />
          <h2 className="type-h2">
            Mission control for your{" "}
            <span className="text-navy">marketing</span>.
          </h2>
          <p className="type-body mt-6 text-ink/70">
            One team acting as your marketing department — audience, creative, automation, and
            analytics working together instead of in silos.
          </p>
        </EditorialReveal>

        <div className="space-y-16 md:space-y-20">
          {BLOCKS.map((block, i) => (
            <EditorialReveal key={block.num}>
              <article className="grid items-start gap-8 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[7rem_minmax(0,1fr)_minmax(0,0.6fr)] lg:gap-14">
                <SpotIllustration
                  src={block.spot}
                  alt={block.spotAlt}
                  label={block.spotLabel}
                  size={104}
                  className="mx-auto sm:mx-0"
                />
                <div className="min-w-0 text-center sm:text-left">
                  <p className="eyebrow eyebrow-on-light mb-3">{block.num}</p>
                  <h3 className="type-h3 text-navy">{block.title}</h3>
                  <p className="type-body mt-4 text-ink/70">{block.body}</p>
                  <Link href={block.href} className="editorial-link mt-5 inline-flex">
                    {block.cta}
                    <Accent kind="arrow" width={28} height={14} />
                  </Link>
                </div>
                <ul className="hidden space-y-3 border-l border-navy/10 pl-6 lg:block">
                  {block.bullets.map((b) => (
                    <li key={b} className="text-sm text-ink/65">
                      {b}
                    </li>
                  ))}
                </ul>
              </article>
              {i < BLOCKS.length - 1 ? <HairlineReveal className="mt-16 md:mt-20" /> : null}
            </EditorialReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
