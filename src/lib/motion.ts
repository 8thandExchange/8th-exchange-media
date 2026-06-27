/** Shared motion tokens — premium agency feel without external prompt libraries */
export const EASE = [0.16, 1, 0.3, 1] as const;
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  fast: 0.4,
  base: 0.75,
  slow: 1.1,
  hero: 1.4,
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1 },
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -48 },
  visible: { opacity: 1, x: 0 },
};

export const slideFromRight = {
  hidden: { opacity: 0, x: 48 },
  visible: { opacity: 1, x: 0 },
};

export const staggerContainer = (stagger = 0.1, delay = 0.14) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const viewport = {
  once: true,
  margin: "-8% 0px -8% 0px" as `${number}px ${number}px ${number}px ${number}px`,
  amount: 0.2 as const,
};

export const transition = (delay = 0, duration: number = DURATION.base) => ({
  duration,
  ease: EASE,
  delay,
});
