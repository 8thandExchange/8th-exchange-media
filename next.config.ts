import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from "next/constants";

const baseConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.8emedia.com" }],
        destination: "https://8emedia.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "media.8thandexchange.com" }],
        destination: "https://8emedia.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default function config(phase: string): NextConfig {
  // Local `next build` writes to .next-build so it can never collide with
  // the dev server's .next. With a shared folder, a verification build run
  // beside `next dev` corrupted dev's persistent cache and it served
  // stale compiled CSS until .next was deleted (2026-08-19). Vercel sets
  // VERCEL=1 and keeps the default .next, so deploys are unaffected.
  const isLocalProd =
    !process.env.VERCEL &&
    (phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER);
  return { ...baseConfig, distDir: isLocalProd ? ".next-build" : ".next" };
}
