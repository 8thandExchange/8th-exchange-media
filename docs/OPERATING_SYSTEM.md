# Operating the 8E company system

**Date:** 2026-08-18
**Scope:** What this repo can run today, what “do it all” actually requires, and the Meta-first slice that unblocks paid traffic for every brand we operate.

This is the operating map for using 8emedia.com as the control plane for 8th & Exchange Media, the family companies, and every new brand that comes out of logo / site / launch work. It is not a promise that one app replaces every vendor. It is the decision of **what lives here, what stays in a specialist tool, and what stays human.**

---

## 1. What this platform is today

Three surfaces, two stores, one rule: a failing side system must never take a page down.

| Surface | Who | What it already does |
|---|---|---|
| Public site | Prospects | Editorial marketing, Growth Map offer, onboarding wizard, contact, print catalog |
| `/invoicing/*` | Staff | Stripe invoicing, portal clients, brand kits, digital-presence checklist, Social Planner |
| `/portal/*` | Clients | Requests, files, comments, their brand kit |

**Stripe is the invoicing database.** Invoices, customers, products, and payment links are live Stripe objects — no local mirror.

**Supabase holds everything Stripe cannot:** portal clients, requests, brand kits, onboarding leads, GHL tokens. RLS on, no policies; the service-role client is server-only.

**Go High Level is the CRM and social publisher.** The Social Planner in this app is a thin remote control: one body, one media URL, account checkboxes, draft / schedule / publish. Calendar, approvals, per-network variants, and analytics stay in GHL.

Consent-gated analytics already exists (`CookieConsent`). Tracker IDs were empty. This slice fills Meta.

---

## 2. What “run all of our companies” actually means

The requested scope is a full agency operating system, not a brochure site:

| Capability | Role of this platform | Where the work really happens |
|---|---|---|
| Brand / logo | Brand-kit store + requests | Designer + brand-package repo |
| Website build & launch | This codebase for 8E; client sites are their own repos | Next.js / Vercel per property |
| Hosting | Vercel project per site | Vercel + DNS (Hostinger nameservers → Vercel) |
| Social setup | Checklist + GHL connect per client | GHL Social Planner settings (connect the Page, not a personal profile) |
| Social posting | `/invoicing/social` brand picker | GHL owns the queue and tokens |
| Video shoot / edit / clip | Requests + due dates | Humans, Resolve / Premiere, then a URL into the planner |
| YouTube / X / LinkedIn | Same Social Planner once GHL is connected | Native apps for analytics and boosts |
| Email / SMS / CRM | GHL location per brand | GHL workflows (see `docs/GHL_BUILDOUT.md`) |
| Billing | Stripe via `/invoicing` | Stripe Dashboard for disputes / payouts |
| **Paid ads (Meta first)** | **`/invoicing/ads` — connect, pixel, paused campaigns** | **Meta Ads Manager for creative iteration and spend** |
| Google Ads / YouTube ads | Not built — next paid slice | ads.google.com |
| Measurement | Pixel + Conversions API + GA4 slot | Events Manager + GA4 + GHL pipeline |

The product rule, copied from the Social Planner: **intentionally minimal here, specialist UI there.** We do not rebuild Ads Manager, Metricool, or Premiere. We own the connections, the brand scope, the conversion events, and a safe way to stand up a campaign so spend can start.

---

## 3. Family brands and new companies

Every brand — 8E itself, Elevated Health Augusta, CourtPro, 8th Street Construction, Wetzel's, Dink'd, Line of Duty, or a net-new logo-to-launch client — is the same object: a **portal client** with its own brand kit, GHL location, and (now) Meta connection.

```
One brand
  ├── portal_clients row
  ├── brand_kit (voice, colors, guardrails)
  ├── GHL location + Private Integration token
  ├── Meta connection (pixel, ad account, page, system-user token)
  ├── Stripe customer (when they pay us)
  └── onboarding_checklist (Google / Meta / socials / GHL / access audit)
```

