<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Standard commands (`npm run dev` on :3000, `npm run build`, `npm run lint`, `npm test`)
are documented in `CLAUDE.md` and `README.md`; env vars are in `.env.example`. Node 22 is
used. Notes below are the non-obvious things.

- **The dev server boots with zero secrets and the entire public marketing site works
  without any `.env`.** All external clients (`getStripe()`, `getPortalDb()`, Resend, GHL)
  are lazily initialized and only throw/degrade when their feature is actually invoked —
  never at startup. So `npm run dev` alone is enough to develop and test the public pages
  (`/`, `/services`, `/work`, `/about`, `/contact`, `/print`, `/growth-map`, `/onboarding`).
- **The internal tools cannot be exercised end-to-end without secrets.** They fail only
  when hit, not on boot:
  - `/invoicing/*` — the dashboard calls Stripe on render, so it errors without
    `STRIPE_SECRET_KEY`; staff login also needs `INVOICING_ADMIN_PASSWORD`.
  - `/portal/*` — needs `SUPABASE_URL` + `SUPABASE_SECRET_KEY`, and `RESEND_API_KEY` to
    email the 6-digit login code (without Resend, clients cannot log in at all).
  - Contact form (`/api/contact`) and `/onboarding` submit successfully through client +
    server validation but return a graceful 503/500 fallback without `RESEND_API_KEY` /
    Supabase — this is intended behavior, not a bug.
  - Growth OS (`/invoicing/growth`) additionally needs the `supabase/migrations/*` applied.
- **`AGENTS.md`'s top `nextjs-agent-rules` block is rewritten by `next dev` on every run.**
  If it shows up as an uncommitted change, commit it with your work rather than reverting —
  reverting just re-creates the diff. Add durable notes (like these) below the block.
- **The puppeteer scripts (`scripts/shoot.mjs`, `scripts/console-check.mjs`) hardcode a
  macOS Chrome path.** On this VM Chrome is at `/usr/bin/google-chrome-stable`; point the
  script at it (edit the `CHROME` constant or run an inline puppeteer-core launch with that
  `executablePath`) before using them.
