import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOCKUPS = {
  horizontal: "/brand/assets/logo/lockup-horizontal.svg",
  "horizontal-transparent": "/brand/assets/logo/lockup-horizontal-transparent.svg",
  "horizontal-reversed": "/brand/assets/logo/lockup-horizontal-reversed.svg",
  stacked: "/brand/assets/logo/lockup-stacked.svg",
  "stacked-reversed": "/brand/assets/logo/lockup-stacked-reversed.svg",
  coin: "/brand/assets/logo/coin-primary-antiqued.svg",
  "coin-transparent": "/brand/assets/logo/coin-transparent-antiqued.svg",
  "coin-reversed": "/brand/assets/logo/coin-reversed-gold-antiqued.svg",
  "coin-cream": "/brand/assets/logo/coin-reversed-cream-antiqued.svg",
} as const;

type LogoVariant = keyof typeof LOCKUPS;

const SIZES: Record<LogoVariant, { w: number; h: number; className: string }> = {
  horizontal: { w: 220, h: 72, className: "h-12 w-auto md:h-14" },
  "horizontal-transparent": { w: 220, h: 72, className: "h-12 w-auto md:h-14" },
  "horizontal-reversed": { w: 220, h: 72, className: "h-12 w-auto md:h-14" },
  stacked: { w: 160, h: 200, className: "h-28 w-auto md:h-36" },
  "stacked-reversed": { w: 160, h: 200, className: "h-28 w-auto md:h-36" },
  coin: { w: 120, h: 120, className: "h-20 w-20 md:h-28 md:w-28" },
  "coin-transparent": { w: 88, h: 88, className: "h-14 w-14 md:h-16 md:w-16" },
  "coin-reversed": { w: 120, h: 120, className: "h-20 w-20 md:h-28 md:w-28" },
  "coin-cream": { w: 88, h: 88, className: "h-10 w-10 md:h-11 md:w-11" },
};

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}

export function Logo({
  variant = "horizontal-reversed",
  className,
  priority = false,
}: LogoProps) {
  const size = SIZES[variant];
  return (
    <Image
      src={LOCKUPS[variant]}
      alt="8th & Exchange Media"
      width={size.w}
      height={size.h}
      priority={priority}
      className={cn(size.className, className)}
    />
  );
}

interface LogoLinkProps extends LogoProps {
  href?: string;
}

export function LogoLink({ href = "/", ...props }: LogoLinkProps) {
  return (
    <Link href={href} className="inline-block focus-visible:outline-offset-4">
      <Logo {...props} />
    </Link>
  );
}

interface HeaderLogoProps {
  priority?: boolean;
}

/** Navy 8E coin — vector only, no canvas grain or background fill */
function CoinMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 280 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="140" cy="140" r="126" stroke="#0B1B3D" strokeWidth="2.6" />
      <circle cx="140" cy="140" r="116" stroke="#0B1B3D" strokeWidth="1.1" />
      <text
        x="111"
        y="164"
        textAnchor="middle"
        fontFamily="var(--font-playfair), 'Playfair Display', Georgia, serif"
        fontWeight="600"
        fontSize="70"
        fill="#0B1B3D"
      >
        8
      </text>
      <line x1="136" y1="94" x2="144" y2="186" stroke="#0B1B3D" strokeWidth="2.3" />
      <text
        x="170"
        y="164"
        textAnchor="middle"
        fontFamily="var(--font-playfair), 'Playfair Display', Georgia, serif"
        fontWeight="600"
        fontSize="70"
        fill="#0B1B3D"
      >
        E
      </text>
    </svg>
  );
}

/** Coin mark + Playfair wordmark — legible on the navy header bar */
export function HeaderLogo({ priority = false }: HeaderLogoProps) {
  const size = SIZES["coin-cream"];
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 focus-visible:outline-offset-4 md:gap-3.5"
    >
      <Image
        src={LOCKUPS["coin-cream"]}
        alt=""
        width={size.w}
        height={size.h}
        priority={priority}
        aria-hidden
        className={size.className}
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.0625rem] font-medium italic tracking-[-0.01em] text-cream md:text-[1.375rem]">
          8th & Exchange
        </span>
        <span className="mt-1 font-body text-[0.625rem] font-semibold uppercase tracking-[0.26em] text-gold md:text-[0.6875rem]">
          Media
        </span>
      </span>
      <span className="sr-only">8th & Exchange Media</span>
    </Link>
  );
}

/** Transparent coin + wordmark for paper/cream backgrounds */
export function FooterLogo() {
  const size = SIZES["coin-transparent"];
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-3 focus-visible:outline-offset-4 md:gap-3.5"
    >
      <CoinMark className={cn(size.className, "shrink-0")} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.0625rem] font-medium italic tracking-[-0.01em] text-navy md:text-[1.25rem]">
          8th & Exchange
        </span>
        <span className="mt-1 font-body text-[0.625rem] font-semibold uppercase tracking-[0.26em] text-gold-dark md:text-[0.6875rem]">
          Media
        </span>
      </span>
      <span className="sr-only">8th & Exchange Media</span>
    </Link>
  );
}
