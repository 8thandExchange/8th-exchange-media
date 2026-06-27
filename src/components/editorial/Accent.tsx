import Image from "next/image";
import { cn } from "@/lib/utils";
import { ILLUSTRATIONS } from "@/lib/illustrations";

type AccentKind = keyof typeof ILLUSTRATIONS.accents;

interface AccentProps {
  kind: AccentKind;
  className?: string;
  width?: number;
  height?: number;
}

export function Accent({ kind, className, width, height }: AccentProps) {
  const src = ILLUSTRATIONS.accents[kind];
  const defaults: Record<AccentKind, { w: number; h: number }> = {
    underline: { w: 120, h: 12 },
    arrow: { w: 48, h: 24 },
    asterisk: { w: 24, h: 24 },
    star: { w: 20, h: 20 },
    laurel: { w: 80, h: 48 },
  };
  const size = defaults[kind];

  return (
    <Image
      src={src}
      alt=""
      width={width ?? size.w}
      height={height ?? size.h}
      className={cn("inline-block select-none", className)}
      aria-hidden
    />
  );
}

interface AccentUnderlineProps {
  children: React.ReactNode;
  className?: string;
}

export function AccentUnderline({ children, className }: AccentUnderlineProps) {
  return (
    <span className={cn("relative inline-block", className)}>
      {children}
      <Accent
        kind="underline"
        className="absolute -bottom-1 left-0 w-full max-w-none opacity-80"
        width={140}
        height={14}
      />
    </span>
  );
}
