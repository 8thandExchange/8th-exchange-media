import Link from "next/link";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Accent, AccentUnderline } from "@/components/editorial/Accent";

const JOURNEY_STEPS = [
  { kind: "trigger", label: "Trigger", detail: "New customer joins your audience" },
  { kind: "action", label: "Email · Day 0", detail: "Welcome — meet the brand" },
  { kind: "branch", label: "If opened", detail: "SMS · Day 2 — first-purchase offer" },
  { kind: "branch", label: "If not opened", detail: "Email · Day 3 — resend with new subject" },
  { kind: "action", label: "Day 7", detail: "Retargeting ads follow up across social" },
];

function JourneyCard() {
  return (
    <div className="border-hairline bg-paper p-6 shadow-[0_24px_64px_-32px_rgba(11,27,61,0.3)] md:p-8">
      <p className="eyebrow eyebrow-on-light mb-5">Customer journey — welcome series</p>
      <ol className="relative space-y-4">
        <span
          aria-hidden
          className="absolute bottom-4 left-[0.4375rem] top-2 w-px bg-navy/15"
        />
        {JOURNEY_STEPS.map((step) => (
          <li key={step.detail} className="relative flex items-start gap-4 pl-6">
            <span
              aria-hidden
              className={
                step.kind === "trigger"
                  ? "absolute left-0 top-1.5 h-[0.9375rem] w-[0.9375rem] rounded-full border-2 border-gold-dark bg-gold"
                  : "absolute left-[3px] top-2 h-[0.5625rem] w-[0.5625rem] rounded-full border border-navy/40 bg-cream"
              }
            />
            <div>
              <p className="eyebrow text-[0.5625rem] text-gold-dark">{step.label}</p>
              <p className="mt-0.5 text-sm text-ink/80">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RightMoment() {
  return (
    <section id="automation" className="scroll-mt-28 py-24 md:py-32">
      <div className="container-content">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <EditorialReveal>
            <Eyebrow index="02" label="Automation" tone="light" className="mb-6" />
            <h2 className="type-h2 max-w-lg">
              Deliver the right message at{" "}
              <AccentUnderline>the right moment</AccentUnderline>.
            </h2>
            <p className="type-body mt-8 text-ink/70">
              We design customer journeys that run themselves — welcome a new subscriber, recover
              an abandoned cart, win back a lapsed customer. Built once by our team, tested and
              tuned every month, earning while you sleep.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <Link href="/services#marketing-automation" className="editorial-link">
                Explore automation
                <Accent kind="arrow" width={32} height={16} />
              </Link>
              <Link href="/services#transactional" className="editorial-link">
                Triggered messaging
                <Accent kind="arrow" width={32} height={16} />
              </Link>
            </div>
          </EditorialReveal>

          <EditorialReveal delay={0.12}>
            <JourneyCard />
          </EditorialReveal>
        </div>
      </div>
    </section>
  );
}
