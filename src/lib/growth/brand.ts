import type { BrandSnapshot } from "@/lib/growth/types";
import type { BrandKit, PortalClient } from "@/lib/portal/service";

const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

function safeHex(value: string | undefined, fallback: string): string {
  return value && HEX_PATTERN.test(value) ? value : fallback;
}

export function compileBrandSnapshot(
  client: Pick<PortalClient, "company" | "brand_notes"> | null,
  kit: BrandKit | null
): BrandSnapshot {
  if (!client) {
    return {
      name: "8th & Exchange Media",
      tagline: "Make the signal impossible to ignore.",
      primary: "#0b1b3d",
      secondary: "#f4efe3",
      accent: "#c9a84c",
      background: "#f4efe3",
      foreground: "#0b1b3d",
      headingFont: "Cormorant Garamond",
      bodyFont: "DM Sans",
      voiceTone: "Editorial, assured, direct, commercially useful",
      sourceKit: null,
    };
  }

  const colors = kit?.colors ?? [];
  const color = (index: number, fallback: string) => safeHex(colors[index]?.hex, fallback);
  return {
    name: client.company,
    tagline: kit?.tagline?.trim() || "Built for meaningful growth.",
    primary: color(0, "#0b1b3d"),
    secondary: color(1, "#f4efe3"),
    accent: color(2, "#c9a84c"),
    background: color(1, "#f4efe3"),
    foreground: color(0, "#0b1b3d"),
    headingFont: kit?.headingFont?.trim() || "Georgia",
    bodyFont: kit?.bodyFont?.trim() || "Arial",
    voiceTone: kit?.voiceTone?.trim() || client.brand_notes?.trim() || "Clear, useful, human",
    logoUrl: kit?.logos?.[0]?.url,
    sourceKit: kit,
  };
}
