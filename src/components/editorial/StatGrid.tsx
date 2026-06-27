interface Stat {
  value: string;
  suffix?: string;
  label: string;
}

interface StatGridProps {
  stats: Stat[];
  tone?: "navy" | "cream";
}

export function StatGrid({ stats, tone = "navy" }: StatGridProps) {
  const dark = tone === "navy";

  return (
    <section className={dark ? "surface-navy border-y border-white/10" : "surface-cream border-y border-hairline-ink"}>
      <div className="container-content">
        <div className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-4 py-10 md:px-6 md:py-12 ${
                i > 0 ? (dark ? "border-l border-white/10" : "border-l border-hairline-ink") : ""
              } ${i >= 2 ? (dark ? "max-md:border-t max-md:border-white/10" : "max-md:border-t max-md:border-hairline-ink") : ""}`}
            >
              <p className={`font-display text-3xl md:text-4xl ${dark ? "text-cream" : "text-ink"}`}>
                {stat.value}
                {stat.suffix && (
                  <span className={dark ? "text-gold" : "text-gold-dark"}>{stat.suffix}</span>
                )}
              </p>
              <p className={`eyebrow mt-3 text-[0.6875rem] ${dark ? "eyebrow-on-dark" : "eyebrow-on-light"}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
