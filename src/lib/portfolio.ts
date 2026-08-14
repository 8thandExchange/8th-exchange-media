/**
 * The 8th & Exchange family portfolio — the honest proof wall.
 * Every entry is a real operating brand we build for in-house. No stock
 * imagery, no invented clients: the work speaks in its own name.
 */

export interface PortfolioBrand {
  name: string;
  sector: string;
  summary: string;
  services: string[];
  href?: string;
  /** Marked for the flagship case-study slot (owner-approved 2026-08-13). */
  flagship?: boolean;
}

export const PORTFOLIO: PortfolioBrand[] = [
  {
    name: "Elevated Health Augusta",
    sector: "Healthcare",
    summary:
      "A physician-owned concierge clinic in Evans, GA — brand system, marketing site, patient booking and payments, an AI phone receptionist, and the growth engine behind it. Results publish here as they accrue.",
    services: ["Brand & site", "Patient platform", "AI reception", "Growth system"],
    href: "https://elevatedhealthaugusta.com",
    flagship: true,
  },
  {
    name: "8th Street Construction",
    sector: "Construction",
    summary:
      "Commercial construction and development — identity, brand guide, and a fast marketing site built to win bids, not awards.",
    services: ["Identity", "Brand guide", "Web"],
    href: "https://www.8thstreetconstruction.com",
  },
  {
    name: "CourtPro Augusta",
    sector: "Sport Construction",
    summary:
      "Court construction and resurfacing across the CSRA — public site plus the estimating and admin portal behind it.",
    services: ["Web", "Admin portal", "Lead capture"],
    href: "https://courtproaugusta.com",
  },
  {
    name: "Wetzel's of Augusta",
    sector: "Hospitality",
    summary:
      "An Augusta hospitality institution — brand stewardship and the operations hub that keeps the front and back of house on one page.",
    services: ["Brand", "Ops platform"],
  },
  {
    name: "Dink'd Pickleball",
    sector: "Sport & Community",
    summary:
      "Courts, community, and a nonprofit arm — brand family, campaign creative, and the platforms that run programming and giving.",
    services: ["Brand family", "Campaigns", "Platforms"],
  },
  {
    name: "Line of Duty Medical",
    sector: "Veteran Services",
    summary:
      "A platform connecting veterans with ex-military physicians for benefits exams — product design and the brand to carry it.",
    services: ["Product design", "Brand"],
  },
];

/** Disclosure that must accompany the portfolio wherever it's shown. */
export const PORTFOLIO_DISCLOSURE =
  "The 8th & Exchange family of companies — we operate these brands, and we build for them first. Client engagements get the same system.";
