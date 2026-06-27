"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Thin gold progress bar pinned to the top of the viewport. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-gold/40 via-gold to-gold-pale"
      style={{ scaleX }}
      aria-hidden
    />
  );
}
