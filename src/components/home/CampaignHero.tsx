"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { DURATION, EASE, fadeUp, transition } from "@/lib/motion";

const STAT_CHIPS = [
  { label: "Avg. open rate", value: "+38%" },
  { label: "Return on ad spend", value: "2.4×" },
  { label: "Journey", value: "Welcome series · live" },
];

/** Mock campaign-editor card — drawn in the same language as the journey and calendar cards */
function CampaignCard() {
  return (
    <div className="border-hairline bg-paper p-6 text-left shadow-[0_24px_64px_-32px_rgba(11,27,61,0.35)] md:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow eyebrow-on-light">Email campaign — June promo</p>
        <span className="border border-navy/20 px-2.5 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.14em] text-ink/55">
          Scheduled
        </span>
      </div>

      <div className="mt-5 border-b border-navy/10 pb-4">
        <p className="eyebrow text-[0.5625rem] text-ink/40">Subject</p>
        <p className="font-display mt-1 text-xl text-navy">
          The Summer Edit — early access inside
        </p>
      </div>

      <div className="mt-6 grid items-center gap-6 sm:grid-cols-[8rem_minmax(0,1fr)]">
        <div className="relative mx-auto h-28 w-28 sm:mx-0">
          <Image
            src={ILLUSTRATIONS.spots.svcContent}
            alt="Hand-drawn speech bubbles and smartphone"
            fill
            sizes="112px"
            className="object-contain"
          />
        </div>
        <div className="space-y-2.5" aria-hidden>
          <div className="h-2 w-full rounded-full bg-navy/10" />
          <div className="h-2 w-11/12 rounded-full bg-navy/10" />
          <div className="h-2 w-4/5 rounded-full bg-navy/10" />
          <div className="h-2 w-2/3 rounded-full bg-navy/[0.07]" />
          <span className="mt-2 inline-block bg-navy px-4 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-cream">
            Shop early access
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-navy/10 pt-4">
        <p className="text-xs text-ink/55">Segment: Repeat customers · 4,218 recipients</p>
        <p className="text-xs text-ink/55">Sends Tue 10:00 AM · optimized per contact</p>
      </div>
    </div>
  );
}

export function CampaignHero() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden border-b border-navy/8 bg-paper">
      <div className="container-content pb-16 pt-28 text-center md:pb-20 md:pt-36">
        <motion.div
          initial={reduced ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
          }}
          className="mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp} transition={transition(0, DURATION.hero)}>
            <Eyebrow index="01" label="Full-Funnel Marketing Agency" tone="light" className="mb-6" />
          </motion.div>
          <motion.h1
            className="type-display text-balance"
            variants={fadeUp}
            transition={{ ...transition(0, DURATION.hero), ease: EASE }}
          >
            Create better campaigns with{" "}
            <span className="not-italic font-medium text-navy">8th &amp; Exchange</span>.
          </motion.h1>
          <motion.p
            className="type-lead mx-auto mt-7 max-w-2xl text-ink/70"
            variants={fadeUp}
            transition={transition(0.1, DURATION.slow)}
          >
            Email, SMS, social, ads, and automation — one agency team that plans, produces, and
            optimizes your marketing, so the right message reaches the right customer on every
            channel.
          </motion.p>
          <motion.div
            className="mt-9 flex flex-wrap justify-center gap-4"
            variants={fadeUp}
            transition={transition(0.18, DURATION.base)}
          >
            <Button href="/growth-map" tone="light" pill>
              Get Your Free Growth Map
            </Button>
            <Button href="/services" tone="light">
              Explore Services
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={reduced ? false : { opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, ease: EASE, delay: 0.35 }}
          className="relative mx-auto mt-14 max-w-3xl md:mt-16"
        >
          <CampaignCard />

          <div className="pointer-events-none absolute inset-x-4 -bottom-6 flex flex-wrap justify-center gap-3 md:inset-x-auto md:-right-10 md:bottom-8 md:flex-col md:items-end">
            {STAT_CHIPS.map((chip) => (
              <div
                key={chip.label}
                className="flex items-baseline gap-2 border border-navy/10 bg-cream px-4 py-2.5 shadow-[0_12px_32px_-16px_rgba(11,27,61,0.4)]"
              >
                <span className="font-display text-lg italic text-navy">{chip.value}</span>
                <span className="eyebrow text-[0.5625rem] text-ink/50">{chip.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
