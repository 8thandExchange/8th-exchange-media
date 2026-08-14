import { cn } from "@/lib/utils";
import type { PortfolioBrand } from "@/lib/portfolio";

/**
 * Typographic portfolio tile — no imagery, so nothing can misrepresent.
 * The brand name set large in the display face IS the artwork.
 */
export function BrandTile({ brand, index }: { brand: PortfolioBrand; index: number }) {
  const inner = (
    <article
      className={cn(
        "group flex h-full flex-col justify-between border p-8 transition-colors md:p-10",
        "border-white/10 bg-navy hover:border-gold/40"
      )}
    >
      <div>
        <div className="flex items-baseline justify-between gap-4">
          <p className="eyebrow eyebrow-on-dark text-[0.625rem]">{brand.sector}</p>
          <span className="eyebrow text-[0.625rem] text-cream/40">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
        <h3 className="font-display mt-6 text-3xl italic leading-tight text-cream transition-colors group-hover:text-gold md:text-4xl">
          {brand.name}
        </h3>
        <p className="mt-5 text-sm leading-relaxed text-cream/65">{brand.summary}</p>
      </div>
      <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
        {brand.services.map((s) => (
          <li key={s} className="eyebrow text-[0.625rem] text-cream/50">
            {s}
          </li>
        ))}
      </ul>
    </article>
  );

  if (brand.href) {
    return (
      <a
        href={brand.href}
        target="_blank"
        rel="noopener noreferrer"
        className="block h-full focus-visible:outline-offset-4"
      >
        {inner}
      </a>
    );
  }
  return <div className="h-full">{inner}</div>;
}
