import Image from "next/image";
import Link from "next/link";
import { EditorialReveal, EditorialStagger } from "@/components/editorial/EditorialReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent } from "@/components/editorial/Accent";

const GALLERY = [
  { src: "/img/home/brand-strategy.jpg", alt: "Brand identity system spread on a worktable", label: "Identity" },
  { src: "/img/home/web-experience.jpg", alt: "Website design displayed across devices", label: "Web & landing pages" },
  { src: "/img/home/social-campaign.jpg", alt: "Social campaign content in production", label: "Campaign creative" },
  { src: "/img/home/video-set.jpg", alt: "Video production set with cinema camera", label: "Film & video" },
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

        <EditorialStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" stagger={0.08}>
          {GALLERY.map((item) => (
            <figure key={item.src} className="group">
              <div className="border-hairline relative aspect-[3/4] overflow-hidden bg-cream">
                <Image
                  src={item.src}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <figcaption className="eyebrow mt-3 text-[0.625rem] text-ink/55">{item.label}</figcaption>
            </figure>
          ))}
        </EditorialStagger>

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
