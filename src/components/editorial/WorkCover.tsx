import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WorkCoverProps {
  src: string | null;
  alt: string;
  title: string;
  category: string;
  href?: string;
  index?: number;
}

export function WorkCover({ src, alt, title, category, href = "/work", index }: WorkCoverProps) {
  const inner = (
    <article className="group">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream border border-navy/8">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-[1.2s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="eyebrow text-ink/35">WORK COVER</span>
          </div>
        )}
        {index != null ? (
          <span className="absolute left-4 top-4 eyebrow text-[0.625rem] text-cream/90 mix-blend-difference">
            {String(index).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <div className="mt-5">
        <p className="eyebrow eyebrow-on-light mb-2 text-[0.625rem]">{category}</p>
        <h3 className="font-display text-xl italic text-ink transition-colors group-hover:text-navy md:text-2xl">
          {title}
        </h3>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className={cn("block focus-visible:outline-offset-4")}>
        {inner}
      </Link>
    );
  }

  return inner;
}
