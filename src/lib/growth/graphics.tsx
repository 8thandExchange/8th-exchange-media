import type { CSSProperties, ReactElement } from "react";
import type { AssetFormat, GrowthAsset } from "@/lib/growth/types";

export const ASSET_DIMENSIONS: Record<AssetFormat, { width: number; height: number }> = {
  square: { width: 1080, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function scaleFor(format: AssetFormat): number {
  if (format === "story") return 1.18;
  if (format === "portrait") return 1.08;
  return 1;
}

export function renderGrowthAsset(asset: GrowthAsset): ReactElement {
  const brand = asset.brand_snapshot;
  const content = asset.content;
  const scale = scaleFor(asset.format);
  const common: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    position: "relative",
    overflow: "hidden",
    color: brand.foreground,
    background: brand.background,
    fontFamily: brand.bodyFont,
  };

  if (asset.template_key === "insight") {
    return (
      <div style={{ ...common, flexDirection: "column", padding: 80 * scale }}>
        <div
          style={{
            position: "absolute",
            width: 660 * scale,
            height: 660 * scale,
            borderRadius: 999,
            background: brand.accent,
            opacity: 0.16,
            right: -250 * scale,
            top: -250 * scale,
          }}
        />
        <div
          style={{
            color: brand.accent,
            fontSize: 25 * scale,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {content.kicker}
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            fontFamily: brand.headingFont,
            fontSize: 84 * scale,
            lineHeight: 0.98,
            letterSpacing: "-0.035em",
            maxWidth: 900,
          }}
        >
          {content.headline}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `3px solid ${brand.foreground}`,
            paddingTop: 28 * scale,
            fontSize: 24 * scale,
          }}
        >
          <span>{brand.name}</span>
          <span style={{ fontWeight: 800, color: brand.accent }}>{initials(brand.name)}</span>
        </div>
      </div>
    );
  }

  if (asset.template_key === "offer") {
    return (
      <div
        style={{
          ...common,
          flexDirection: "column",
          padding: 76 * scale,
          background: brand.primary,
          color: brand.secondary,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 24 * scale,
            letterSpacing: "0.04em",
          }}
        >
          <span>{brand.name}</span>
          <span
            style={{
              display: "flex",
              width: 74 * scale,
              height: 74 * scale,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              background: brand.accent,
              color: brand.primary,
              fontWeight: 800,
            }}
          >
            {initials(brand.name)}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: 23 * scale,
              color: brand.accent,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.16em",
              marginBottom: 26 * scale,
            }}
          >
            {content.kicker}
          </div>
          <div
            style={{
              fontFamily: brand.headingFont,
              fontSize: 92 * scale,
              lineHeight: 0.94,
              letterSpacing: "-0.045em",
              maxWidth: 920,
            }}
          >
            {content.headline}
          </div>
          {content.supportingText ? (
            <div
              style={{
                marginTop: 36 * scale,
                fontSize: 27 * scale,
                lineHeight: 1.3,
                maxWidth: 760,
                opacity: 0.78,
              }}
            >
              {content.supportingText}
            </div>
          ) : null}
        </div>
        <div
          style={{
            alignSelf: "flex-start",
            background: brand.accent,
            color: brand.primary,
            borderRadius: 999,
            padding: `${18 * scale}px ${34 * scale}px`,
            fontSize: 25 * scale,
            fontWeight: 800,
          }}
        >
          {content.cta || "Take the next step"}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        ...common,
        flexDirection: "column",
        padding: 78 * scale,
        background: brand.secondary,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 24 * scale,
          background: brand.accent,
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: brand.primary,
        }}
      >
        <span
          style={{
            fontSize: 24 * scale,
            fontWeight: 700,
            letterSpacing: "0.13em",
            textTransform: "uppercase",
          }}
        >
          {content.kicker}
        </span>
        <span style={{ fontSize: 25 * scale, fontWeight: 800 }}>{initials(brand.name)}</span>
      </div>
      <div
        style={{
          display: "flex",
          flex: 1,
          alignItems: "center",
          fontFamily: brand.headingFont,
          fontSize: 94 * scale,
          lineHeight: 0.94,
          letterSpacing: "-0.045em",
          maxWidth: 920,
          color: brand.primary,
        }}
      >
        {content.headline}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: `3px solid ${brand.primary}`,
          paddingTop: 26 * scale,
          fontSize: 24 * scale,
          color: brand.primary,
        }}
      >
        <span>{brand.name}</span>
        <span>{brand.tagline}</span>
      </div>
    </div>
  );
}
