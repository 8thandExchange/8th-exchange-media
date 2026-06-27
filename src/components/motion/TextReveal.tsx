"use client";

import { motion } from "framer-motion";
import { EASE, staggerContainer, fadeUp, DURATION } from "@/lib/motion";

interface TextRevealProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "p" | "span";
  delay?: number;
}

export function TextReveal({ text, className, as = "span", delay = 0 }: TextRevealProps) {
  const words = text.split(" ");
  const Tag = motion[as];

  return (
    <Tag
      className={className}
      variants={staggerContainer(0.06, delay)}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={fadeUp}
          transition={{ duration: DURATION.hero, ease: EASE }}
          className="inline-block mr-[0.28em]"
          style={{ willChange: "transform, opacity" }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
