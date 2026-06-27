"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { EASE, DURATION } from "@/lib/motion";

interface MotionButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "outline" | "filled";
  className?: string;
}

export function MotionButton({ href, children, variant = "outline", className = "" }: MotionButtonProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <Link
        href={href}
        className={`btn-gold ${variant === "filled" ? "btn-gold-filled" : ""} ${className}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}

interface ServiceCardProps {
  title: string;
  description: string;
  image: string;
  tag: string;
}

export function ServiceCard({ title, description, image, tag }: ServiceCardProps) {
  return (
    <motion.article
      className="service-card group relative flex min-h-[420px] flex-col justify-end overflow-hidden p-8 md:min-h-[480px] md:p-10"
      whileHover="hover"
      initial="rest"
      variants={{
        rest: {},
        hover: {},
      }}
    >
      <motion.div
        className="absolute inset-0"
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.08 },
        }}
        transition={{ duration: 1.2, ease: EASE }}
      >
        <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
      </motion.div>
      <div className="relative z-10">
        <span className="font-mono text-[10px] tracking-[0.25em] text-gold/70">{tag}</span>
        <h3 className="font-display mt-3 text-2xl text-cream md:text-3xl">{title}</h3>
        <motion.p
          className="mt-3 max-w-sm text-sm leading-relaxed text-cream/50"
          variants={{
            rest: { opacity: 0, y: 12 },
            hover: { opacity: 1, y: 0 },
          }}
          transition={{ duration: DURATION.base, ease: EASE }}
        >
          {description}
        </motion.p>
      </div>
    </motion.article>
  );
}

interface WorkTileProps {
  title: string;
  category: string;
  image: string;
  href?: string;
}

export function WorkTile({ title, category, image, href = "/work" }: WorkTileProps) {
  return (
    <Link href={href} className="block">
      <motion.div
        className="work-tile group relative aspect-[4/3] overflow-hidden"
        whileHover="hover"
        initial="rest"
      >
        <motion.div
          className="absolute inset-0"
          variants={{
            rest: { scale: 1 },
            hover: { scale: 1.06 },
          }}
          transition={{ duration: 1, ease: EASE }}
        >
          <Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 z-10 p-8 md:p-10">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold/70">{category}</p>
          <motion.h3
            className="font-display mt-2 text-2xl text-cream md:text-3xl"
            variants={{
              rest: { x: 0 },
              hover: { x: 8 },
            }}
            transition={{ duration: DURATION.base, ease: EASE }}
          >
            {title}
          </motion.h3>
        </div>
      </motion.div>
    </Link>
  );
}
