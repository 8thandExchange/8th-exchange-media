"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function HairlineReveal({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={cn("hairline hairline-ink", className)} aria-hidden />;
  }

  return (
    <motion.div
      className={cn("hairline hairline-ink origin-left", className)}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-5%" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden
    />
  );
}