**8E Media is the agency row** — GHL and Meta credentials come from env *or* the agency row in `brand_meta_connections` (`client_id` is null). Staff pick “8E Media” in Social Planner and Ads. Never run a client through 8E’s location or 8E’s ad account.

Rollout order is already in `docs/MARKETING_PLAYBOOK.md`: EHA first, then CourtPro + 8th Street, then hospitality brands. Paid traffic is last on each brand, after the GHL trio (speed-to-lead, missed-call text-back, review engine) is live and max CAC is known.

---

## 4. Metricool vs Social Planner vs native Meta

These three get conflated. They are different jobs.

| Tool | Job | Decision |
|---|---|---|
| **GHL Social Planner** (this app’s `/invoicing/social`) | Publish organic to connected accounts | **Keep.** Already multi-brand. Do not add a second queue. |
| **Metricool** | Cross-network analytics, competitor views, some scheduling | Fine as a *read* layer on EHA or other properties. Do not wire a second publisher into this repo. Two queues = the wrong account gets the post. |
| **Native Meta Marketing API** (`/invoicing/ads`) | Paid: pixel, CAPI, ad account, campaigns | **This is the ads path.** GHL’s ads product is a thin wrapper we do not want to depend on for spend. |

Organic posting stays in GHL. Paid stays in Meta (and later Google). Metricool, if used, is dashboards only.

---

## 5. Meta — what you must have that software cannot invent

There is no Meta Pixel ID on 8emedia.com because **only Meta can issue one.** The code path was already there (`NEXT_PUBLIC_META_PIXEL_ID` → consent-gated `fbq`). Empty env means the consent banner stays hidden and no events fire.

Staff still have to do this once per brand, in Meta’s UI. This app then stores the result and uses it.

### 5.1 Create the container (once per brand)

