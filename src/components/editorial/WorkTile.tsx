import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WorkTileProps {
  title: string;
  category: string;
  image: string;
  href?: string;
  tone?: "dark" | "light";
}

export function WorkTile({
  title,
  category,
  image,
  href = "/work",
  tone = "dark",
}: WorkTileProps) {
  const light = tone === "light";

  return (
    <Link
      href={href}
      className={cn(
        "group block border transition-colors",
        light
          ? "border-hairline-ink bg-paper hover:border-gold-dark/50"
          : "border-white/10 bg-navy hover:border-gold/40"
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        <div
          className={cn(
            "absolute inset-0 transition-colors",
            light ? "bg-paper/10 group-hover:bg-paper/0" : "bg-navy/20 group-hover:bg-navy/10"
          )}
        />
      </div>
      <div
        className={cn(
          "border-t p-6 md:p-8",
          light ? "border-hairline-ink" : "border-white/10"
        )}
      >
        <p
          className={cn(
            "eyebrow mb-3 text-[0.6875rem]",
            light ? "eyebrow-on-light" : "eyebrow-on-dark"
          )}
        >
          {category}
        </p>
        <h3 className={cn("type-h3", light ? "text-ink" : "text-cream")}>{title}</h3>
      </div>
    </Link>
  );
}
