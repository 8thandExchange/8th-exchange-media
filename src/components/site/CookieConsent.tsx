"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

/**
 * Consent-first analytics. No tracking script loads until the visitor
 * accepts; declining stores the choice and loads nothing. Tracker ids
 * come from the agency Meta row (layout) or env. With neither set, the
 * banner stays hidden. Staff/portal/pay routes never load trackers —
 * those pageviews must not enter a prospect retargeting audience.
 */

const STORAGE_KEY = "8e-cookie-consent"; // "granted" | "denied"

const ENV_GA4 = process.env.NEXT_PUBLIC_GA4_ID;
const ENV_PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function isPrivatePath(pathname: string): boolean {
  return (
    pathname.startsWith("/invoicing") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/pay")
  );
}

export function CookieConsent({
  pixelId,
  ga4Id,
}: {
  pixelId?: string | null;
  ga4Id?: string | null;
} = {}) {
  // Stored value hydrates via useSyncExternalStore (server snapshot =
  // "loading" so SSR renders nothing); same-tab decisions override it.
  const stored = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem(STORAGE_KEY) ?? "unset",
    () => "loading"
  );
  const pathname = usePathname();
  const [override, setOverride] = useState<"granted" | "denied" | null>(null);
  const choice =
    override ?? (stored === "granted" || stored === "denied" ? stored : stored);
  const GA4_ID = ga4Id || ENV_GA4;
  const PIXEL_ID = pixelId || ENV_PIXEL;
  const HAS_TRACKERS = Boolean(GA4_ID || PIXEL_ID);

  if (isPrivatePath(pathname) || !HAS_TRACKERS || choice === "loading" || choice === "denied") {
    return null;
  }

  if (choice === "granted") {
    return (
      <>
        {GA4_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA4_ID}', { anonymize_ip: true });`}
            </Script>
          </>
        ) : null}
        {PIXEL_ID ? (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
              n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
              document,'script','https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL_ID}');
              fbq('track', 'PageView');`}
          </Script>
        ) : null}
      </>
    );
  }

  const decide = (value: "granted" | "denied") => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setOverride(value);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-xl border border-navy/15 bg-paper p-5 shadow-[0_18px_48px_-16px_rgba(11,27,61,0.35)] sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <p className="text-sm leading-relaxed text-ink/75">
        We use cookies to measure what marketing actually works — the same discipline we sell.
        Analytics runs only if you allow it; saying no changes nothing about how the site works.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => decide("granted")}
          className="btn-pill btn-pill-on-light eyebrow cursor-pointer !text-[0.625rem]"
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => decide("denied")}
          className="nav-link cursor-pointer"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
