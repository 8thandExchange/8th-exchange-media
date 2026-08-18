/**
 * Honest map of what it takes to run 8E and every family/client brand
 * from this platform. Statuses are about *this repo*, not the agency's
 * people — a human editor and a DaVinci timeline are still the right
 * tools for a lot of the work.
 */

export type CapabilityStatus = "live" | "partial" | "next" | "out";

export interface StudioCapability {
  id: string;
  work: string;
  owner: string;
  status: CapabilityStatus;
  note: string;
}

export const CAPABILITY_LABEL: Record<CapabilityStatus, string> = {
  live: "Live here",
  partial: "Partial",
  next: "Not built",
  out: "Stays outside",
};

export const STUDIO_CAPABILITIES: StudioCapability[] = [
  {
    id: "brand-kits",
    work: "Brand development, voice, colors, logos-as-files",
    owner: "Portal brand kits + human design",
    status: "partial",
    note: "Kits store the system. Making the mark is still a designer. New companies land here first.",
  },
  {
    id: "websites",
    work: "Website development & launch",
    owner: "Separate Vercel projects per brand",
    status: "out",
    note: "This repo is 8emedia.com, not a site factory. Each brand (EHA, CourtPro, …) keeps its own codebase. The checklist tracks launch; it does not build the site.",
  },
  {
    id: "hosting",
    work: "Hosting & domains",
    owner: "Vercel + each brand's registrar",
    status: "out",
    note: "Don't pull hosting into this app. Keep one project per live site so a client deploy cannot take 8E down.",
  },
  {
    id: "social-setup",
    work: "Social account setup (FB, IG, X, LinkedIn, YouTube, TikTok)",
    owner: "Onboarding checklist + GHL Social Planner settings",
    status: "partial",
    note: "Checklist tells staff what to create. Connections themselves happen in GHL (and YouTube/TikTok's own UIs).",
  },
  {
    id: "social-posting",
    work: "Compose, schedule, publish",
    owner: "Social Planner → Go High Level",
    status: "live",
    note: "One body, one media URL, per-brand GHL location. Calendar, approvals, and per-network variants stay in GHL — by design.",
  },
  {
    id: "video",
    work: "Shoot, edit, clip for Reels / Shorts / YouTube",
    owner: "Studio production (human)",
    status: "out",
    note: "No DAM or clip pipeline in this app. Finished URLs drop into the Social Planner. Building an editor here would be a different product.",
  },
  {
    id: "crm",
    work: "CRM, pipelines, email/SMS follow-up",
    owner: "Go High Level (per-brand location)",
    status: "live",
    note: "Onboarding leads already upsert into 8E's location. Client work must stay in the client's location — resolveGhlAuth is the sharp edge.",
  },
  {
    id: "billing",
    work: "Invoices, customers, payment links",
    owner: "Stripe via /invoicing",
    status: "live",
    note: "Stripe is the invoicing database. Don't mirror it.",
  },
  {
    id: "portal",
    work: "Client requests, files, brand access",
    owner: "Client portal",
    status: "live",
    note: "The operating surface for existing retainers. New companies become a portal client + GHL location + brand kit.",
  },
  {
    id: "meta-ads",
    work: "Meta Pixel, Conversions API, ad-account connection",
    owner: "This Ads workspace",
    status: "partial",
    note: "Measurement ships in this slice. Creating and spending campaigns from the app waits on a reviewed Meta app + System User. Until then, Ads Manager is the spend UI.",
  },
  {
    id: "google-ads",
    work: "Google Ads + GA4 + YouTube ads",
    owner: "Checklist only",
    status: "next",
    note: "Same shape as Meta once Pixel/CAPI is proven: GA4 on the site, then a connection card, then read-only campaigns. Not this slice.",
  },
  {
    id: "metricool",
    work: "Metricool (analytics / scheduling)",
    owner: "Do not add",
    status: "out",
    note: "GHL already owns the queue and the connected accounts. A second scheduler splits the source of truth. Revisit only if we need analytics GHL cannot show.",
  },
];

export const META_SETUP_STEPS = [
  {
    title: "Create the Business Portfolio",
    body: "business.facebook.com — 8E already needs one that owns the 8E Media Page. New companies get their own portfolio; 8E is added as a partner, never as the owner.",
  },
  {
    title: "Create the Pixel / Dataset",
    body: "Events Manager → Connect data sources → Web. Name it “8E Media — 8emedia.com”. The Dataset ID is the Pixel ID (a long number). There is no Pixel until someone clicks this — the app cannot invent one.",
  },
  {
    title: "Generate the Conversions API token",
    body: "Same Dataset → Settings → Generate access token. That string is META_CAPI_ACCESS_TOKEN. Server-only. It is what lets contact and onboarding form submits count as Lead events even when the browser Pixel is blocked.",
  },
  {
    title: "Set the env vars and redeploy",
    body: "Vercel → 8th-exchange-media → Settings → Environment Variables. Add NEXT_PUBLIC_META_PIXEL_ID (Production and Preview) and META_CAPI_ACCESS_TOKEN (server-only). Redeploy master so the cookie banner and CAPI wake up.",
  },
  {
    title: "Verify the domain",
    body: "Business settings → Brand safety → Domains → add 8emedia.com. Paste the verification code as NEXT_PUBLIC_META_DOMAIN_VERIFICATION. The site already emits the facebook-domain-verification meta tag when that var is set.",
  },
  {
    title: "Create the ad account (spend comes last)",
    body: "Inside the portfolio: Ad accounts → add payment method → assign 8E people (and later a System User). Put the numeric id in META_AD_ACCOUNT_ID. Do not spend until Events Manager is receiving PageView + Lead for several days.",
  },
] as const;
