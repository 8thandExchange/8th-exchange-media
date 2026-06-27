import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { SpotIllustration } from "@/components/editorial/IllustrationFrame";
import { HairlineReveal } from "@/components/editorial/HairlineReveal";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { pageMetadata } from "@/lib/seo";

const SPOTS = [
  {
    spot: ILLUSTRATIONS.spots.svcBrand,
    label: "SVC BRAND",
    alt: "Hand-drawn creative workspace flat lay with camera, sketchbook, and pencils",
  },
  {
    spot: ILLUSTRATIONS.spots.svcWeb,
    label: "SVC WEB",
    alt: "Hand-drawn browser window with upward trend line",
  },
  {
    spot: ILLUSTRATIONS.spots.svcContent,
    label: "SVC CONTENT",
    alt: "Hand-drawn speech bubbles and smartphone for content and social",
  },
  {
    spot: ILLUSTRATIONS.spots.svcSearch,
    label: "SVC SEARCH",
    alt: "Hand-drawn magnifying glass with upward trend arrow",
  },
  {
    spot: ILLUSTRATIONS.spots.svcVideo,
    label: "SVC VIDEO",
    alt: "Hand-drawn vintage film camera on a tripod",
  },
  {
    spot: ILLUSTRATIONS.spots.svcDrone,
    label: "SVC DRONE",
    alt: "Hand-drawn quadcopter drone with camera gimbal",
  },
  {
    spot: ILLUSTRATIONS.spots.svcPrint,
    label: "SVC PRINT",
    alt: "Hand-drawn framed artwork with gallery plaque for print and signage",
  },
  {
    spot: ILLUSTRATIONS.spots.svcTours,
    label: "SVC TOURS",
    alt: "Hand-drawn 360-degree camera on a tripod with rotation arrow",
  },
];

const SERVICES = [
  {
    title: "Brand Strategy & Identity",
    description:
      "Positioning, naming, visual identity systems, brand guidelines, and messaging frameworks. We build brands with a voice that is unmistakably yours.",
    deliverables: ["Brand audits", "Identity systems", "Style guides", "Messaging frameworks"],
  },
  {
    title: "Web Design & Development",
    description:
      "Custom websites engineered for performance, accessibility, and conversion. From landing pages to complex platforms — built to serve the business.",
    deliverables: ["Custom web design", "E-commerce", "CMS integration", "Hosting & maintenance"],
  },
  {
    title: "Social Media Marketing",
    description:
      "Organic growth strategies and paid social campaigns across every major platform. Content calendars, community management, and influencer partnerships.",
    deliverables: ["Content creation", "Paid social ads", "Community management", "Analytics"],
  },
  {
    title: "Search Engine Marketing",
    description:
      "Technical SEO, local search, paid search campaigns, and ongoing optimization. Transparent reporting tied to rankings, traffic, and revenue.",
    deliverables: ["Technical SEO", "Local SEO", "Google Ads", "Performance reporting"],
  },
  {
    title: "Video Production",
    description:
      "Commercial video, brand films, social content, and event coverage. Full production from concept and scripting through filming, editing, and delivery.",
    deliverables: ["Commercial video", "Brand films", "Social content", "Post-production"],
  },
  {
    title: "Drone & Aerial Imagery",
    description:
      "FAA-certified drone services for real estate, hospitality, construction, events, and brand storytelling. 4K aerial video and photography.",
    deliverables: ["Aerial photography", "4K video", "Indoor flight", "Virtual tours"],
  },
  {
    title: "Print, Signage & Graphics",
    description:
      "Custom vinyl decals, vehicle wraps, heat-transfer graphics, large-format printing, and environmental branding for physical spaces.",
    deliverables: ["Vinyl graphics", "Vehicle wraps", "Signage", "Print collateral"],
  },
  {
    title: "360° Virtual Tours",
    description:
      "Immersive virtual experiences for real estate, hospitality, and retail. Let your audience walk through your space before they arrive.",
    deliverables: ["Matterport tours", "Embedded web tours", "Google integration", "VR-ready exports"],
  },
];

export const metadata = pageMetadata({
  title: "Services",
  description:
    "Full-service media capabilities — brand strategy, web, social, search, video, drone, print, and immersive experiences.",
  path: "/services",
  image: ILLUSTRATIONS.features.studio,
});

export default function ServicesPage() {
  return (
    <PageShell>
      <PageHero
        index="Capabilities"
        label="Services"
        title={
          <>
            Full-service media,{" "}
            <span className="text-navy">end to end</span>.
          </>
        }
        description="One studio. Every discipline. From the first strategic conversation to the final deliverable — strategy, creative, production, and performance under one roof."
        featureSrc={ILLUSTRATIONS.features.studio}
        featureAlt="Hand-drawn fountain pen and compass on cream paper"
        aspect="4/3"
      />

      <section className="py-20 md:py-28">
        <div className="container-content space-y-20 md:space-y-24">
          {SERVICES.map((service, i) => (
            <EditorialReveal key={service.title} delay={(i % 3) * 0.08}>
              <article className="grid items-start gap-8 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-10 lg:gap-14">
                <SpotIllustration
                  src={SPOTS[i]?.spot ?? null}
                  alt={SPOTS[i]?.alt ?? service.title}
                  label={SPOTS[i]?.label ?? "SERVICE"}
                  size={104}
                  className="mx-auto sm:mx-0"
                />
                <div className="min-w-0 text-center sm:text-left">
                  <p className="eyebrow eyebrow-on-light mb-3">
                    {String(i + 1).padStart(2, "0")}
                  </p>
                  <h2 className="type-h3 text-navy">{service.title}</h2>
                  <p className="type-body mt-4 text-ink/70">{service.description}</p>
                  <ul className="mt-6 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {service.deliverables.map((d) => (
                      <li
                        key={d}
                        className="border border-navy/12 px-3 py-1.5 text-xs font-medium text-ink/60"
                      >
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
              {i < SERVICES.length - 1 ? <HairlineReveal className="mt-20 md:mt-24" /> : null}
            </EditorialReveal>
          ))}
        </div>
      </section>

      <CtaBand
        title={
          <>
            Not sure where to{" "}
            <span className="text-navy">start</span>?
          </>
        }
        description="Book a consultation. We'll review your current presence and map a path forward."
        buttonText="Book a Consultation"
      />
    </PageShell>
  );
}
