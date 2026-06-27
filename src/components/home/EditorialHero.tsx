"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ILLUSTRATIONS } from "@/lib/illustrations";
import { DURATION, EASE, fadeUp, transition } from "@/lib/motion";

export function EditorialHero() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, reduced ? 0 : 48]);
  const opacity = useTransform(scrollY, [0, 400], [1, reduced ? 1 : 0.85]);

  return (
    <section className="relative min-h-[92svh] overflow-hidden bg-cream">
      <motion.div className="absolute inset-0" style={{ y, opacity }}>
        <Image
          src={ILLUSTRATIONS.features.hero}
          alt="Hand-drawn editorial icons framing an open center on cream paper"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </motion.div>

      <div className="container-content relative z-[1] flex min-h-[92svh] flex-col items-center justify-center py-28 text-center">
        <motion.div
          initial={reduced ? false : "hidden"}
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
          }}
          className="max-w-3xl"
        >
          <motion.div variants={fadeUp} transition={transition(0, DURATION.hero)} className="text-center">
            <Eyebrow index="01" label="Full-Service Media" tone="light" className="mb-6" />
          </motion.div>
          <motion.h1
            className="type-display text-balance"
            variants={fadeUp}
            transition={{ ...transition(0, DURATION.hero), ease: EASE }}
          >
            Media built with restraint, clarity, and{" "}
            <span className="not-italic font-medium text-navy">lasting craft</span>.
          </motion.h1>
          <motion.p
            className="type-lead mx-auto mt-8 max-w-xl text-ink/70"
            variants={fadeUp}
            transition={transition(0.1, DURATION.slow)}
          >
            Strategy, creative, production, and performance — one studio, one standard, measured
            in work that holds up over time.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-4"
            variants={fadeUp}
            transition={transition(0.18, DURATION.base)}
          >
            <Button href="/contact" tone="light" pill>
              Start a Project
            </Button>
            <Button href="/services" tone="light" className="btn-on-light">
              Our Services
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
