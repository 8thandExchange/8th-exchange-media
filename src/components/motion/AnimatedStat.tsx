"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { EASE, DURATION } from "@/lib/motion";

interface AnimatedStatProps {
  value: string;
  suffix?: string;
  label: string;
  numeric?: boolean;
}

export function AnimatedStat({ value, suffix = "", label, numeric = true }: AnimatedStatProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [display, setDisplay] = useState(numeric ? "0" : value);

  const target = numeric ? parseInt(value, 10) : 0;
  const spring = useSpring(0, { stiffness: 40, damping: 20 });
  const rounded = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    if (!inView) return;
    if (numeric && !Number.isNaN(target)) {
      spring.set(target);
      const unsub = rounded.on("change", (v) => setDisplay(String(v)));
      return unsub;
    }
    setDisplay(value);
  }, [inView, numeric, target, spring, rounded, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: DURATION.slow, ease: EASE }}
      className="stat-cell px-6 py-12 text-center md:py-14"
    >
      <p className="font-display text-[clamp(2rem,4vw,3.25rem)] font-light text-gold">
        {display}
        {suffix && <span className="text-[0.55em] text-gold-warm">{suffix}</span>}
      </p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cream/30">{label}</p>
    </motion.div>
  );
}
