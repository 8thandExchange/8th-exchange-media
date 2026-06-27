import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Button } from "@/components/ui/Button";
import { Accent } from "@/components/editorial/Accent";

interface CtaBandProps {
  title: React.ReactNode;
  description?: string;
  buttonText?: string;
  href?: string;
}

export function CtaBand({
  title,
  description,
  buttonText = "Start a Project",
  href = "/contact",
}: CtaBandProps) {
  return (
    <section className="border-t border-navy/10 bg-paper py-20 md:py-24">
      <div className="container-content text-center">
        <EditorialReveal>
          <h2 className="type-h2 mx-auto max-w-2xl">{title}</h2>
          {description ? (
            <p className="type-body mx-auto mt-5 max-w-lg text-ink/65">{description}</p>
          ) : null}
          <div className="mt-8 flex justify-center">
            <Button href={href} tone="light" pill>
              {buttonText}
            </Button>
          </div>
          <div className="mt-8 flex justify-center opacity-60">
            <Accent kind="asterisk" width={20} height={20} />
          </div>
        </EditorialReveal>
      </div>
    </section>
  );
}
