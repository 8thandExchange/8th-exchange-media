# Operating 8E — every company from this platform

**Date:** 2026-08-18
**Audience:** staff. This is the map for running 8th & Exchange Media, the Capital family brands, and every new company that comes in through brand / web / launch work.

The one-paragraph verdict: **this repo is the operating desk, not the factory.** Stripe already is invoicing. Go High Level already is CRM, email, SMS, booking, and social publishing. Meta already is ads. Metricool (or GHL insights) already is social reporting. Vercel already is hosting. Trying to rebuild those products inside Next.js would stall the agency and still lose to the originals. What we *do* own here is the brand record, the staff/client traffic, the per-company connections, and the measurement that makes paid media honest.

The in-product version of this table lives at `/invoicing/ads`.

---

## 1. What “run all of our companies” actually means

A company arriving through brand development needs the same machine, whether it is 8E itself, Elevated Health Augusta, Wetzel’s, Dink’d, or a net-new mark:

| Lane | System of record | This app’s job | Status |
| --- | --- | --- | --- |
| Brand, logo, voice, claims guardrails | `brand_kits` + client notes | Editor on the client page; every asset inherits it | Live |
| Website, launch, hosting | Vercel (one project per site) | 8emedia.com lives here. Client sites do **not**. Track the build as a portal request | Connect — do not host them in this repo |
| Invoicing & collections | Stripe | Staff desk is a live remote control. No invoice mirror | Live |
| CRM, email, SMS, calendars, pipelines | Go High Level — **one location per brand** | Lead push + location/token on the client page | Live |
| Social setup + posting (FB, IG, LinkedIn, X, TikTok, YouTube, GBP) | GHL Social Planner (OAuth + queue) | Thin composer at `/invoicing/social` | Live |
| Social analytics / competitors / unified reporting | Metricool (or GHL’s own UI) | Link out. Do not clone Metricool | Connect |
| Meta Pixel, CAPI, ad-account registry | Meta Events Manager + this desk | Consent-gated Pixel on marketing routes; CAPI on leads; IDs per brand | **This slice** |
| Creating / optimizing Meta campaigns | Meta Ads Manager | Read campaigns + 30-day spend when a system-user token is set; deep-link to Ads Manager | **This slice** |
| Google Analytics, Search Console, Google Ads | Google | GA4 id is already consent-gated. Same connection pattern as Meta, later | Not started |
| Video shoot, edit, clip, YouTube packaging | People + Resolve / Frame.io / Drive | Portal requests + brand kit. No in-app editor | Human work |
| Client intake & production traffic | Supabase `portal_requests`, `onboarding_leads` | Portal + staff request desk + `/onboarding` | Live |

Two rules that already keep this from becoming a hostage situation:

1. **One brand, one GHL location, one Meta Business Portfolio, one ad account.** Client owns the assets. 8E holds partner / system-user access. Never run a client through 8E’s Pixel, GHL location, or ad account.
2. **A failing side system must not take a page down.** Social Planner already works when Supabase is unreachable. The Ads desk copies that: missing Pixel, missing table, or a dead Meta token still renders the page with an actionable error.

---

## 2. What we will not build here

- A Meta Ads Manager clone (audiences, bid strategies, creative review, Advantage+, billing, policy). Meta will reject a homemade campaign UI faster than we can maintain it, and App Review for `ads_management` is a product of its own.
- A Metricool clone (competitor spy, unified inbox charts, best-time-to-post). GHL already publishes; Metricool already reports. Use them.
- A video NLE, a website CMS for every client site, or a second CRM.
- Client Pixels injected onto 8emedia.com. That would mix audiences and wreck attribution. 8E’s Pixel stays on 8emedia.com; each client Pixel stays on that client’s domain.

If a future slice *creates* campaigns from this desk, it should be a thin Marketing API write on top of a stored system-user token — after measurement is proven and App Review is done — not a from-scratch ads product.

---

## 3. Meta first — why, and what was missing

Paid social is the first lane that is *not* already a thin remote control. The site already had consent-gated Pixel *plumbing* (`NEXT_PUBLIC_META_PIXEL_ID` + the cookie banner) and a client checklist item for “Meta Pixel / Dataset,” but:

- No Pixel ID exists in Vercel, so the banner never appears and nothing fires.
- No Conversions API, so form leads would be lost to ITP / ad blockers even after a Pixel existed.
- Pixel was mounted on the root layout, so `/invoicing` and `/portal` would have been painted into retargeting audiences the moment an ID was set.
- Contact form emailed Resend only — no GHL contact, no Meta Lead.
- No staff place to see, per brand, whether Pixel / ad account / tokens were on file.
- No way to read live campaigns without logging into a personal Facebook profile.

This slice closes those gaps. It does **not** mint a Pixel ID. Meta Events Manager is the only place that can.

---

## 4. Create the 8E Pixel (agency) — do this once

Staff path: `/invoicing/ads` (8E Media selected). The page repeats these steps when the env var is empty.

