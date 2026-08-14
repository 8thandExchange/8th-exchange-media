import Link from "next/link";
import { PageShell } from "@/components/site/PageShell";
import { PageHero } from "@/components/site/PageHero";
import { EditorialReveal } from "@/components/editorial/EditorialReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Button } from "@/components/ui/Button";
import { Accent } from "@/components/editorial/Accent";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "The Growth Map",
  description:
    "A free 30-minute strategy session. We audit your ads, funnel, and follow-up before the call — you leave with a written 90-day growth map, whether or not you hire us.",
  path: "/growth-map",
  image: ILLUSTRATIONS.features.studio,
});

/**
 * The signature offer page (docs/MARKETING_PLAYBOOK.md — the Godfather Offer).
 * Long-form by design: promise → problem → what you get → why free →
 * how it works → who it's for → proof → the deal → one CTA, repeated.
 * Every claim on this page must stay literally true.
 */

const DELIVERABLES = [
  {
    title: "The pre-call audit",
    body: "Before we ever speak, we go through what you're running today — your ads, your website's path from visitor to customer, and what happens after someone reaches out. Most of what we find, owners have never seen written down.",
  },
  {
    title: "The 30-minute session",
    body: "A working call, not a pitch. We walk through what the audit found, ask the questions the numbers can't answer, and decide together what the next 90 days should look like.",
  },
  {
    title: "The written Growth Map",
    body: "A one-page, prioritized 90-day plan — what to fix first, what to test next, what to stop paying for. It's written to be executed by anyone: us, your team, or another agency. It's yours either way.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Apply",
    body: "Five minutes of questions about your business, your goals, and your budget. It saves the call for strategy instead of background.",
  },
  {
    n: "02",
    title: "We do the homework",
    body: "We audit your ads, funnel, and follow-up before the session — so the call starts at the interesting part.",
  },
  {
    n: "03",
    title: "Session + map",
    body: "Thirty minutes together, then the written Growth Map lands in your inbox. Hire us to run it, or run it yourself.",
  },
];

export default function GrowthMapPage() {
  return (
    <PageShell>
      <PageHero
        index="The Offer"
        label="Growth Map"
        title={
          <>
            Know exactly where your next 90 days of <span className="text-navy">growth</span>{" "}
            come from.
          </>
        }
        description="A free 30-minute strategy session for owners who are done guessing. We audit your ads, funnel, and follow-up before the call — and you leave with a written 90-day growth map, whether or not you ever hire us."
        featureSrc={ILLUSTRATIONS.features.studio}
        featureAlt="Hand-drawn compass and fountain pen on cream paper"
        aspect="4/3"
      />

      {/* The problem */}
      <section className="py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="max-w-2xl">
            <Eyebrow index="01" label="The problem" tone="light" className="mb-5" />
            <h2 className="type-h2">Most marketing isn&apos;t failing. It&apos;s unaccountable.</h2>
            <p className="type-body mt-5 text-ink/70">
              Money goes out — to ads, to a website refresh, to whoever posts on social — and
              revenue comes in, and nobody can say with a straight face which caused which. So
              the budget gets set by feel, the agency gets judged by vibes, and every quarter
              starts with the same conversation.
            </p>
            <p className="type-body mt-4 text-ink/70">
              The fix isn&apos;t more spend. It&apos;s a map: what each piece of your funnel does
              today, what it costs you, and the shortest ordered list of changes that moves
              revenue. That&apos;s the thing we make.
            </p>
          </EditorialReveal>
        </div>
      </section>

      {/* What you get */}
      <section className="border-y border-navy/8 bg-paper py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="mb-12 max-w-2xl">
            <Eyebrow index="02" label="What you get" tone="light" className="mb-5" />
            <h2 className="type-h2">Three deliverables. Zero dollars.</h2>
          </EditorialReveal>
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {DELIVERABLES.map((d, i) => (
              <EditorialReveal key={d.title} delay={i * 0.06}>
                <article>
                  <h3 className="type-h3">{d.title}</h3>
                  <p className="type-body mt-3 text-ink/70">{d.body}</p>
                </article>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Why free */}
      <section className="py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="max-w-2xl">
            <Eyebrow index="03" label="Why free" tone="light" className="mb-5" />
            <h2 className="type-h2">Because it&apos;s the best sales pitch we have.</h2>
            <p className="type-body mt-5 text-ink/70">
              An agency can tell you it&apos;s good, or it can show you. The session is how we
              show you: if the audit finds nothing useful, you&apos;ve lost half an hour; if it
              finds what it usually finds, you&apos;ll know exactly what working with us would be
              like — because you&apos;ll be holding a piece of the work.
            </p>
            <p className="type-body mt-4 text-ink/70">
              No obligation, and no hard close at the end. The map is written to stand on its
              own. Some owners run it themselves. The ones who&apos;d rather hand it to the
              people who wrote it — that&apos;s who we end up working with.
            </p>
          </EditorialReveal>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-navy/8 bg-paper py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="mb-12 max-w-2xl">
            <Eyebrow index="04" label="How it works" tone="light" className="mb-5" />
            <h2 className="type-h2">Three steps, one week.</h2>
          </EditorialReveal>
          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <EditorialReveal key={s.n} delay={i * 0.06}>
                <article>
                  <div className="eyebrow text-gold-dark">{s.n}</div>
                  <h3 className="type-h3 mt-2">{s.title}</h3>
                  <p className="type-body mt-3 text-ink/70">{s.body}</p>
                </article>
              </EditorialReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for + proof + the deal */}
      <section className="py-20 md:py-24">
        <div className="container-content">
          <EditorialReveal className="max-w-2xl">
            <Eyebrow index="05" label="The fine print" tone="light" className="mb-5" />
            <h2 className="type-h2">Who this is for — and the honest terms.</h2>
            <p className="type-body mt-5 text-ink/70">
              It&apos;s for owners and operators with a real business and a real growth goal —
              the application asks about both, and we read every one. It is not for anyone
              shopping for the cheapest logo. We practice what we map: the same funnel
              system runs across the 8th &amp; Exchange family of brands — construction,
              healthcare, hospitality, and sport — and this agency&apos;s own marketing is built
              on it too.
            </p>
            <p className="type-body mt-4 text-ink/70">
              We take on a limited number of new clients each quarter — strategy sessions are
              scheduled in the order applications arrive, and when the quarter&apos;s client
              slots are filled, new engagements start in the next one. The session and the map
              stay yours regardless.
            </p>
          </EditorialReveal>

          <EditorialReveal className="mt-12">
            <div className="flex flex-wrap items-center gap-5">
              <Button href="/onboarding" tone="light" pill>
                Apply for your Growth Map
              </Button>
              <Link href="/work" className="nav-link">
                See the work first
              </Link>
            </div>
            <p className="type-body mt-6 max-w-xl text-sm text-ink/55">
              P.S. — The application takes about five minutes, and the worst case is a free,
              written second opinion on your marketing from people who do this all day.
            </p>
            <div className="mt-10 flex opacity-60">
              <Accent kind="asterisk" width={20} height={20} />
            </div>
          </EditorialReveal>
        </div>
      </section>
    </PageShell>
  );
}
