/** Product categories available through our 411 Graphics production partnership */

export const PARTNER = {
  name: "411 Graphics",
  contact: "Billy",
} as const;

export interface PrintProduct {
  name: string;
  description: string;
  options?: string[];
  turnaround: string;
}

export interface PrintCategory {
  id: string;
  title: string;
  summary: string;
  products: PrintProduct[];
}

export const PRINT_CATEGORIES: PrintCategory[] = [
  {
    id: "signs-banners",
    title: "Signs & Banners",
    summary: "Indoor and outdoor signage from yard signs to large-format banners.",
    products: [
      {
        name: "Vinyl Banners",
        description: "13oz, 15oz, and 18oz options with grommets and hemming.",
        options: ["13oz standard", "13mil blockout", "15oz heavy-duty", "18oz premium"],
        turnaround: "3–5 business days",
      },
      {
        name: "Retractable Banner Stands",
        description: '33" × 76" finished size with carry case included.',
        turnaround: "7–10 business days",
      },
      {
        name: "Yard Signs",
        description: "Full-color or single-color, single- or double-sided with optional stakes.",
        options: ['12" × 18"', '18" × 24"'],
        turnaround: "3–5 business days",
      },
      {
        name: "Coroplast Signs",
        description: "Rigid corrugated plastic for outdoor durability.",
        options: ["4mm white", "10mm white", "4mm yellow"],
        turnaround: "7–10 business days",
      },
    ],
  },
  {
    id: "rigid-signage",
    title: "Rigid Signage",
    summary: "Dimensional signs and display boards for retail, events, and trade shows.",
    products: [
      {
        name: "AlumiCore Metal (ACM)",
        description: "Aluminum composite panels — 3mm or 6mm, single or double-sided.",
        options: ["3mm", "6mm", "CNC routing available"],
        turnaround: "7–10 business days",
      },
      {
        name: "FoamCore",
        description: "Lightweight foam board for indoor displays and presentations.",
        options: ['3/16"', '1/2"', "UltraBoard 3/16"],
        turnaround: "7–10 business days",
      },
      {
        name: "Poster Prints",
        description: 'Luster poster paper up to 41.5" wide.',
        turnaround: "3–5 business days",
      },
    ],
  },
  {
    id: "vinyl-decals",
    title: "Vinyl & Decals",
    summary: "Cut and printed vinyl for vehicles, windows, walls, and equipment.",
    products: [
      {
        name: "Cut Vinyl Decals",
        description: "Precision-cut vinyl in multiple durability grades.",
        options: ["651 (3–4 year)", "751 (4–6 year)", "951 (5–8 year super cast)"],
        turnaround: "3–5 business days",
      },
      {
        name: "Printed Vinyl",
        description: "Full-color printed vinyl with optional die cutting.",
        options: ["Intermediate", "Cast", "Reflective", "50/50 perf", "Vehicle wrap film"],
        turnaround: "3–5 business days",
      },
      {
        name: "Vehicle Wraps",
        description: "Full or partial wraps using premium Arlon SLX+ cast vinyl.",
        turnaround: "7–10 business days",
      },
    ],
  },
  {
    id: "stickers-labels",
    title: "Stickers & Labels",
    summary: "Custom stickers and labels in any quantity — from short runs to bulk.",
    products: [
      {
        name: "Die-Cut Stickers",
        description: "Custom shapes with lamination options.",
        options: ["No lam", "UV lam", "UV bubble-free", "UV high tack", "Cast UV lam", "UV reflective"],
        turnaround: "3–5 business days",
      },
      {
        name: "Magnets",
        description: "Vehicle magnets, square, and rectangle formats with full-color printing.",
        options: ['Car magnets up to 24" wide', 'Square & rectangle sizes'],
        turnaround: "3–7 business days",
      },
    ],
  },
  {
    id: "paper-print",
    title: "Paper & Print",
    summary: "Business collateral, marketing materials, and office printing.",
    products: [
      {
        name: "Business Cards",
        description: "16pt full-color, matte or gloss — standard or metal.",
        options: ["500 or 1,000 qty", "Rounded corners available", "Metal cards (thick, 1-sided)"],
        turnaround: "3–5 business days",
      },
      {
        name: "Post Cards",
        description: "4×6 and 5×7 full-color on 16pt stock.",
        turnaround: "3–5 business days",
      },
      {
        name: "Copies",
        description: "Black & white or full-color copies for presentations and handouts.",
        turnaround: "Same day – 3 business days",
      },
    ],
  },
  {
    id: "apparel",
    title: "Apparel & Wearables",
    summary: "Custom decorated garments for teams, events, and promotions.",
    products: [
      {
        name: "Screen Print (1 Color)",
        description: "Classic screen printing for left chest, crest, and full back placements.",
        options: ["Pocket size", "Crest size", "Full back", "Quantity breaks from 24+"],
        turnaround: "5–7 business days",
      },
      {
        name: "Full-Color Print",
        description: "Vibrant full-color decoration on t-shirts, polos, and more.",
        options: ["Left chest & back", "Crest & back", "Hats (3.5\" × 2.25\" max design)"],
        turnaround: "5–7 business days",
      },
      {
        name: "Sublimation",
        description: "All-over or placement sublimation for polyester garments.",
        turnaround: "5–7 business days",
      },
    ],
  },
  {
    id: "promotional",
    title: "Promotional Products",
    summary: "Branded merchandise for events, giveaways, and client gifts.",
    products: [
      {
        name: "Buttons",
        description: '1.5" and 2.25" pin-back buttons.',
        turnaround: "3–5 business days",
      },
      {
        name: "Drinkware",
        description: "11oz coffee mugs and 20oz insulated tumblers.",
        turnaround: "4–6 business days",
      },
      {
        name: "Coasters & Accessories",
        description: "4\" round fabric coasters, metal license plates, and tag frames.",
        turnaround: "3–6 business days",
      },
    ],
  },
];

export const QUOTE_PROCESS = [
  {
    step: "01",
    title: "Tell us what you need",
    body: "Share the product, quantities, sizes, and any artwork or branding requirements.",
  },
  {
    step: "02",
    title: "We quote it fast",
    body: "Our Quick Quote program delivers accurate pricing within one business day — no guesswork.",
  },
  {
    step: "03",
    title: "Approve & produce",
    body: "Once artwork is approved and payment is received, production begins through our partner shop.",
  },
  {
    step: "04",
    title: "Delivered to you",
    body: "Finished products ship or are ready for pickup. Installation available for signage and wraps.",
  },
] as const;
