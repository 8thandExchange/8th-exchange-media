import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent } from "@/components/editorial/Accent";
import { getService } from "@/lib/services";

const CHANNEL_SLUGS = ["email-marketing", "landing-pages", "social-media", "digital-ads"] as const;

export function ChannelsGrid() {
  const channels = CHANNEL_SLUGS.map((slug) => getService(slug)!).filter(Boolean);

  return (
    <section id="channels" className="scroll-mt-28 py-24 md:py-32">
      <div className="container-content">
        <EditorialReveal className="mx-auto mb-14 max-w-2xl text-center">
          <Eyebrow index="04" label="Channels" tone="light" className="mb-6" />
          <h2 className="type-h2">
            Reach people across{" "}
            <span className="text-navy">channels</span>.
          </h2>
          <p className="type-body mx-auto mt-6 text-ink/70">
            No matter where your customers are, we help you show up — consistently, and with one
            connected strategy behind every touchpoint.
          </p>
        </EditorialReveal>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {channels.map((svc, i) => (
            <EditorialReveal key={svc.slug} delay={(i % 4) * 0.08} className="text-center">
              <SpotIllustration
                src={svc.spot}
                alt={svc.spotAlt}
                label={svc.spotLabel}
                size={96}
                className="mx-auto"
              />
              <h3 className="type-h3 mt-5 text-navy">{svc.title}</h3>
              <p className="type-body mx-auto mt-3 text-sm text-ink/70">{svc.tagline}</p>
              <Link href={`/services#${svc.slug}`} className="editorial-link mt-4 inline-flex">
                Learn more
                <Accent kind="arrow" width={28} height={14} />
              </Link>
            </EditorialReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
