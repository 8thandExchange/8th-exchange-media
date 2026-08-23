import type { CSSProperties, ReactElement } from "react";
import { breakDisplayLines } from "@/lib/growth/copy";
import type { AssetFormat, BrandSnapshot, GrowthAsset } from "@/lib/growth/types";

const DISPLAY = "Playfair Display";
const BODY = "Hanken Grotesk";

export const ASSET_DIMENSIONS: Record<AssetFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

function scaleFor(format: AssetFormat): number {
  if (format === "story") return 1.16;
  if (format === "portrait") return 1.07;
  return 1;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isEightE(name: string): boolean {
  return /8th\s*&?\s*exchange/i.test(name);
}

function headlineSize(lines: string[], format: AssetFormat, base: number): number {
  const longest = Math.max(...lines.map((line) => line.length), 1);
  let size = base;
  if (longest > 24) size *= 0.7;
  else if (longest > 18) size *= 0.82;
  else if (longest > 14) size *= 0.92;
  if (lines.length >= 3) size *= 0.88;
  return Math.round(size * scaleFor(format));
}

function BrandMark({
  brand,
  size,
  onDark,
}: {
  brand: BrandSnapshot;
  size: number;
  onDark?: boolean;
}): ReactElement {
  const accent = brand.accent;
  const ink = onDark ? brand.secondary : brand.primary;
  const eightE = isEightE(brand.name);

  if (eightE) {
    const numeral = Math.round(size * 0.32);
    const ring = Math.max(2, Math.round(size * 0.028));
    return (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: size,
          border: `${ring}px solid ${accent}`,
        }}
      >
        <div
          style={{
            width: size - ring * 6,
            height: size - ring * 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: size,
            border: `${Math.max(1, Math.round(ring * 0.45))}px solid ${accent}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              color: accent,
              fontFamily: DISPLAY,
              fontSize: numeral,
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            <span>8</span>
            <div
              style={{
                width: Math.max(2, size * 0.018),
                height: size * 0.34,
                background: accent,
                margin: `0 ${size * 0.04}px`,
              }}
            />
            <span>E</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `${Math.max(2, size * 0.03)}px solid ${accent}`,
        color: ink,
      }}
    >
      <div
        style={{
          width: size * 0.78,
          height: size * 0.78,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${accent}`,
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: size * 0.28,
            fontWeight: 600,
            letterSpacing: "0.04em",
            color: accent,
          }}
        >
          {initials(brand.name)}
        </span>
      </div>
    </div>
  );
}

function Hairline({ color, width = "100%" }: { color: string; width?: number | string }): ReactElement {
  return (
    <div
      style={{
        width,
        height: 1,
        background: color,
        display: "flex",
      }}
    />
  );
}

function Kicker({
  text,
  color,
  size,
}: {
  text: string;
  color: string;
  size: number;
}): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        color,
        fontFamily: BODY,
        fontSize: size,
        fontWeight: 600,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
      }}
    >
      {text}
    </div>
  );
}

function Headline({
  lines,
  color,
  size,
  maxWidth,
}: {
  lines: string[];
  color: string;
  size: number;
  maxWidth: number;
}): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: DISPLAY,
        fontSize: size,
        color,
        lineHeight: 0.98,
        letterSpacing: "-0.02em",
        maxWidth,
      }}
    >
      {lines.map((line) => (
        <div key={line} style={{ display: "flex" }}>
          {line}
        </div>
      ))}
    </div>
  );
}

export function renderGrowthAsset(asset: GrowthAsset): ReactElement {
  const brand = asset.brand_snapshot;
  const content = asset.content;
  const scale = scaleFor(asset.format);
  const pad = Math.round(78 * scale);
  const lines = breakDisplayLines(content.headline, asset.format === "story" ? 14 : 16);
  const displaySize = headlineSize(lines, asset.format, 86);
  const canvas: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    position: "relative",
    overflow: "hidden",
    fontFamily: BODY,
  };

  if (asset.template_key === "insight") {
    return (
      <div
        style={{
          ...canvas,
          flexDirection: "column",
          padding: pad,
          background: brand.primary,
          color: brand.secondary,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 36 * scale,
            border: `1px solid ${brand.accent}`,
            opacity: 0.45,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Kicker text={content.kicker} color={brand.accent} size={22 * scale} />
          <BrandMark brand={brand} size={86 * scale} onDark />
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 40,
          }}
        >
          <Headline
            lines={lines}
            color={brand.secondary}
            size={displaySize}
            maxWidth={920}
          />
          {content.supportingText ? (
            <div
              style={{
                display: "flex",
                marginTop: 36 * scale,
                maxWidth: 640,
                color: brand.secondary,
                fontSize: 26 * scale,
                lineHeight: 1.35,
                opacity: 0.78,
              }}
            >
              {content.supportingText}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 * scale }}>
          <Hairline color={brand.accent} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: brand.secondary,
              fontSize: 22 * scale,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            <span>{brand.name}</span>
            <span style={{ color: brand.accent }}>
              {isEightE(brand.name) ? "Augusta" : brand.tagline}
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (asset.template_key === "offer") {
    return (
      <div
        style={{
          ...canvas,
          flexDirection: "column",
          padding: pad,
          background: brand.primary,
          color: brand.secondary,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `linear-gradient(180deg, ${brand.primary} 0%, ${brand.primary} 72%, ${brand.accent}14 100%)`,
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 * scale }}>
            <Kicker text={content.kicker} color={brand.accent} size={22 * scale} />
            <Hairline color={brand.accent} width={72 * scale} />
          </div>
          <BrandMark brand={brand} size={92 * scale} onDark />
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Headline
            lines={lines}
            color={brand.secondary}
            size={displaySize}
            maxWidth={900}
          />
          {content.supportingText ? (
            <div
              style={{
                display: "flex",
                marginTop: 34 * scale,
                fontSize: 26 * scale,
                lineHeight: 1.35,
                maxWidth: 680,
                opacity: 0.8,
              }}
            >
              {content.supportingText}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            border: `1.5px solid ${brand.accent}`,
            padding: `${20 * scale}px ${28 * scale}px`,
          }}
        >
          <span
            style={{
              fontFamily: BODY,
              fontSize: 24 * scale,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: brand.accent,
            }}
          >
            {content.cta || "Take the next step"}
          </span>
          <span style={{ color: brand.secondary, fontSize: 20 * scale }}>{brand.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...canvas,
        flexDirection: "column",
        padding: pad,
        background: brand.secondary,
        color: brand.primary,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 36 * scale,
          border: `1px solid ${brand.accent}`,
        }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Kicker text={content.kicker} color={brand.primary} size={21 * scale} />
        <BrandMark brand={brand} size={84 * scale} />
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
        }}
      >
        <Headline
          lines={lines}
          color={brand.primary}
          size={displaySize}
          maxWidth={900}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 * scale }}>
        <div style={{ display: "flex", width: 96 * scale, height: 2, background: brand.accent }} />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 22 * scale,
          }}
        >
          <span style={{ fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {brand.name}
          </span>
          <span style={{ maxWidth: 420, textAlign: "right", opacity: 0.72 }}>
            {content.supportingText || brand.tagline}
          </span>
        </div>
      </div>
    </div>
  );
}
