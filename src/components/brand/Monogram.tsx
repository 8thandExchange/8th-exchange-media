"use client";

import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

interface MonogramProps {
  className?: string;
  /** Draw-on animation. "mount" animates immediately, "view" on scroll into view, false renders static. */
  draw?: "mount" | "view" | false;
  delay?: number;
  strokeWidth?: number;
  title?: string;
}

const DRAW: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 1.4, ease: EASE, delay: i * 0.12 },
      opacity: { duration: 0.3, delay: i * 0.12 },
    },
  }),
};

/**
 * The 8E monogram — two stacked open ellipses forming an "8" fused to a capital "E"
 * that shares the right spine. Inherits color via currentColor (defaults to gold).
 */
export function Monogram({
  className,
  draw = false,
  delay = 0,
  strokeWidth = 3.2,
  title = "8th & Exchange Media",
}: MonogramProps) {
  const animateProps =
    draw === "mount"
      ? { initial: "hidden" as const, animate: "visible" as const }
      : draw === "view"
        ? {
            initial: "hidden" as const,
            whileInView: "visible" as const,
            viewport: { once: true, amount: 0.6 },
          }
        : {};

  const stroke = {
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    fill: "none",
    vectorEffect: "non-scaling-stroke" as const,
  };

  return (
    <svg
      viewBox="0 0 120 120"
      className={cn("text-gold", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g transform="translate(48,60)">
        <motion.ellipse
          cx={0}
          cy={-18}
          rx={16}
          ry={17}
          {...stroke}
          variants={DRAW}
          custom={delay / 0.12 + 0}
          {...animateProps}
        />
        <motion.ellipse
          cx={0}
          cy={18}
          rx={19}
          ry={20}
          {...stroke}
          variants={DRAW}
          custom={delay / 0.12 + 1}
          {...animateProps}
        />
        <motion.line
          x1={14}
          y1={-34}
          x2={14}
          y2={37}
          {...stroke}
          variants={DRAW}
          custom={delay / 0.12 + 2}
          {...animateProps}
        />
        <motion.line
          x1={14}
          y1={-34}
          x2={38}
          y2={-34}
          {...stroke}
          variants={DRAW}
          custom={delay / 0.12 + 2.4}
          {...animateProps}
        />
        <motion.line
          x1={14}
          y1={1}
          x2={32}
          y2={1}
          {...stroke}
          variants={DRAW}
          custom={delay / 0.12 + 2.8}
          {...animateProps}
        />
        <motion.line
          x1={14}
          y1={37}
          x2={38}
          y2={37}
          {...stroke}
          variants={DRAW}
          custom={delay / 0.12 + 3.2}
          {...animateProps}
        />
      </g>
    </svg>
  );
}
