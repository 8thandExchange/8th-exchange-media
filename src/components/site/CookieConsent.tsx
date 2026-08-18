"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

/**
 * Consent-first analytics. No tracking script loads until the visitor
 * accepts; declining stores the choice and loads nothing. Tracker ids
 * come from env (NEXT_PUBLIC_GA4_ID, NEXT_PUBLIC_META_PIXEL_ID) — with
 * neither set, the banner stays hidden entirely because there is
 * nothing to consent to. Strictly-necessary cookies (sign-in sessions)
 * don't need consent and aren't gated here.
 *
 * Staff, portal, and payment routes never load trackers — audiences
 * must be built from public marketing pages only.
 */

const STORAGE_KEY = "8e-cookie-consent"; // "granted" | "denied"
const CONSENT_COOKIE = "8e_cookie_consent";
const PRIVATE_PREFIXES = ["/invoicing", "/portal", "/pay"];

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const HAS_TRACKERS = Boolean(GA4_ID || PIXEL_ID);

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function persistConsent(value: "granted" | "denied") {
  window.localStorage.setItem(STORAGE_KEY, value);
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function CookieConsent() {
  const pathname = usePathname();
  const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  // Stored value hydrates via useSyncExternalStore (server snapshot =
  // "loading" so SSR renders nothing); same-tab decisions override it.
  const stored = useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem(STORAGE_KEY) ?? "unset",
    () => "loading"
  );
  const [override, setOverride] = useState<"granted" | "denied" | null>(null);
  const choice =
    override ?? (stored === "granted" || stored === "denied" ? stored : stored);

  if (isPrivate || !HAS_TRACKERS || choice === "loading" || choice === "denied") return null;

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
              var eid = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
              fbq('init', '${PIXEL_ID}');
              fbq('track', 'PageView', {}, { eventID: eid });
              try {
                var cookies = document.cookie.split(';').map(function (c) { return c.trim(); });
                var fbp = (cookies.find(function (c) { return c.indexOf('_fbp=') === 0; }) || '').slice(5);
                var fbc = (cookies.find(function (c) { return c.indexOf('_fbc=') === 0; }) || '').slice(5);
                fetch('/api/meta/capi', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  keepalive: true,
                  body: JSON.stringify({
                    eventName: 'PageView',
                    eventId: eid,
                    eventSourceUrl: location.href,
                    fbp: fbp || undefined,
                    fbc: fbc || undefined
                  })
                }).catch(function () {});
              } catch (e) {}`}
          </Script>
        ) : null}
      </>
    );
  }

  const decide = (value: "granted" | "denied") => {
    persistConsent(value);
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
