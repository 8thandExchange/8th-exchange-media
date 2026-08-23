/**
 * Digital-presence onboarding checklist.
 *
 * Keys are stable; never reuse a retired key. Each client's progress is stored
 * in portal_clients.onboarding_checklist as { [itemKey]: ChecklistEntry }.
 *
 * Items hold artifacts (IDs, domains, links), not just a checkbox. Client type
 * (local / platform / b2b) decides what renders and what is required.
 */

export type ClientType = "local" | "platform" | "b2b";

export const CLIENT_TYPES: { value: ClientType; label: string; help: string }[] = [
  {
    value: "local",
    label: "Local",
    help: "A real public location. Google Business Profile is the #1 ranking asset.",
  },
  {
    value: "platform",
    label: "Platform",
    help: "National or remote delivery, no patient-facing storefront. GBP is optional and often a suspension risk.",
  },
  {
    value: "b2b",
    label: "B2B",
    help: "Sells to other businesses. LinkedIn and the offer object carry more weight than local listings.",
  },
];

export interface ChecklistItem {
  key: string;
  label: string;
  help: string;
  /** The deliverable this item stores — shown as an input. */
  valueLabel?: string;
  valuePlaceholder?: string;
  /**
   * Which modes show this item. Omit = all three.
   * Use `optionalFor` when it should render but not block launch.
   */
  modes?: ClientType[];
  /** If set, the item is optional in these modes (and required in the others it appears in). */
  optionalFor?: ClientType[];
  /** Always optional, even in modes where it appears. */
  optional?: boolean;
}

export interface ChecklistGroup {
  section: string;
  items: ChecklistItem[];
}

export interface ChecklistEntry {
  done: boolean;
  /** The artifact: measurement ID, place ID, sending domain, etc. */
  value?: string;
  note?: string;
  evidenceUrl?: string;
  completedBy?: string;
  completedAt?: string;
  /** Legacy timestamp from the checkbox-only era. */
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
        help: "business.google.com — for a real public location this is the #1 local ranking asset. For a platform or suite address with no patient-facing operation, skip it: that listing pattern is how Google suspends profiles.",
        valueLabel: "GBP place ID",
        valuePlaceholder: "ChIJ…",
        optionalFor: ["platform", "b2b"],
      },
      {
        key: "google-reviews-link",
        label: "Review short link captured",
        help: "The direct 'write a review' short link from the Business Profile — it feeds the GHL review engine.",
        valueLabel: "Review short link",
        valuePlaceholder: "https://g.page/r/…",
        optionalFor: ["platform", "b2b"],
      },
      {
        key: "google-analytics",
        label: "Google Analytics 4 property installed",
        help: "analytics.google.com — GA4 property created, tag on every site page, conversions defined for the primary action.",
        valueLabel: "GA4 measurement ID",
        valuePlaceholder: "G-XXXXXXXX",
      },
      {
        key: "google-search-console",
        label: "Search Console verified + sitemap submitted",
        help: "search.google.com/search-console — how Google sees the site; link it to GA4.",
        valueLabel: "Search Console property",
        valuePlaceholder: "https://example.com/",
      },
      {
        key: "google-ads-account",
        label: "Google Ads account created (even before spending)",
        help: "ads.google.com — set up now with conversion import from GA4 so history exists when spend starts.",
        valueLabel: "Google Ads customer ID",
        valuePlaceholder: "123-456-7890",
        optional: true,
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
        valueLabel: "Business Portfolio ID",
      },
      {
        key: "meta-facebook-page",
        label: "Facebook Business Page",
        help: "Complete profile: category, hours, description, cover. Owned by the Business Portfolio.",
        valueLabel: "Page ID or URL",
        optionalFor: ["platform", "b2b"],
      },
      {
        key: "meta-instagram-business",
        label: "Instagram converted to Business & linked to the Page",
        help: "Required for scheduling, insights, and ads. Link inside Page settings.",
        valueLabel: "Instagram handle",
        valuePlaceholder: "@brand",
        optionalFor: ["b2b"],
      },
      {
        key: "meta-pixel-dataset",
        label: "Meta Pixel / Dataset installed on the site",
        help: "Events Manager — base code plus the primary conversion event. Needed before any retargeting audience can build.",
        valueLabel: "Dataset / Pixel ID",
        valuePlaceholder: "15-digit ID",
      },
      {
        key: "meta-ads-account",
        label: "Meta Ads account + payment method",
        help: "Inside the Business Portfolio; assign 8E partner access rather than sharing logins.",
        valueLabel: "Ad account ID",
        valuePlaceholder: "act_…",
        optional: true,
      },
      {
        key: "meta-domain-verification",
        label: "Domain verified in Meta",
        help: "Business settings → Brand safety → Domains. Required for link customization and clean event attribution.",
        valueLabel: "Verified domain",
        valuePlaceholder: "example.com",
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
        valueLabel: "Handle",
        valuePlaceholder: "@brand",
        optional: true,
      },
      {
        key: "linkedin-page",
        label: "LinkedIn Company Page",
        help: "The channel that matters for B2B and professional-services platforms. Employees linked. Add the Insight Tag if ads are plausible.",
        valueLabel: "Company page URL",
        valuePlaceholder: "/company/…",
        optionalFor: ["local"],
      },
      {
        key: "tiktok-business",
        label: "TikTok Business account",
        help: "Secure the handle regardless. For a professional-services platform this is optional; for local consumer brands it is reach arbitrage.",
        valueLabel: "Handle",
        valuePlaceholder: "@brand",
        optional: true,
      },
      {
        key: "youtube-channel",
        label: "YouTube channel (brand account)",
        help: "Long-form home for the content engine; connects to Google Ads for video campaigns.",
        valueLabel: "Channel URL",
        optional: true,
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
        valueLabel: "Location ID",
      },
      {
        key: "ghl-8e-connected",
        label: "Location ID + Private Integration token connected in this dashboard",
        help: "The GHL card — enables the Social Planner brand picker. Token is encrypted at rest.",
        valueLabel: "Location ID confirmed",
      },
      {
        key: "ghl-socials-connected",
        label: "All social accounts connected in GHL Social Planner",
        help: "Inside the client's sub-account: Marketing → Social Planner → Settings. Connect the PAGE (not personal profiles).",
        valueLabel: "Networks connected",
        valuePlaceholder: "FB, IG, LI, …",
      },
      {
        key: "ghl-a2p-registration",
        label: "A2P 10DLC SMS registration approved",
        help: "Phone Numbers → Trust Center. Without carrier registration, marketing SMS silently fails or gets the number blocked. Needs legal name, EIN, entity type, and registered agent first. Takes days — start early.",
        valueLabel: "A2P campaign ID",
      },
      {
        key: "ghl-email-domain",
        label: "Dedicated sending domain + DKIM/SPF authenticated",
        help: "Settings → Email Services. Unauthenticated email lands in spam; this is deliverability's foundation.",
        valueLabel: "Sending domain",
        valuePlaceholder: "mail.example.com",
      },
      {
        key: "ghl-calendar-booking",
        label: "Calendar / booking link live",
        help: "The conversion action every workflow points at.",
        valueLabel: "Booking URL",
        valuePlaceholder: "https://…",
      },
      {
        key: "ghl-core-workflows",
        label: "Universal trio live: speed-to-lead, missed-call text-back, review engine",
        help: "Copy in docs/GHL_BUILDOUT.md — these run before any ad dollar is spent.",
        valueLabel: "Workflow IDs or proof URL",
        optionalFor: ["platform", "b2b"],
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
        valueLabel: "Test lead / ticket ID",
      },
      {
        key: "access-audit",
        label: "Access audit: client owns everything, 8E has partner/manager access",
        help: "No shared passwords, no agency-owned assets. The client must never be hostage to a vendor — including us.",
        valueLabel: "Audit note or Drive folder",
      },
    ],
  },
];