1. Open [business.facebook.com](https://business.facebook.com) as 8th & Exchange Media. Create the Business Portfolio if it does not exist. 8E admins only — no shared personal logins.
2. **Events Manager → Data sources → Add → Web → Meta Pixel.** Name it `8E Media — 8emedia.com`. Copy the numeric Pixel ID.
3. Vercel → project `8th-exchange-media` → Settings → Environment Variables:
   - `NEXT_PUBLIC_META_PIXEL_ID` = that ID (Production + Preview)
   - Redeploy. The consent banner now appears on public pages only.
4. Same dataset → Settings → **Generate access token** → `META_CAPI_ACCESS_TOKEN` (server-only, never `NEXT_PUBLIC_`).
5. Business settings → Brand safety → Domains → add `8emedia.com`. Paste the verification code as `NEXT_PUBLIC_META_DOMAIN_VERIFY` and redeploy.
6. Accounts → Ad accounts → create / claim the 8E ad account, add a payment method. Users → System users → generate a token with `ads_read`, assign it to that ad account. Set `META_AD_ACCOUNT_ID` and `META_SYSTEM_USER_TOKEN`.
7. Events Manager → Test events: load 8emedia.com, accept cookies, confirm PageView. Submit `/contact` once, confirm Lead (browser + CAPI, same `event_id`).

Until step 3 is done, this codebase cannot show a Pixel in the wild. There is nothing to invent.

### Client brands (EHA, and every new company)

Same six objects, **in the client’s portfolio**, stored on `/invoicing/clients/<id>` (Meta card) after `brand_meta_accounts` is applied in Supabase:

`supabase/migrations/20260818_brand_meta_accounts.sql`

Install that Pixel on **their** site. The Ads desk brand picker then lists their campaigns when the system-user token is present.

---

## 5. How ads actually run (first 30 days after the Pixel exists)

Do not spend until Events Manager shows PageView and Lead on 8emedia.com.

Recommended first 8E campaign (from the existing playbook, not a new offer):

- **Objective:** Leads / conversions, not traffic.
- **Conversion event:** Lead (CAPI + Pixel, already wired on `/contact` and `/onboarding`).
- **Destination:** `/growth-map` or `/onboarding` — not a cold homepage dump.
- **Audience:** Augusta + surrounding, interest stacks later. Build a remarketing audience from Pixel PageView only after 100+ unique visitors; until then, run prospecting.
- **Creative:** founder-led short-form that already exists in the Social Planner cadence. Native, 3-second hook, one CTA.
- **Budget:** start small enough that a dead pixel is obvious (daily cap you can afford to learn with). Kill/scale on cost per Lead vs the retainer max-CAC math in `docs/MARKETING_PLAYBOOK.md`.

Client campaigns follow the same anatomy inside *their* ad account. Health-adjacent brands (EHA) keep the HIPAA posture already documented: remarketing from public marketing pages only, never portal or checkout, and platform health-ad certification before GLP-1 / TRT spend.

---

## 6. Metricool and Social Planner — who does what

They are not competitors.

| Job | Tool |
| --- | --- |
| Compose / schedule / publish as a brand | This app → GHL (`/invoicing/social`) |
| OAuth into Facebook, Instagram, LinkedIn, X, YouTube, TikTok, GBP | GHL Social Planner settings (connect the **Page**, not a personal profile) |
| Calendar, approvals, per-network variants | GHL’s own UI |
| Cross-network analytics, competitors, reporting screenshots for clients | Metricool |
| Paid Meta | This Ads desk + Ads Manager |

If Metricool is already wired for EHA, keep it. Add 8E as its own Metricool brand. Do not pull Metricool charts into this repo until reporting is a staff bottleneck — it is not the blocker for running ads.

---

## 7. Onboarding a new company (the whole machine)

Use the client page checklist. The critical path before any ad dollar:

1. Client owns Google Business Profile, Meta Business Portfolio, social handles, domain.
2. GHL sub-account created (copy `docs/GHL_BUILDOUT.md`), location id + PIT token saved here.
3. Social accounts connected in that GHL location.
4. Meta Pixel created in *their* Events Manager, installed on *their* site, IDs saved here.
5. Domain verified in Meta. CAPI token stored.
6. Universal GHL trio live: speed-to-lead, missed-call text-back, review engine.
7. Test lead: form → GA4 + Meta dataset + GHL pipeline.
8. Then Ads Manager. Not before.

Website / logo / video jobs are portal requests against the brand kit. Hosting a new site is a new Vercel project, not a folder in this one.

---

## 8. Environment (agency)

| Variable | Where it lives | What it unlocks |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Vercel, public | Consent banner + browser PageView / Lead |
| `META_CAPI_ACCESS_TOKEN` | Vercel, secret | Server-side Lead on contact + onboarding |
| `NEXT_PUBLIC_META_DOMAIN_VERIFY` | Vercel, public | `facebook-domain-verification` meta tag |
| `META_AD_ACCOUNT_ID` | Vercel, secret | Ads Manager deep link + campaign list |
| `META_SYSTEM_USER_TOKEN` | Vercel, secret | Graph API `ads_read` |
| `META_CAPI_TEST_EVENT_CODE` | Vercel, secret, optional | Events Manager test stream while wiring |
| Client Pixel / tokens | Supabase `brand_meta_accounts` | Ads desk brand picker |

Client GHL tokens stay on `portal_clients`. Never put a client CAPI or system-user token in Vercel env.

---

## 9. Later slices (only after 8E’s own Pixel is live)

1. Prove PageView + Lead in Events Manager, then the first 8E campaign.
2. Apply the Supabase migration; file EHA (and every other brand) Meta IDs on their client page.
3. Google Ads connection on the same desk (separate brand-picker column, same philosophy).
4. Metricool deep-links per brand, if staff keep bouncing out for reporting.
5. Marketing API *writes* (create campaign from a brief) — only with a reviewed Meta app and `ads_management`.
