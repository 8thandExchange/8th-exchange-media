/**
 * The operating map for running 8E + every brand from this codebase.
 * Rendered on the Ads desk and expanded in docs/OPERATING_SYSTEM.md.
 * This is a control plane, not a clone of Meta / GHL / Metricool.
 */

export interface OperatingLane {
  lane: string;
  livesIn: string;
  thisApp: string;
  status: "shipped" | "this-pr" | "connect" | "human";
}

export const OPERATING_LANES: OperatingLane[] = [
  {
    lane: "Brand, logo, voice, guardrails",
    livesIn: "Supabase brand_kits + client notes",
    thisApp: "Brand kit editor on the client page — every asset inherits it",
    status: "shipped",
  },
  {
    lane: "Websites, launch, hosting",
    livesIn: "Vercel (one project per site) + this repo for 8emedia.com",
    thisApp: "Does not host client sites. Requests track the work; deploy stays on Vercel",
    status: "connect",
  },
  {
    lane: "Invoicing & collections",
    livesIn: "Stripe (no local invoice mirror)",
    thisApp: "Staff invoicing desk is a live remote control",
    status: "shipped",
  },
  {
    lane: "CRM, email, SMS, booking, pipelines",
    livesIn: "Go High Level — one location per brand",
    thisApp: "Lead push + per-client location/token on the client page",
    status: "shipped",
  },
  {
    lane: "Social setup + posting (FB, IG, LinkedIn, X, TikTok, YouTube, GBP)",
    livesIn: "GHL Social Planner owns the queue and OAuth",
    thisApp: "Thin composer at /invoicing/social — draft / schedule / publish",
    status: "shipped",
  },
  {
    lane: "Social analytics, competitors, unified inbox reporting",
    livesIn: "Metricool (or GHL's own insights)",
    thisApp: "Do not rebuild. Link out; keep this desk for actions, not charts",
    status: "connect",
  },
  {
    lane: "Meta Pixel, CAPI, Ads account registry",
    livesIn: "Meta Events Manager + Ads Manager; IDs stored here",
    thisApp: "Consent-gated Pixel on marketing routes, CAPI on leads, Ads desk",
    status: "this-pr",
  },
  {
    lane: "Creating / optimizing Meta campaigns",
    livesIn: "Meta Ads Manager (policy, billing, creative review)",
    thisApp: "Read campaigns + spend when a system-user token is set; deep-link to Ads Manager",
    status: "this-pr",
  },
  {
    lane: "Google Analytics, Search Console, Google Ads",
    livesIn: "Google; GA4 id already consent-gated on this site",
    thisApp: "Same pattern as Meta later — do not start here",
    status: "connect",
  },
  {
    lane: "Video shoot, edit, clip, YouTube packaging",
    livesIn: "People + Frame.io / Drive / Resolve. Requests track the job",
    thisApp: "Portal requests + brand kit. No in-app NLE",
    status: "human",
  },
  {
    lane: "Client intake & production traffic",
    livesIn: "Supabase portal_requests + onboarding_leads",
    thisApp: "Portal + staff request desk + onboarding wizard",
    status: "shipped",
  },
];

export const META_PIXEL_SETUP_STEPS = [
  {
    title: "Open (or create) the 8E Business Portfolio",
    detail:
      "business.facebook.com — 8th & Exchange Media owns this portfolio. 8E gets admin; no shared personal logins. Each client brand gets its own portfolio that the client owns, with 8E as a partner.",
  },
  {
    title: "Create the Pixel / Dataset",
    detail:
      "Events Manager → Data sources → Add → Web → Meta Pixel. Name it “8E Media — 8emedia.com”. Copy the numeric Pixel ID. We cannot mint this ID from the repo — Meta issues it.",
  },
  {
    title: "Paste the Pixel ID into Vercel",
    detail:
      "Project 8th-exchange-media → Settings → Environment Variables → NEXT_PUBLIC_META_PIXEL_ID (Production + Preview). Redeploy. The consent banner appears only after this is set.",
  },
  {
    title: "Generate a Conversions API token",
    detail:
      "Same dataset → Settings → Generate access token. Store it as META_CAPI_ACCESS_TOKEN (server-only, never NEXT_PUBLIC). Contact and onboarding already send Lead events once this is set.",
  },
  {
    title: "Verify the domain",
    detail:
      "Business settings → Brand safety → Domains → add 8emedia.com. Paste the verification code as NEXT_PUBLIC_META_DOMAIN_VERIFY and redeploy. Required for clean attribution and link previews.",
  },
  {
    title: "Create the Ads account and assign a system user",
    detail:
      "Business settings → Accounts → Ad accounts → add payment method. Then Users → System users → generate a token with ads_read (ads_management later). Set META_AD_ACCOUNT_ID and META_SYSTEM_USER_TOKEN. This desk can then list live campaigns.",
  },
];
