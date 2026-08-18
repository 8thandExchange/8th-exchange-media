@AGENTS.md

# 8th & Exchange Media

The marketing site *and* the internal operating tool for 8E Media — a full-service
media company in Augusta, GA (a division of 8th & Exchange Capital). Production is
[8emedia.com](https://8emedia.com) on Vercel, project `8th-exchange-media`, production
branch `master`. `media.8thandexchange.com` redirects to the apex.

Next.js 16 · React 19 · Tailwind 4 · Framer Motion · Lenis · TypeScript.

## Three apps in one codebase

Know which one you're in before changing anything — they have different auth, different
data stores, and different audiences.

| Route | Who | Auth | Data lives in |
| --- | --- | --- | --- |
| `/`, `/services`, `/work`, `/about`, `/contact`, `/print`, `/growth-map`, `/onboarding` | Public | none | Hardcoded in `src/lib/` |
| `/invoicing/*` | 8E staff | Shared password → `8e_invoicing_session` cookie | Stripe + Supabase + GHL + Meta |
| `/portal/*` | Clients | Emailed 6-digit code → `8e_portal_session` cookie | Supabase |

`src/middleware.ts` gates both private trees on cookie presence only. **The cookie is not
the authorization check** — every server action and route handler must call
`requireInvoicingAuth()` (`lib/invoicing/auth`) or `requirePortalClient()`
(`lib/portal/auth`) itself. Skipping that is the easiest way to open a hole here.

## Data model — two stores, deliberately

**Stripe is the invoicing database.** There is no local mirror of invoices, customers,
products, or payment links. `lib/invoicing/service.ts` calls Stripe live on every request
and `stripe-mappers.ts` shapes the result. Don't add a caching table; do expect list pages
to be slow-ish and paginated at Stripe's limits.

**Supabase holds everything Stripe can't.** Tables: `portal_clients`, `portal_requests`,
`portal_request_updates`, `portal_request_files`, `portal_login_codes`, `onboarding_leads`,
`brand_kits`. All have RLS on with **no policies** — the service-role client in
`lib/portal/db.ts` is the only way in, so it is server-only and must never reach the
browser. `portal_clients.stripe_customer_id` is the single link between the two stores.
Client Meta tokens (`meta_access_token` and friends) live on `portal_clients` the same
way GHL tokens do — apply `supabase/migrations/20260818_portal_clients_meta.sql` before
connecting a client ad account.

## Go High Level

GHL is the agency's CRM and social publisher. This app is a thin remote control over its
REST API (`lib/ghl.ts`) — GHL owns the queue, the OAuth tokens, and the actual publishing.

Every staff action that touches GHL must resolve *which* sub-account first, via
`resolveGhlAuth(clientId)` in `lib/portal/ghlAuth.ts`:

- `null` → the agency's own location, from `GHL_API_TOKEN` / `GHL_LOCATION_ID`
- a client id → that client's stored location id + Private Integration token

Getting this wrong posts a client's content to 8E's own accounts, or vice versa. It is the
sharpest edge in the codebase.

The Social Planner (`/invoicing/social`) is intentionally minimal: one text body, one media
URL, account checkboxes, draft/schedule/publish. No calendar, no approvals, no per-network
variants, no analytics — those live in GHL's own UI. The posts table reads 30 days back and
90 days forward, capped at 25.

## Meta Ads

Meta is the paid-media remote control (`lib/meta.ts`). Meta owns Ads Manager, billing, and
review; this app verifies the connection, creates a Pixel, lists campaigns, and opens a
**paused** campaign. It will not turn spend on.

Every staff action that touches Meta must resolve *which* ad account first, via
`resolveMetaAuth(clientId)` in `lib/portal/metaAuth.ts`:

- `null` → the agency's own account, from `META_ACCESS_TOKEN` / `META_AD_ACCOUNT_ID`
- a client id → that client's stored ad account id + system-user token

Getting this wrong spends a client's budget on 8E's ads, or vice versa. Same sharp edge as GHL.

The Ads page (`/invoicing/ads`) degrades when Meta is unreachable or unconfigured — the rest
of the studio still loads. There is no Pixel id until someone creates it in Meta (the Ads
page can do that once the token is set). `NEXT_PUBLIC_META_PIXEL_ID` then has to be added
in Vercel and redeployed before 8emedia.com sends consent-gated PageView + CAPI events.

Runbook: `docs/META_ADS.md`. Why this is the first OS slice: `docs/AGENCY_OPERATING_SYSTEM.md`.

## Conventions

- **Two separate design systems.** Public pages use the editorial system in `globals.css`
  (`type-display`, `surface-navy`, `eyebrow`, `btn-pill-*`, `hairline`) with Cormorant
  Garamond + DM Sans and gold `#c9a84c`. Staff/portal pages use the flat `inv-*` system in
  `src/app/invoicing/invoicing.css` (`inv-card`, `inv-btn`, `inv-table`, `inv-alert`).
  Never mix them — the tools are meant to look plain.
- **Motion rules are non-negotiable** and live in `.cursor/rules/motion-design.mdc`. Read it
  before touching anything animated. Everything respects `prefers-reduced-motion`.
- Server Components by default; `"use client"` only for real interactivity. Private pages
  set `export const dynamic = "force-dynamic"`.
- A failing side system must never take a page down. The Social Planner still works when
  Supabase is unreachable; copy that pattern (try/catch, log, degrade) for anything new.
- Route handlers return `{ error: string }` with a real status code; the UI surfaces that
  string verbatim to staff. Write error messages someone can act on — name the missing
  setting and where to fix it.

## Commands

```bash
npm run dev      # localhost:3000
npm run build    # must pass before any push
npm run lint
```

`scripts/console-check.mjs` and `scripts/shoot.mjs` drive puppeteer-core for console errors
and screenshots.

## Deploying

Pushes to `master` should auto-deploy. When they don't, `npx vercel deploy --prod` after
`vercel login`. See README for the deploy-hook fallback.

## Environment

See `.env.example`. Nothing works without `STRIPE_SECRET_KEY`, `SUPABASE_URL` +
`SUPABASE_SECRET_KEY`, and `INVOICING_ADMIN_PASSWORD`. `RESEND_API_KEY` sends both the
contact form and portal login codes — without it, clients cannot log in. Session secrets
fall back to `STRIPE_SECRET_KEY` and then to a hardcoded dev string, so **always set
`INVOICING_SESSION_SECRET` and `PORTAL_SESSION_SECRET` in production**.
