/** Illustration slot registry — single source for paths */

export const ILLUSTRATIONS = {
  features: {
    hero: "/brand/illustrations/features/img-hero.png",
    studio: "/brand/illustrations/features/img-studio.png",
    family: "/brand/illustrations/features/img-family.png",
    architecture: "/brand/illustrations/features/img-architecture.png",
  },
  spots: {
    svcBrand: "/brand/illustrations/img-svc-brand.png",
    svcWeb: "/brand/illustrations/img-svc-web.png",
    svcContent: "/brand/illustrations/img-svc-content.png",
    svcSearch: "/brand/illustrations/img-svc-search.png",
    svcVideo: "/brand/illustrations/img-svc-video.png",
    svcDrone: "/brand/illustrations/img-svc-drone.png",
    svcPrint: "/brand/illustrations/img-svc-print.png",
    svcTours: "/brand/illustrations/img-svc-tours.png",
    step1: "/brand/illustrations/img-step-1.png",
    step2: "/brand/illustrations/img-step-2.png",
    step3: "/brand/illustrations/img-step-3.png",
    step4: "/brand/illustrations/img-step-4.png",
    contact: "/brand/illustrations/img-contact.png",
    notFound: "/brand/illustrations/img-404.png",
  },
  work: {
    cover1: "/img/work/img-work-1.jpg",
    cover2: "/img/work/img-work-2.jpg",
    cover3: "/img/work/img-work-3.jpg",
    cover4: "/img/work/img-work-4.jpg",
  },
  accents: {
    underline: "/brand/illustrations/accents/underline.svg",
    arrow: "/brand/illustrations/accents/arrow.svg",
    asterisk: "/brand/illustrations/accents/asterisk.svg",
    star: "/brand/illustrations/accents/star.svg",
    laurel: "/brand/illustrations/accents/laurel.svg",
  },
} as const;

export const MISSING_SLOTS: readonly string[] = [];
