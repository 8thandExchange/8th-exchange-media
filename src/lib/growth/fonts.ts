import { readFile } from "node:fs/promises";

export const GROWTH_DISPLAY_FONT = "Playfair Display";
export const GROWTH_BODY_FONT = "Hanken Grotesk";

type GrowthFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 600;
  style: "normal";
};

export async function loadGrowthAssetFonts(): Promise<GrowthFont[]> {
  const [display, body, bodySemibold] = await Promise.all([
    readFile(new URL("./fonts/PlayfairDisplay-SemiBold.ttf", import.meta.url)),
    readFile(new URL("./fonts/HankenGrotesk-Regular.ttf", import.meta.url)),
    readFile(new URL("./fonts/HankenGrotesk-SemiBold.ttf", import.meta.url)),
  ]);

  return [
    { name: GROWTH_DISPLAY_FONT, data: toArrayBuffer(display), weight: 600, style: "normal" },
    { name: GROWTH_BODY_FONT, data: toArrayBuffer(body), weight: 400, style: "normal" },
    { name: GROWTH_BODY_FONT, data: toArrayBuffer(bodySemibold), weight: 600, style: "normal" },
  ];
}

function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
}
