"use client";

import { cn } from "@/lib/utils";
import { Monogram } from "./Monogram";

const SIZES = {
  sm: {
    monogram: "h-12 w-12 md:h-14 md:w-14",
    stroke: 3.6,
    primary: "text-[11px] tracking-[0.16em] md:text-xs md:tracking-[0.18em]",
    secondary: "text-[7px] tracking-[0.45em] md:text-[8px] md:tracking-[0.5em]",
    gap: "gap-3",
  },
  md: {
    monogram: "h-16 w-16 md:h-[4.75rem] md:w-[4.75rem]",
    stroke: 4,
    primary: "text-sm tracking-[0.18em] md:text-base md:tracking-[0.2em]",
    secondary: "text-[8px] tracking-[0.5em] md:text-[9px] md:tracking-[0.55em]",
    gap: "gap-3.5 md:gap-4",
  },
  lg: {
    monogram: "h-24 w-24 md:h-28 md:w-28",
    stroke: 4.2,
    primary: "text-lg tracking-[0.2em] md:text-xl md:tracking-[0.22em]",
    secondary: "text-[9px] tracking-[0.55em] md:text-[10px] md:tracking-[0.6em]",
    gap: "gap-4 md:gap-5",
  },
  xl: {
    monogram: "h-32 w-32 md:h-40 md:w-40",
    stroke: 4.5,
    primary: "text-xl tracking-[0.22em] md:text-2xl md:tracking-[0.24em]",
    secondary: "text-[10px] tracking-[0.58em] md:text-[11px] md:tracking-[0.62em]",
    gap: "gap-5 md:gap-6",
  },
  hero: {
    monogram: "h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 lg:h-60 lg:w-60",
    stroke: 5,
    primary: "text-2xl tracking-[0.2em] sm:text-3xl md:text-4xl md:tracking-[0.22em]",
    secondary: "text-[10px] tracking-[0.55em] sm:text-xs sm:tracking-[0.6em] md:text-sm md:tracking-[0.65em]",
    gap: "gap-5 sm:gap-6 md:gap-7",
  },
} as const;

interface BrandLockupProps {
  size?: keyof typeof SIZES;
  /** Horizontal: monogram beside wordmark. Stacked: monogram above. */
  layout?: "horizontal" | "stacked";
  showWordmark?: boolean;
  className?: string;
  monogramClassName?: string;
  draw?: "mount" | "view" | false;
}

export function BrandLockup({
  size = "md",
  layout = "horizontal",
  showWordmark = true,
  className,
  monogramClassName,
  draw = false,
}: BrandLockupProps) {
  const s = SIZES[size];

  return (
    <div
      className={cn(
        "inline-flex",
        layout === "stacked" ? "flex-col items-center text-center" : "flex-row items-center",
        s.gap,
        className
      )}
    >
      <Monogram
        draw={draw}
        strokeWidth={s.stroke}
        className={cn("shrink-0 text-gold drop-shadow-[0_0_28px_rgba(201,168,76,0.22)]", s.monogram, monogramClassName)}
      />
      {showWordmark && (
        <span
          className={cn(
            "flex flex-col leading-none",
            layout === "stacked" && "items-center"
          )}
        >
          <span className={cn("font-display font-semibold text-cream", s.primary)}>
            8TH &amp; EXCHANGE
          </span>
          <span className={cn("mt-1.5 font-mono font-medium text-gold", s.secondary)}>
            MEDIA
          </span>
        </span>
      )}
    </div>
  );
}
