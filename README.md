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

Legacy URL `media.8thandexchange.com` redirects to `8emedia.com`.

### DNS

Nameservers are managed by Vercel (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`). No further DNS changes needed.

## Brand

Typography: Cormorant Garamond + DM Sans  
Palette: Obsidian, midnight, gold (#c9a84c), cream — aligned with the 8th & Exchange family