export function isValidClientType(value: unknown): value is ClientType {
  return value === "local" || value === "platform" || value === "b2b";
}

export function itemVisible(item: ChecklistItem, type: ClientType): boolean {
  return !item.modes || item.modes.includes(type);
}

export function itemRequired(item: ChecklistItem, type: ClientType): boolean {
  if (!itemVisible(item, type)) return false;
  if (item.optional) return false;
  if (item.optionalFor?.includes(type)) return false;
  return true;
}

export function visibleChecklist(type: ClientType): ChecklistGroup[] {
  return ONBOARDING_CHECKLIST.map((group) => ({
    ...group,
    items: group.items.filter((item) => itemVisible(item, type)),
  })).filter((group) => group.items.length > 0);
}

export function flatVisibleItems(type: ClientType): ChecklistItem[] {
  return visibleChecklist(type).flatMap((group) => group.items);
}

export function entryCompletedAt(entry?: ChecklistEntry): string | undefined {
  return entry?.completedAt || entry?.at;
}

export interface ChecklistProgress {
  requiredDone: number;
  requiredTotal: number;
  optionalDone: number;
  optionalTotal: number;
  /** Weighted: required items count 3× optional. */
  weightedDone: number;
  weightedTotal: number;
  percent: number;
}

const REQUIRED_WEIGHT = 3;
const OPTIONAL_WEIGHT = 1;

export function checklistProgress(
  state: ChecklistState,
  type: ClientType = "local"
): ChecklistProgress {
  const items = flatVisibleItems(type);
  let requiredDone = 0;
  let requiredTotal = 0;
  let optionalDone = 0;
  let optionalTotal = 0;

  for (const item of items) {
    const done = Boolean(state[item.key]?.done);
    if (itemRequired(item, type)) {
      requiredTotal += 1;
      if (done) requiredDone += 1;
    } else {
      optionalTotal += 1;
      if (done) optionalDone += 1;
    }
  }

  const weightedDone = requiredDone * REQUIRED_WEIGHT + optionalDone * OPTIONAL_WEIGHT;
  const weightedTotal = requiredTotal * REQUIRED_WEIGHT + optionalTotal * OPTIONAL_WEIGHT;
  const percent = weightedTotal === 0 ? 0 : Math.round((weightedDone / weightedTotal) * 100);

  return {
    requiredDone,
    requiredTotal,
    optionalDone,
    optionalTotal,
    weightedDone,
    weightedTotal,
    percent,
  };
}

/** Legacy unweighted count — prefer checklistProgress(). */
export function checklistDoneCount(state: ChecklistState, type: ClientType = "local"): number {
  return flatVisibleItems(type).filter((item) => state[item.key]?.done).length;
}

export function checklistVisibleTotal(type: ClientType = "local"): number {
  return flatVisibleItems(type).length;
}

/** @deprecated Use checklistVisibleTotal(clientType). Kept so existing imports compile during the cutover. */
export const CHECKLIST_TOTAL = ONBOARDING_CHECKLIST.reduce((n, group) => n + group.items.length, 0);
