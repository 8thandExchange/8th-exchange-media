import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent } from "@/components/editorial/Accent";
import { ILLUSTRATIONS } from "@/lib/illustrations";

const GALLERY = [
  {
    spot: ILLUSTRATIONS.spots.svcBrand,
    alt: "Hand-drawn creative workspace flat lay with camera and sketchbook",
    label: "Identity",
    caption: "Brand systems & guidelines",
  },
  {
    spot: ILLUSTRATIONS.spots.svcWeb,
    alt: "Hand-drawn browser window with upward trend line",
    label: "Web & landing pages",
    caption: "Built to convert",
  },
  {
    spot: ILLUSTRATIONS.spots.svcContent,
    alt: "Hand-drawn speech bubbles and smartphone",
    label: "Campaign creative",
    caption: "Email, social & ad assets",
  },
  {
    spot: ILLUSTRATIONS.spots.svcVideo,
    alt: "Hand-drawn vintage film camera on a tripod",
    label: "Film & video",
    caption: "Concept through final cut",
  },
];

export function CreativeShowcase() {
  return (
    <section id="creative" className="scroll-mt-28 border-y border-navy/8 bg-paper py-24 md:py-32">
      <div className="container-content">
        <EditorialReveal className="mx-auto mb-14 max-w-2xl text-center">
          <Eyebrow index="03" label="Creative Studio" tone="light" className="mb-6" />
          <h2 className="type-h2">
            Beautiful creative that lets your brand{" "}
            <span className="text-navy">shine</span>.
          </h2>
          <p className="type-body mx-auto mt-6 text-ink/70">
            Template systems, ad creative, photography, and film — produced by a full studio, so
            every send, post, and page looks unmistakably like you.
          </p>
        </EditorialReveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {GALLERY.map((item, i) => (
            <EditorialReveal key={item.label} delay={(i % 4) * 0.08}>
              <figure className="group">
                <div className="border-hairline flex aspect-[3/4] flex-col items-center justify-center gap-6 bg-cream p-8 transition-colors duration-500 group-hover:bg-cream/60">
                  <SpotIllustration src={item.spot} alt={item.alt} size={128} />
                  <p className="eyebrow text-center text-[0.5625rem] text-ink/45">{item.caption}</p>
                </div>
                <figcaption className="eyebrow mt-3 text-[0.625rem] text-ink/55">
                  {item.label}
                </figcaption>
              </figure>
            </EditorialReveal>
          ))}
        </div>

        <EditorialReveal delay={0.1} className="mt-12 text-center">
          <Link href="/services#creative" className="editorial-link">
            See the creative studio
            <Accent kind="arrow" width={32} height={16} />
          </Link>
        </EditorialReveal>
      </div>
    </section>
  );
}
