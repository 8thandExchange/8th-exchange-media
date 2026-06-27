"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BrandLockup } from "@/components/brand/BrandLockup";

/** A short, cinematic brand intro that draws the monogram then lifts away. */
export function Preloader() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (
      reduced ||
      sessionStorage.getItem("8e-intro") === "1" ||
      window.location.search.includes("nointro")
    ) {
      setDone(true);
      return;
    }

    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      sessionStorage.setItem("8e-intro", "1");
      setDone(true);
    }, 2400);

    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (done) document.body.style.overflow = "";
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-obsidian"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center px-6"
          >
            <BrandLockup size="hero" layout="stacked" draw="mount" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
