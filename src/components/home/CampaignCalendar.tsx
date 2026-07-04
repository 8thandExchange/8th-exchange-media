import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { AccentUnderline } from "@/components/editorial/Accent";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

/** Sparse map of day → campaign chip for the mock month */
const EVENTS: Record<number, { label: string; tone: "gold" | "navy" | "outline" }> = {
  2: { label: "Email · June promo", tone: "navy" },
  5: { label: "Social · Reel", tone: "outline" },
  9: { label: "SMS · Flash sale", tone: "gold" },
  12: { label: "Ads · Retargeting", tone: "outline" },
  16: { label: "Email · Newsletter", tone: "navy" },
  19: { label: "Shoot day", tone: "gold" },
  24: { label: "Social · Launch", tone: "outline" },
  27: { label: "Email · Win-back", tone: "navy" },
};

const CHIP_TONES = {
  gold: "bg-gold/25 text-navy",
  navy: "bg-navy text-cream",
  outline: "border border-navy/25 text-ink/70",
};

function CalendarCard() {
  return (
    <div className="border-hairline bg-paper p-5 shadow-[0_24px_64px_-32px_rgba(11,27,61,0.3)] md:p-7">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="font-display text-lg italic text-navy">June</p>
        <p className="eyebrow text-[0.5625rem] text-ink/45">Campaign calendar</p>
      </div>
      <div className="grid grid-cols-7 gap-px bg-navy/10 text-center">
        {DAY_LABELS.map((d, i) => (
          <div key={`${d}${i}`} className="bg-paper py-2">
            <span className="eyebrow text-[0.5625rem] text-ink/40">{d}</span>
          </div>
        ))}
        {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
          const event = EVENTS[day];
          return (
            <div key={day} className="flex min-h-14 flex-col items-start gap-1 bg-paper p-1.5 text-left md:min-h-16">
              <span className="text-[0.625rem] text-ink/45">{day}</span>
              {event ? (
                <span
                  className={`w-full truncate px-1 py-0.5 text-[0.5rem] font-semibold leading-tight md:text-[0.5625rem] ${CHIP_TONES[event.tone]}`}
                >
                  {event.label}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CampaignCalendar() {
  return (
    <section className="border-y border-navy/8 bg-paper py-24 md:py-32">
      <div className="container-content">
        <div className="grid items-center gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <EditorialReveal>
            <Eyebrow index="05" label="One Plan" tone="light" className="mb-6" />
            <h2 className="type-h2 max-w-md">
              See it all <AccentUnderline>come together</AccentUnderline>.
            </h2>
            <p className="type-body mt-8 text-ink/70">
              Every email, text, post, ad, and shoot lives on one shared campaign calendar — so
              you always know what&apos;s going out, when, and why. One plan, every channel,
              no surprises.
            </p>
          </EditorialReveal>

          <EditorialReveal delay={0.12}>
            <CalendarCard />
          </EditorialReveal>
        </div>
      </div>
    </section>
  );
}
