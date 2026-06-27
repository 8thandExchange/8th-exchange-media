"use client";

import { useEffect, useState } from "react";

interface MarqueeProps {
  items: string[];
  tone?: "light" | "dark";
}

export function Marquee({ items, tone = "dark" }: MarqueeProps) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const doubled = [...items, ...items];
  const list = reduced ? items : doubled;

  return (
    <section
      className={
        tone === "dark"
          ? "surface-navy border-y border-white/10 py-4"
          : "surface-cream border-y border-hairline-ink py-4"
      }
      aria-hidden
    >
      <div
        className={
          reduced
            ? "flex flex-wrap justify-center gap-x-8 gap-y-2 px-6"
            : "flex w-max animate-marquee"
        }
      >
        {list.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={
              tone === "dark"
                ? "mx-8 flex shrink-0 items-center gap-8 eyebrow eyebrow-on-dark text-[0.6875rem]"
                : "mx-8 flex shrink-0 items-center gap-8 eyebrow eyebrow-on-light text-[0.6875rem]"
            }
          >
            {item}
            <span className={tone === "dark" ? "text-gold" : "text-gold-dark"} aria-hidden>
              ◆
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
