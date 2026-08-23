# 8th & Exchange Media

Full-service media company website — brand strategy, creative production, digital marketing, and performance media.

A division of [8th & Exchange Capital](https://8thandexchangecapital.com).

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Structure

The home route (`/`) is a single, long-scroll experience with in-page anchor
navigation:

- **Hero** — kinetic headline over the signature grading-suite image
- **#studio** ( 01 ) — positioning / manifesto
- **#services** ( 02 ) — capabilities grid
- **#work** ( 03 ) — selected work
- **#approach** ( 04 ) — the four-step process
- **The Family** ( 05 ) — the 8th & Exchange portfolio
- **#contact** ( 06 ) — inline inquiry form (composes an email)

Deeper interior pages (`/services`, `/work`, `/about`, `/contact`) are fully
elevated to match the homepage — cinematic heroes, motion reveals, and shared
brand components.

## Contact form (Resend)

The inquiry form posts to `/api/contact` and sends via [Resend](https://resend.com).
Set these environment variables in Vercel (or a local `.env.local`):

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `RESEND_API_KEY` | Yes | API key from Resend dashboard |
| `CONTACT_TO_EMAIL` | No | Inbox (default: `media@8thandexchange.com`) |
| `CONTACT_FROM_EMAIL` | No | Verified sender, e.g. `8th & Exchange Media <hello@8thandexchange.com>` |

Without `RESEND_API_KEY`, the form returns a 503 with a clear error message.
Verify your sending domain in Resend before using a custom `CONTACT_FROM_EMAIL`.

**Resend is not just the contact form.** The same key sends portal sign-in codes
(`lib/portal/loginCodes.ts`) — without it, clients cannot log in at all, and
`CONTACT_FROM_EMAIL` doubles as the sender for those codes. Left unset, they go
out from `onboarding@resend.dev` and tend to land in spam.

## Signature details

- Animated **8E monogram** that draws itself (`components/brand/Monogram.tsx`)
- Cinematic brand **preloader** + top **scroll-progress** bar
- **Magnetic** primary buttons, Lenis smooth scrolling, scroll-linked reveals
- Respects `prefers-reduced-motion`

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · Framer Motion · Lenis · TypeScript

## Growth Operating System

The staff dashboard at `/invoicing/growth` provides an evidence-to-outcome
workflow:

1. A bounded, SSRF-protected crawler audits a public website and stores page
   facts rather than raw HTML.
2. Versioned rules turn evidence into transparent impact/confidence/effort
   opportunities.
3. Staff converts an accepted opportunity into a campaign brief, nine editorial
   graphics (house type, brand color, designed lockups), channel copy, and a
   measurable hypothesis. Public copy is written for people, not from audit notes.
4. Campaign approval freezes graphics. Launch creates drafts in the existing
   social pipeline; it never publishes directly.
5. Clients see approved campaigns and progress at `/portal/growth`.

Apply `supabase/migrations/20260822105000_growth_os_v1.sql` before using this
feature. All Growth OS tables have RLS enabled with no browser policies and are
accessed only through the server-side service-role client.

Campaign generation works without an AI provider. Set `GROWTH_AI_MODEL` to a
Vercel AI Gateway model identifier to enable bounded copy refinement; evidence,
scores, offers, destinations, account IDs, approvals, and measurements remain
outside the model's control. Set `APP_BASE_URL` to the production origin so GHL
can fetch approved PNG graphics.

### Creative Production

Approved Growth OS campaigns can open a versioned production package at
`/invoicing/production`. The module includes:

- a hook library and timed Script Lab with immutable revisions;
- script-linked shot plans and storyboard frames;
- evidence-backed SEO briefs without fabricated volume or ranking data;
- channel copy, thumbnails, and a repurposing matrix;
- asset ownership, license, release, territory, and expiration records;
- deterministic QA, optimistic workflow locking, and exact-hash approvals;
- client package review at `/portal/production`;
- approved final masters handed to the Content Pipeline as drafts only.

Apply `supabase/migrations/20260822133000_creative_production_os_v2.sql`.
The complete system operates deterministically when AI is unavailable. Set
`PRODUCTION_AI_MODEL` to use a separate Gateway model for bounded spoken-copy
refinement; it falls back to `GROWTH_AI_MODEL`.

```bash
npm test
npm run lint
npm run build
```

## Deployment

Hosted on Vercel (project `8th-exchange-media`).

```bash
npx vercel deploy --prod
```

Production: https://8emedia.com

### If pushes are not auto-deploying

1. Open [Vercel → 8th-exchange-media → Settings → Git](https://vercel.com/dashboard) and confirm the repo is `8thandExchange/8th-exchange-media` with production branch **`master`**.
2. **Deployments → Redeploy** the latest `master` commit, or run `npx vercel deploy --prod` locally after `vercel login`.
3. Optional CI deploy (pick one):
   - **Easiest:** Vercel → Project → Settings → Git → **Deploy Hooks** → create hook for `master` → add URL as GitHub secret `VERCEL_DEPLOY_HOOK`.
   - **Full CLI:** add GitHub secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.
   Pushes to `master` deploy via `.github/workflows/vercel-production.yml`.

After deploy, hard-refresh `/invoicing/invoices/new` and confirm **Due on receipt** appears in payment terms.

Legacy URL `media.8thandexchange.com` redirects to `8emedia.com`.

### DNS

The domain is **registered at Hostinger**; its nameservers are delegated to
Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). So DNS *records* are managed
in the Vercel dashboard, but the *nameservers* themselves are only changeable in
Hostinger's hPanel — Vercel cannot fix a broken delegation on its own.

If `8emedia.com` starts serving a "Parked Domain name on Hostinger DNS system"
page, the delegation has been reset. Confirm with:

```bash
dig +short 8emedia.com NS        # expect ns1/ns2.vercel-dns.com
npx vercel domains inspect 8emedia.com
```

Repoint it in hPanel → Domains → 8emedia.com → DNS / Nameservers → custom
nameservers. Propagation takes 15–60 minutes, and Vercel reissues the
certificate on its own. Local DNS caching will keep showing the old answer well
after it is fixed — verify with `curl --resolve` against a Vercel IP rather than
trusting the browser.

`8emedia.com` carries no MX or TXT records: company mail runs on
`8thandexchange.com`, a separate domain still on Hostinger's own nameservers.
Changing this domain's DNS does not touch email.

## Brand

Typography: Cormorant Garamond + DM Sans  
Palette: Obsidian, midnight, gold (#c9a84c), cream — aligned with the 8th & Exchange family
