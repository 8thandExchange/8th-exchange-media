import Image from "next/image";
import { cn } from "@/lib/utils";

interface FeatureIllustrationProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  aspect?: string;
}

export function FeatureIllustration({
  src,
  alt,
  className,
  priority = false,
  aspect = "auto",
}: FeatureIllustrationProps) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={{ aspectRatio: aspect }}>
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
    </div>
  );
}

interface SpotIllustrationProps {
  src: string | null;
  alt: string;
  label?: string;
  className?: string;
  size?: number;
}

export function SpotIllustration({ src, alt, label, className, size = 120 }: SpotIllustrationProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex aspect-square items-center justify-center border border-dashed border-navy/15 bg-cream/50 p-4 text-center",
          className
        )}
        style={{ width: size, height: size }}
      >
        <span className="eyebrow text-[0.625rem] text-ink/40">{label ?? "ILLUSTRATION"}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-contain object-center" />
    </div>
  );
}
