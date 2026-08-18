/**
 * The digital-presence onboarding checklist — every account, connection,
 * and registration a client needs to compete with current tools. The
 * canonical list lives here (keys are stable; never reuse a retired key);
 * each client's progress is stored in portal_clients.onboarding_checklist
 * as { [itemKey]: { done, note, at } }.
 */

export interface ChecklistItem {
  key: string;
  label: string;
  /** Why it matters / where to do it — shown as helper text. */
  help: string;
}

export interface ChecklistGroup {
  section: string;
  items: ChecklistItem[];
}

export interface ChecklistEntry {
  done: boolean;
  note?: string;
  at?: string;
}

export type ChecklistState = Record<string, ChecklistEntry>;

export const ONBOARDING_CHECKLIST: ChecklistGroup[] = [
  {
    section: "Google",
    items: [
      {
        key: "google-business-profile",
        label: "Google Business Profile claimed & verified",
        help: "business.google.com — the #1 local ranking asset. Verify ownership, complete every field, add photos and hours.",
      },
      {
        key: "google-reviews-link",
        label: "Review link captured",
        help: "The direct 'write a review' short link from the Business Profile — it feeds the GHL review engine.",
      },
      {
        key: "google-analytics",
        label: "Google Analytics 4 property installed",
        help: "analytics.google.com — GA4 property created, tag on every site page, conversions defined for the primary action.",
      },
      {
        key: "google-search-console",
        label: "Search Console verified + sitemap submitted",
        help: "search.google.com/search-console — how Google sees the site; link it to GA4.",
      },
      {
        key: "google-ads-account",
        label: "Google Ads account created (even before spending)",
        help: "ads.google.com — set up now with conversion import from GA4 so history exists when spend starts.",
      },
    ],
  },
  {
    section: "Meta (Facebook & Instagram)",
    items: [
      {
        key: "meta-business-portfolio",
        label: "Meta Business Portfolio (Business Manager)",
        help: "business.facebook.com — the container that owns everything below. Client owns it; 8E gets partner access.",
      },
      {
        key: "meta-facebook-page",
        label: "Facebook Business Page",
        help: "Complete profile: category, hours, description, cover. Owned by the Business Portfolio.",
      },
      {
        key: "meta-instagram-business",
        label: "Instagram converted to Business & linked to the Page",
        help: "Required for scheduling, insights, and ads. Link inside Page settings.",
      },
      {
        key: "meta-pixel-dataset",
        label: "Meta Pixel / Dataset installed on the site",
        help: "Events Manager — or create it from Studio → Ads after the Meta connection is saved. Needed before any retargeting audience can build.",
      },
      {
        key: "meta-ads-account",
        label: "Meta Ads account + payment method",
        help: "Inside the Business Portfolio; assign 8E partner access rather than sharing logins.",
      },
      {
        key: "meta-domain-verification",
        label: "Domain verified in Meta",
        help: "Business settings → Brand safety → Domains. Required for link customization and clean event attribution.",
      },
    ],
  },
  {
    section: "Other platforms",
    items: [
      {
        key: "x-account",
        label: "X (Twitter) business account",
        help: "Handle secured, profile complete — even if posting is light, the name is protected.",
      },
      {
        key: "linkedin-page",
        label: "LinkedIn Company Page",
        help: "Especially for B2B brands; employees linked. Add the Insight Tag if LinkedIn ads are plausible.",
      },
      {
        key: "tiktok-business",
        label: "TikTok Business account",
        help: "Short-form is the current organic-reach arbitrage; secure the handle regardless.",
      },
      {
        key: "youtube-channel",
        label: "YouTube channel (brand account)",
        help: "Long-form home for the content engine; connects to Google Ads for video campaigns.",
      },
    ],
  },
  {
    section: "GoHighLevel wiring",
    items: [
      {
        key: "ghl-subaccount",
        label: "GHL sub-account created (use the Copy GHL setup block)",
        help: "Client's own location — never run a client from 8E's.",
      },
      {
        key: "ghl-8e-connected",
        label: "Location ID + Private Integration token connected in this dashboard",
        help: "The GHL card below — enables the Social Planner brand picker.",
      },
      {
        key: "ghl-socials-connected",
        label: "All social accounts connected in GHL Social Planner",
        help: "Inside the client's sub-account: Marketing → Social Planner → Settings. Connect the PAGE (not personal profiles).",
      },
      {
        key: "ghl-a2p-registration",
        label: "A2P 10DLC SMS registration approved",
        help: "Phone Numbers → Trust Center. Without carrier registration, marketing SMS silently fails or gets the number blocked. Takes days — start early.",
      },
      {
        key: "ghl-email-domain",
        label: "Dedicated sending domain + DKIM/SPF authenticated",
        help: "Settings → Email Services. Unauthenticated email lands in spam; this is deliverability's foundation.",
      },
      {
        key: "ghl-calendar-booking",
        label: "Calendar / booking link live",
        help: "The conversion action every workflow points at.",
      },
      {
        key: "ghl-core-workflows",
        label: "Universal trio live: speed-to-lead, missed-call text-back, review engine",
        help: "Copy in docs/GHL_BUILDOUT.md — these run before any ad dollar is spent.",
      },
    ],
  },
  {
    section: "Measurement & access",
    items: [
      {
        key: "tracking-verified",
        label: "End-to-end tracking test passed",
        help: "Submit a test lead; confirm it fires GA4, the Meta dataset, and lands in the GHL pipeline with attribution.",
      },
      {
        key: "access-audit",
        label: "Access audit: client owns everything, 8E has partner/manager access",
        help: "No shared passwords, no agency-owned assets. The client must never be hostage to a vendor — including us.",
      },
    ],
  },
];

export const CHECKLIST_TOTAL = ONBOARDING_CHECKLIST.reduce(
  (n, group) => n + group.items.length,
  0
);

export function checklistProgress(state: ChecklistState): number {
  return ONBOARDING_CHECKLIST.reduce(
    (n, group) => n + group.items.filter((i) => state[i.key]?.done).length,
    0
  );
}
