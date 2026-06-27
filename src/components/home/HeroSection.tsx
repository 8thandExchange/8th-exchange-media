"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { TextReveal } from "@/components/motion/TextReveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { BrandLockup } from "@/components/brand/BrandLockup";
import { EASE, DURATION, fadeUp, staggerContainer } from "@/lib/motion";

export function HeroSection() {
  const { scrollY } = useScroll();
  const imageY = useTransform(scrollY, [0, 700], [0, 200]);
  const imageScale = useTransform(scrollY, [0, 700], [1.05, 1.18]);
  const contentOpacity = useTransform(scrollY, [0, 450], [1, 0]);
  const contentY = useTransform(scrollY, [0, 450], [0, 70]);

  return (
    <section className="relative min-h-[100svh] overflow-hidden">
      <div className="hero-frame absolute inset-0">
        <motion.div className="absolute inset-0" style={{ y: imageY, scale: imageScale }}>
          <Image
            src="/img/hero/hero-signature.jpg"
            alt="Inside the 8th & Exchange Media grading suite"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
        <div className="grain-overlay absolute inset-0" aria-hidden />
      </div>

      {/* Ambient glow orbs */}
      <motion.div
        className="pointer-events-none absolute left-[8%] top-[18%] h-80 w-80 rounded-full bg-gold/5 blur-[110px]"
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute bottom-[22%] right-[10%] h-64 w-64 rounded-full bg-forest/25 blur-[90px]"
        animate={{ x: [0, -25, 0], y: [0, 15, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        aria-hidden
      />

      <motion.div
        className="relative z-10 flex min-h-[100svh] flex-col justify-end px-6 pb-16 pt-32 md:px-10 md:pb-24 lg:px-14"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="mx-auto w-full max-w-8xl">
          <motion.div
            className="mb-10 md:mb-12"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.hero, ease: EASE, delay: 0.15 }}
          >
            <BrandLockup size="hero" layout="stacked" className="items-start" />
          </motion.div>

          <motion.div
            className="mb-7 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.base, ease: EASE, delay: 0.3 }}
          >
            <span className="h-px w-10 bg-gold/60" />
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-gold">
              Full-Service Media House · Augusta, Georgia
            </p>
          </motion.div>

          <h1 className="font-display max-w-6xl text-display-xl font-light text-cream">
            <TextReveal text="Media engineered to" as="span" delay={0.45} />
            <br />
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.hero, ease: EASE, delay: 1.05 }}
              className="italic text-gold"
            >
              command
            </motion.span>{" "}
            <motion.span
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.hero, ease: EASE, delay: 1.2 }}
            >
              the market.
            </motion.span>
          </h1>

          <motion.p
            className="mt-8 max-w-xl text-lg leading-relaxed text-cream/60"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: DURATION.slow, ease: EASE, delay: 1.5 }}
          >
            Strategy, creative, production, and performance under one roof — a media
            house built to rival the best in New York and Los Angeles, with the
            discipline of the 8th &amp; Exchange family behind every move.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-wrap items-center gap-5"
            variants={staggerContainer(0.12, 1.7)}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp}>
              <Magnetic strength={0.35}>
                <Link href="/#contact" className="btn-gold btn-gold-filled">
                  Start a Project
                </Link>
              </Magnetic>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Link
                href="/#work"
                className="link-underline font-mono text-[11px] uppercase tracking-[0.22em] text-cream/70 hover:text-cream"
              >
                View Selected Work →
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="mx-auto mt-16 flex w-full max-w-8xl flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: DURATION.base }}
        >
          <span className="font-mono text-[9px] uppercase tracking-[0.35em] text-cream/25">
            Scroll
          </span>
          <motion.div
            className="h-10 w-px origin-top bg-gradient-to-b from-gold/60 to-transparent"
            animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
