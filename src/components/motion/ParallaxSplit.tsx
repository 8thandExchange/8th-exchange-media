"use client";

import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Reveal } from "@/components/ui/Reveal";

interface ParallaxSplitProps {
  image: string;
  children: React.ReactNode;
}

export function ParallaxSplit({ image, children }: ParallaxSplitProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-midnight">
      <div className="grid min-h-[520px] md:grid-cols-2">
        <div className="relative min-h-[320px] overflow-hidden">
          <motion.div className="absolute inset-0 scale-110" style={{ y: imageY }}>
            <Image src={image} alt="" fill sizes="50vw" className="object-cover" />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-midnight/80" />
        </div>
        <div className="flex flex-col justify-center px-6 py-16 md:px-12 lg:px-20">{children}</div>
      </div>
    </section>
  );
}

interface MarqueeProps {
  items: string[];
}

export function Marquee({ items }: MarqueeProps) {
  const doubled = [...items, ...items];

  return (
    <section className="overflow-hidden border-y border-gold/8 bg-midnight py-5">
      <motion.div
        className="flex w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="mx-8 flex shrink-0 items-center gap-8 font-mono text-[11px] uppercase tracking-[0.25em] text-cream/30"
          >
            {item}
            <span className="text-gold/50">◆</span>
          </span>
        ))}
      </motion.div>
    </section>
  );
}
