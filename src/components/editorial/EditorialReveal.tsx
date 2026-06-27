"use client";

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, transition, viewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface EditorialRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  as?: keyof typeof motion;
}

export function EditorialReveal({
  children,
  className,
  delay = 0,
  duration,
  as = "div",
}: EditorialRevealProps) {
  const reduced = useReducedMotion();
  const Component = motion[as] as typeof motion.div;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <Component
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={fadeUp}
      transition={transition(delay, duration)}
    >
      {children}
    </Component>
  );
}

interface EditorialStaggerProps {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}

export function EditorialStagger({ children, className, stagger = 0.1 }: EditorialStaggerProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: 0.08 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function EditorialStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div className={className} variants={fadeUp} transition={transition()}>
      {children}
    </motion.div>
  );
}
