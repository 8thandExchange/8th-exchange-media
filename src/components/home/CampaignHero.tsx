"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { DURATION, EASE, fadeUp, transition } from "@/lib/motion";

const STAT_CHIPS = [
  { label: "Avg. open rate", value: "+38%" },
  { label: "Return on ad spend", value: "2.4×" },
  { label: "Journey", value: "Welcome series · live" },
];

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
            <Button href="/contact" tone="light" pill>
              Start a Project
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
          className="relative mx-auto mt-14 max-w-4xl md:mt-16"
        >
          <div className="border-hairline relative aspect-[16/9] overflow-hidden bg-cream shadow-[0_24px_64px_-32px_rgba(11,27,61,0.35)]">
            <Image
              src="/img/home/social-campaign.jpg"
              alt="Campaign creative being produced in the studio"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 56rem"
              className="object-cover"
            />
          </div>

          <div className="pointer-events-none absolute inset-x-4 -bottom-6 flex flex-wrap justify-center gap-3 md:inset-x-auto md:-right-6 md:bottom-8 md:flex-col md:items-end">
            {STAT_CHIPS.map((chip) => (
              <div
                key={chip.label}
                className="flex items-baseline gap-2 border border-navy/10 bg-paper px-4 py-2.5 shadow-[0_12px_32px_-16px_rgba(11,27,61,0.4)]"
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
