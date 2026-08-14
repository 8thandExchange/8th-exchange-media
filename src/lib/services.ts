/**
 * Service catalog — single source of truth for everything the agency offers.
 *
 * Modeled for feature parity with a modern marketing platform (email, SMS,
 * automation, audience management, creative, ads, analytics), delivered as
 * managed agency services, alongside the studio's production capabilities.
 */

import { ILLUSTRATIONS } from "@/lib/illustrations";

export interface ServiceItem {
  /** Anchor id on /services — deep-linkable as /services#slug */
  slug: string;
  title: string;
  /** Short one-line copy for cards and grids */
  tagline: string;
  /** Longer copy for the services page */
  description: string;
  deliverables: string[];
  spot: string;
  spotAlt: string;
  spotLabel: string;
}

export interface ServiceCategory {
  /** Anchor id on /services for the whole group */
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  services: ServiceItem[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    slug: "channels",
    eyebrow: "Channels",
    title: "Reach people across every channel",
    intro:
      "Email, SMS, social, search, ads, and the web — planned and produced by one team, so every channel tells the same story.",
    services: [
      {
        slug: "email-marketing",
        title: "Email Marketing",
        tagline: "Campaigns people actually open — strategy, copy, design, and sending, handled.",
        description:
          "Full-service email marketing: campaign strategy and calendars, copywriting and design, list growth, A/B testing, and deliverability management. We run your email program end to end and report on what it earns.",
        deliverables: ["Campaign strategy", "Copy & design", "A/B testing", "Deliverability & list growth"],
        spot: ILLUSTRATIONS.spots.contact,
        spotAlt: "Hand-drawn envelope sealed with antique gold wax",
        spotLabel: "SVC EMAIL",
      },
      {
        slug: "sms-marketing",
        title: "SMS & Mobile Messaging",
        tagline: "Timely, welcome texts — promotions, reminders, and follow-ups that convert.",
        description:
          "Compliant SMS programs that complement email: promotional blasts, appointment and event reminders, back-in-stock alerts, and two-way conversations — with consent management and quiet-hours discipline built in.",
        deliverables: ["SMS campaigns", "Automated reminders", "Compliance & consent", "Short-code setup"],
        spot: ILLUSTRATIONS.spots.svcContent,
        spotAlt: "Hand-drawn speech bubbles and smartphone",
        spotLabel: "SVC SMS",
      },
      {
        slug: "social-media",
        title: "Social Media Marketing",
        tagline: "Organic content, community management, and a calendar that never goes quiet.",
        description:
          "Organic social strategy and execution across every major platform — content creation, scheduling and publishing, community management, and influencer partnerships that build steady momentum.",
        deliverables: ["Content creation", "Scheduling & publishing", "Community management", "Influencer partnerships"],
        spot: ILLUSTRATIONS.spots.svcContent,
        spotAlt: "Hand-drawn speech bubbles and smartphone for social",
        spotLabel: "SVC SOCIAL",
      },
      {
        slug: "digital-ads",
        title: "Digital Ads & Retargeting",
        tagline: "Paid social, Google Ads, and retargeting that finds new customers — and brings them back.",
        description:
          "Paid media across Meta, Google, YouTube, and programmatic — audience building, creative production, budget management, and retargeting campaigns that recover the people who almost bought.",
        deliverables: ["Paid social", "Google Ads", "Retargeting", "Ad creative & testing"],
        spot: ILLUSTRATIONS.spots.step4,
        spotAlt: "Hand-drawn rocket with dashed flight trail",
        spotLabel: "SVC ADS",
      },
      {
        slug: "landing-pages",
        title: "Websites & Landing Pages",
        tagline: "Fast, on-brand pages built to convert — from a single launch page to a full site.",
        description:
          "Custom websites and campaign landing pages engineered for performance, accessibility, and conversion. E-commerce, CMS integration, signup forms, and the hosting and maintenance to keep it all running.",
        deliverables: ["Custom web design", "Landing pages & forms", "E-commerce", "Hosting & maintenance"],
        spot: ILLUSTRATIONS.spots.svcWeb,
        spotAlt: "Hand-drawn browser window with upward trend line",
        spotLabel: "SVC WEB",
      },
      {
        slug: "seo-search",
        title: "Search & SEO",
        tagline: "Be found first — technical SEO, local search, and content that ranks.",
        description:
          "Technical SEO, local search, and paid search campaigns with ongoing optimization. Transparent reporting tied to rankings, traffic, and revenue — not vanity metrics.",
        deliverables: ["Technical SEO", "Local SEO", "Content strategy", "Performance reporting"],
        spot: ILLUSTRATIONS.spots.svcSearch,
        spotAlt: "Hand-drawn magnifying glass with upward trend arrow",
        spotLabel: "SVC SEARCH",
      },
    ],
  },
  {
    slug: "automation",
    eyebrow: "Automation",
    title: "The right message at the right moment",
    intro:
      "Customer journeys that run themselves — welcome a new subscriber, recover an abandoned cart, win back a lapsed customer — designed once, earning always.",
    services: [
      {
        slug: "marketing-automation",
        title: "Marketing Automation & Customer Journeys",
        tagline: "Welcome series, abandoned-cart recovery, win-backs — built once, working around the clock.",
        description:
          "We map and build automated customer journeys across email and SMS: welcome and onboarding series, abandoned-cart and browse recovery, post-purchase follow-ups, re-engagement and win-back flows — each branch tested and tuned.",
        deliverables: ["Journey mapping", "Welcome & onboarding flows", "Cart & browse recovery", "Win-back campaigns"],
        spot: ILLUSTRATIONS.spots.step2,
        spotAlt: "Hand-drawn treasure map with path to an X mark",
        spotLabel: "SVC JOURNEYS",
      },
      {
        slug: "transactional",
        title: "Transactional & Triggered Messaging",
        tagline: "Order confirmations, receipts, and alerts — reliable, branded, and on time.",
        description:
          "The messages your business can't afford to miss: order and shipping confirmations, receipts, appointment reminders, and event-triggered notifications — branded, monitored, and delivered.",
        deliverables: ["Transactional email", "Triggered notifications", "Template systems", "Delivery monitoring"],
        spot: ILLUSTRATIONS.spots.step3,
        spotAlt: "Hand-drawn crossed paintbrush and pencil",
        spotLabel: "SVC TRIGGERED",
      },
    ],
  },
  {
    slug: "audience",
    eyebrow: "Audience",
    title: "Start with your audience",
    intro:
      "Everything begins with who you're talking to. We organize your customer data, segment it, and use it to make every message feel personal.",
    services: [
      {
        slug: "audience-crm",
        title: "Audience Management & CRM",
        tagline: "One organized view of every contact — segmented, tagged, and ready to act on.",
        description:
          "We bring your contacts into one clean system: segmentation and tagging, signup forms and lead capture, data hygiene, and CRM setup — so you always know who your customers are and what they want next.",
        deliverables: ["CRM setup & migration", "Segmentation & tags", "Signup forms & lead capture", "Data hygiene"],
        spot: ILLUSTRATIONS.spots.step1,
        spotAlt: "Hand-drawn ear with sound wave for listening",
        spotLabel: "SVC AUDIENCE",
      },
      {
        slug: "personalization",
        title: "Personalization & Predictive Targeting",
        tagline: "Dynamic content, send-time optimization, and segments that predict the next buyer.",
        description:
          "Messages that adapt to each recipient: dynamic content blocks, behavioral targeting, send-time optimization, and predictive segments that surface your likeliest buyers before the campaign goes out.",
        deliverables: ["Dynamic content", "Behavioral targeting", "Send-time optimization", "Predictive segments"],
        spot: ILLUSTRATIONS.spots.svcSearch,
        spotAlt: "Hand-drawn magnifying glass with upward trend arrow",
        spotLabel: "SVC PERSONAL",
      },
    ],
  },
  {
    slug: "creative",
    eyebrow: "Creative Studio",
    title: "Create content, your way",
    intro:
      "A full creative studio behind every campaign — brand, design, copy, film, and photography produced to one standard: on brand, on time.",
    services: [
      {
        slug: "brand-strategy",
        title: "Brand Strategy & Identity",
        tagline: "Positioning, identity systems, and messaging that give your brand a clear voice.",
        description:
          "Positioning, naming, visual identity systems, brand guidelines, and messaging frameworks. We build brands with a voice that is unmistakably yours — and templates that keep every campaign on brand.",
        deliverables: ["Brand audits", "Identity systems", "Style guides", "Messaging frameworks"],
        spot: ILLUSTRATIONS.spots.svcBrand,
        spotAlt: "Hand-drawn creative workspace flat lay with camera and sketchbook",
        spotLabel: "SVC BRAND",
      },
      {
        slug: "content-creative",
        title: "Campaign Creative & Content",
        tagline: "Email templates, ad creative, copywriting, and design — a content studio on call.",
        description:
          "The creative engine for your campaigns: email and landing-page template systems, ad creative, copywriting, photography, and design — organized in a shared library so every asset is reusable and on brand.",
        deliverables: ["Template design", "Copywriting", "Ad creative", "Content library"],
        spot: ILLUSTRATIONS.spots.svcContent,
        spotAlt: "Hand-drawn speech bubbles and smartphone for content",
        spotLabel: "SVC CONTENT",
      },
      {
        slug: "video-production",
        title: "Video Production",
        tagline: "Commercial video, brand films, and social content — concept through final cut.",
        description:
          "Commercial video, brand films, social content, and event coverage. Full production from concept and scripting through filming, editing, and delivery.",
        deliverables: ["Commercial video", "Brand films", "Social content", "Post-production"],
        spot: ILLUSTRATIONS.spots.svcVideo,
        spotAlt: "Hand-drawn vintage film camera on a tripod",
        spotLabel: "SVC VIDEO",
      },
      {
        slug: "drone-aerial",
        title: "Drone & Aerial Imagery",
        tagline: "FAA-certified aerial cinematography for real estate, hospitality, and events.",
        description:
          "FAA-certified drone services for real estate, hospitality, construction, events, and brand storytelling. 4K aerial video and photography.",
        deliverables: ["Aerial photography", "4K video", "Indoor flight", "Virtual tours"],
        spot: ILLUSTRATIONS.spots.svcDrone,
        spotAlt: "Hand-drawn quadcopter drone with camera gimbal",
        spotLabel: "SVC DRONE",
      },
      {
        slug: "print-signage",
        title: "Print, Signage & Graphics",
        tagline: "Vehicle wraps, signage, and large-format printing for physical spaces.",
        description:
          "Custom vinyl decals, vehicle wraps, heat-transfer graphics, large-format printing, and environmental branding for physical spaces. Produced through our 411 Graphics partnership — browse the full catalog and request Quick Quote pricing at /print.",
        deliverables: ["Vinyl graphics", "Vehicle wraps", "Signage", "Print collateral"],
        spot: ILLUSTRATIONS.spots.svcPrint,
        spotAlt: "Hand-drawn framed artwork with gallery plaque",
        spotLabel: "SVC PRINT",
      },
      {
        slug: "virtual-tours",
        title: "360° Virtual Tours",
        tagline: "Immersive walk-throughs for real estate, hospitality, and retail.",
        description:
          "Immersive virtual experiences for real estate, hospitality, and retail. Let your audience walk through your space before they arrive.",
        deliverables: ["Matterport tours", "Embedded web tours", "Google integration", "VR-ready exports"],
        spot: ILLUSTRATIONS.spots.svcTours,
        spotAlt: "Hand-drawn 360-degree camera on a tripod",
        spotLabel: "SVC TOURS",
      },
    ],
  },
  {
    slug: "insights",
    eyebrow: "Insights",
    title: "Get smarter as you go",
    intro:
      "Every campaign reports back. We turn the numbers into plain-language recommendations — what worked, what didn't, and what to do next.",
    services: [
      {
        slug: "analytics-reporting",
        title: "Analytics & Reporting",
        tagline: "One dashboard for every channel — with recommendations, not just numbers.",
        description:
          "Unified reporting across email, SMS, social, ads, and the web: dashboards, revenue attribution, industry benchmarking, and a monthly review that tells you exactly where the next dollar should go.",
        deliverables: ["Unified dashboards", "Revenue attribution", "Benchmarking", "Monthly strategy reviews"],
        spot: ILLUSTRATIONS.spots.svcWeb,
        spotAlt: "Hand-drawn browser window with upward trend line",
        spotLabel: "SVC ANALYTICS",
      },
      {
        slug: "integrations",
        title: "MarTech, Integrations & Data",
        tagline: "Your store, CRM, and tools connected — data flowing where it should.",
        description:
          "We set up and connect your marketing stack: e-commerce and CRM integrations, tracking and conversion pixels, data syncs, and the plumbing that lets every tool share what it knows.",
        deliverables: ["Stack setup", "E-commerce & CRM syncs", "Tracking & pixels", "Data migration"],
        spot: ILLUSTRATIONS.spots.step2,
        spotAlt: "Hand-drawn treasure map with connected path",
        spotLabel: "SVC STACK",
      },
    ],
  },
];

/** Flat list of every service */
export const ALL_SERVICES: ServiceItem[] = SERVICE_CATEGORIES.flatMap((c) => c.services);

/** Convenience lookup by slug */
export function getService(slug: string): ServiceItem | undefined {
  return ALL_SERVICES.find((s) => s.slug === slug);
}

/** Footer / nav highlights — the headline offerings */
export const FEATURED_SERVICE_SLUGS = [
  "email-marketing",
  "marketing-automation",
  "sms-marketing",
  "social-media",
  "digital-ads",
  "landing-pages",
  "audience-crm",
  "analytics-reporting",
] as const;

export const FEATURED_SERVICES: ServiceItem[] = FEATURED_SERVICE_SLUGS.map(
  (slug) => ALL_SERVICES.find((s) => s.slug === slug)!
);
