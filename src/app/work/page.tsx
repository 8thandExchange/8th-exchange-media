import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand } from "@/components/site/CtaBand";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { WorkCover } from "@/components/editorial/WorkCover";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { pageMetadata } from "@/lib/seo";

const PROJECTS = [
  {
    title: "Hospitality Brand Launch",
    category: "Brand · Web · Content",
    src: ILLUSTRATIONS.work.cover1,
    alt: "Graded photograph of hospitality brand launch work",
  },
  {
    title: "Restaurant Group Digital",
    category: "Web · SEO · Social",
    src: ILLUSTRATIONS.work.cover2,
    alt: "Graded photograph of restaurant group digital work",
  },
  {
    title: "Commercial Construction",
    category: "Video · Drone · Print",
    src: ILLUSTRATIONS.work.cover3,
    alt: "Graded photograph of commercial construction work",
  },
  {
    title: "Retail Rebrand",
    category: "Identity · Signage · Campaign",
    src: ILLUSTRATIONS.work.cover4,
    alt: "Graded photograph of retail rebrand work",
  },
  {
    title: "Newsome Shearouse",
    category: "Web · Brand",
    src: null,
    alt: "Work cover placeholder",
  },
  {
    title: "Pour Taproom",
    category: "Social · Content · Video",
    src: null,
    alt: "Work cover placeholder",
  },
  {
    title: "Guardian Fencing",
    category: "Web · SEO · Print",
    src: null,
    alt: "Work cover placeholder",
  },
  {
    title: "Dink'd Pickleball",
    category: "Brand · Web · Social",
    src: null,
    alt: "Work cover placeholder",
  },
];

export const metadata = pageMetadata({
  title: "Work",
  description:
    "Selected portfolio of brand, web, video, and marketing work from 8th & Exchange Media.",
  path: "/work",
  image: ILLUSTRATIONS.features.hero,
});

export default function WorkPage() {
  return (
    <PageShell>
      <PageHero
        index="Portfolio"
        label="Work"
        title={
          <>
            Work that earns attention — and{" "}
            <span className="text-navy">results</span>.
          </>
        }
        description="A selection of brands we've helped build, launch, and grow across hospitality, retail, professional services, and beyond."
        featureSrc={ILLUSTRATIONS.features.hero}
        featureAlt="Hand-drawn editorial hero illustration on cream paper"
        aspect="3/2"
      />

      <section className="py-20 md:py-28">
        <div className="container-content">
          <EditorialReveal className="mb-14 max-w-2xl">
            <Eyebrow index="Selected" label="Projects" tone="light" className="mb-6" />
            <h2 className="type-h2">
              Hospitality, retail, and professional services.
            </h2>
          </EditorialReveal>

          <div className="grid gap-10 md:grid-cols-2">
            {PROJECTS.map((project, i) => (
              <EditorialReveal key={project.title} delay={(i % 4) * 0.08}>
                <WorkCover {...project} index={i + 1} href="/contact" />
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={
          <>
            Your brand belongs{" "}
            <span className="text-navy">here</span>.
          </>
        }
        buttonText="Start a Project"
      />
    </PageShell>
  );
}