1. [business.facebook.com](https://business.facebook.com) → create a **Business Portfolio**. The **client owns it**. 8E is added as a partner / admin, not as the owner.
2. Create or claim the **Facebook Page**. Complete category, hours, description, cover.
3. Convert Instagram to **Business** and link it to that Page.
4. Business settings → Accounts → **Pages** and **Ad accounts**: create an ad account, add a payment method.
5. Business settings → Brand safety → **Domains**: add `8emedia.com` (or the client’s domain). Meta will give a verification code. Paste it into Ads → connection (`domain_verification`). It is rendered as `<meta name="facebook-domain-verification">` on the public site — not consent-gated, because Meta’s crawler never accepts cookies.
6. Events Manager → create a **Dataset / Pixel**, *or* use **Create pixel** on `/invoicing/ads` after a token is saved. Copy the numeric Pixel ID.

### 5.2 Create a System User token (the only secret this app wants)

Do not paste a personal Facebook password. Same pattern as GHL’s Private Integration token.

1. Business settings → Users → **System users** → create one (Admin).
2. Assign it the ad account, the Page, and the pixel.
3. Generate a token with: `ads_management`, `ads_read`, `business_management`, `pages_read_engagement`, `pages_manage_ads`, `pages_show_list`.
4. Paste token + ad account id (`act_…` or the number) + Page id + Pixel id into `/invoicing/ads` (8E) or the client page (everyone else).

The token is write-only. It never returns to the browser.

### 5.3 What this repo does with those IDs

- **Browser pixel** — consent-gated, public routes only (`/`, `/services`, `/growth-map`, …). Never `/invoicing`, `/portal`, or `/pay`. Staff pageviews must not enter a prospect retargeting audience.
- **Conversions API** — server-side `Contact` (inquiry form) and `Lead` (onboarding wizard), hashed email/phone, `event_id` deduped with the browser event. A Meta outage cannot fail the form.
- **Campaign create** — Campaign + ad set + link ad, **always PAUSED**, default US targeting. Turn spend on in Ads Manager after you look at it.
- **Campaign list** — last 25, so staff can see what this brand already has without leaving the studio.

You still produce creative, iterate hooks, and raise/lower budgets in Ads Manager. That is correct.

### 5.4 8E’s first ads (the agency must be the case study)

From `docs/MARKETING_PLAYBOOK.md` and the Suby gap analysis: an agency with no ads of its own is unbelievable. First campaigns should be education-first, pointed at **The Growth Map** (`https://8emedia.com/growth-map`), not at “start a project.” Do not spend until the Growth Map session actually delivers a written map.

Suggested first objects (create paused, then review):

| Field | Value |
|---|---|
| Objective | Leads (pixel `Lead` event) or Traffic if the pixel is still warming |
| URL | `https://8emedia.com/growth-map` |
| Daily budget | Derived from retainer LTV → max CAC. If that number is not computed, start at $20/day and treat it as tuition, not a channel. |
| Geo | United States; tighten to CSRA / Georgia in Ads Manager once the pixel has traffic |
| Creative | Founder-led, 3-second hook, same cadence as organic (3/week) |

---

## 6. What this PR ships vs what is next

**Shipped**

- Operating map (this file)
- `brand_meta_connections` table (run the SQL in Supabase)
- `/invoicing/ads` with brand picker, connection, pixel create, test event, campaign list + paused create
- Per-client Meta card on the client page
- Consent-gated pixel from stored ID *or* env; domain verification meta tag
- CAPI on contact + onboarding
- Privacy policy updated for advertising cookies

**Not in this slice (deliberate)**

- Google Ads / YouTube ads API
- OAuth “Log in with Facebook” (System User token matches how we already do GHL)
- Creative upload, A/B, Advantage+ shopping, catalog ads
- Metricool API
- Hosting panel for client sites
- Video pipeline

**Next paid slice, when Meta is live on 8E and EHA:** Google Ads (Search for the 3% buy-now traffic) + GA4 conversion import. Same pattern: connection table, brand picker, paused campaigns, specialist UI for the rest.

---

## 7. Environment and Supabase

Agency fallbacks (Vercel → Production):

| Variable | Role |
|---|---|
| `NEXT_PUBLIC_META_PIXEL_ID` | Optional. Browser pixel if no agency row in Supabase. |
| `NEXT_PUBLIC_META_DOMAIN_VERIFY` | Optional. Domain verification if no agency row. |
| `NEXT_PUBLIC_GA4_ID` | Optional. Consent-gated GA4. |
| `META_ACCESS_TOKEN` | Optional. Agency System User token if no agency row. |
| `META_AD_ACCOUNT_ID` | Optional. Agency ad account if no agency row. |
| `META_BUSINESS_ID` | Optional. |
| `META_PAGE_ID` | Optional. |
| `META_PIXEL_ID` | Optional server-side alias for the pixel (CAPI / API). |

Preferred path: save the agency connection in `/invoicing/ads` so a pixel created in-app starts working without a Vercel redeploy.

**Required SQL:** `supabase/migrations/20260818_brand_meta_connections.sql` in the Supabase SQL editor for project `8th-exchange-media`. Until that runs, agency env vars still work; per-client Meta connections will not.

---

## 8. Sharp edges

1. **Wrong brand scope.** `resolveMetaAuth(clientId)` is the Meta twin of `resolveGhlAuth`. A missing `clientId` is 8E. A client id is *that* client’s ad account. Getting this wrong spends the wrong money on the wrong Page.
2. **Cookie is not auth.** `/invoicing/ads` APIs call `requireInvoicingAuth()`.
3. **Tokens never go to the browser.** Same as `ghl_api_token`.
4. **Paused means paused.** This app will not turn spend on. A human does that in Ads Manager.
5. **Health ads (EHA).** GLP-1 / TRT creative needs Meta’s health-ad restrictions and, where required, LegitScript. Do not launch those from the generic form; build them in Ads Manager against EHA’s own pixel and Page.
