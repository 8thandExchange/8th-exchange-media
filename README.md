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

## Meta ads (Pixel + Ads desk)

There is no Pixel ID until someone creates it in Meta Events Manager — this
repo cannot issue one. After you have the ID:

| Variable | Required to | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_META_PIXEL_ID` | Browser PageView | Consent-gated; public pages only |
| `META_CAPI_ACCESS_TOKEN` | Server Lead events | Events Manager → Generate access token |
| `NEXT_PUBLIC_META_DOMAIN_VERIFY` | Domain verification | Business settings → Domains |
| `META_AD_ACCOUNT_ID` | Campaign list | `act_…` from Ads Manager |
| `META_SYSTEM_USER_TOKEN` | Campaign list | System user with `ads_read` |

Staff desk: `/invoicing/ads`. Per-client IDs: client page → Meta card, after
applying `supabase/migrations/20260818_brand_meta_accounts.sql`. Map:
`docs/OPERATING_SYSTEM.md`.

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
