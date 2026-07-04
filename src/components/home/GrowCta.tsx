import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Button } from "@/components/ui/Button";

/** Full-width gold call-to-action band — the closing "Ready to grow?" moment. */
export function GrowCta() {
  return (
    <section className="bg-gold py-20 md:py-24">
      <div className="container-content text-center">
        <EditorialReveal>
          <h2 className="type-h2 mx-auto max-w-2xl !text-navy">
            Ready to grow your business?
          </h2>
          <p className="type-body mx-auto mt-5 max-w-lg text-navy/75">
            Tell us where you are and where you want to go. We&apos;ll bring the plan.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button href="#contact" tone="light" pill className="!border-navy">
              Start a Project
            </Button>
            <Button href="/services" tone="light" className="!border-navy">
              Explore Services
            </Button>
          </div>
        </EditorialReveal>
      </div>
    </section>
  );
}
