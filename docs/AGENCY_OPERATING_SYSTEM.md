# 8E Media — Agency Operating System

**Date:** 2026-08-18
**Question:** what would it take for this platform to run the agency, every current family company, and every new brand that comes in through brand / logo / website / launch / host / social / video / ads?

This file is the map. It is not a promise to rebuild Meta, GHL, or a video NLE inside Next.js. The operating rule is the same one Social Planner already uses: **this repo is the control plane; specialist systems do the heavy work; every action is scoped to one brand.**

---

## Verdict

8emedia.com is already three apps in one repo (public site, staff studio, client portal). That is the right skeleton for a multi-company agency OS. It is **not** yet that OS.

What exists today is enough to *sell* the work, *invoice* it, *intake* a client, *store* a brand kit, *check off* platform setup, and *post* social through Go High Level. What does not exist is a paid-media control plane, a production pipeline for video, a factory for launching and hosting new sites, or a scoreboard that reports CAC against max-CAC per brand.

The first paid-media hole is Meta. The agency has no Pixel id in production (`NEXT_PUBLIC_META_PIXEL_ID` is an empty env stub). Without a Pixel there is no conversion API, no retargeting audience, and no honest way to run ads for 8E or for anyone else. That is why the first build is Meta connection + Pixel + CAPI + a paused-campaign remote control — not Metricool, not a calendar, not a new CMS.

---

## What this repo already is

| Surface | Audience | What it owns |
| --- | --- | --- |
| `/` and marketing pages | Public | Positioning, Growth Map, onboarding, print |
| `/invoicing/*` | 8E staff | Stripe invoicing, leads, portal clients, Social Planner, **Ads** |
| `/portal/*` | Clients | Requests, brand kit, onboarding checklist |

**Two stores, still correct:**

- **Stripe** is the invoicing database. Do not mirror invoices locally.
- **Supabase** holds everything Stripe cannot: portal clients, requests, brand kits, GHL tokens, now Meta tokens.

**GHL** remains the CRM and social publisher. The Social Planner is intentionally thin. Do not replace it with Metricool for posting.

---

## The companies this has to run

Every brand is a `portal_clients` row plus optional GHL location plus optional Meta ad account. Do not invent a second “company” model.

| Wave | Brand | Job of the OS | Paid traffic |
| --- | --- | --- | --- |
| Agency | 8E Media | Be the reference implementation | Own Meta ads → Growth Map |
| 1 | Elevated Health Augusta | Flagship case study; HIPAA-safe tracking | Meta education + Google search, after LTV math |
| 2 | CourtPro Augusta, 8th Street Construction | High-ticket local services | After the universal GHL trio is live |
| 3 | Wetzel's, Dink'd | Reviews, social, events | Light paid, if any |
| Later | Line of Duty Medical + new brand-dev clients | Same line as any new client | Last, budgeted from that brand's LTV |

Client campaigns never run through 8E's GHL location or 8E's Meta ad account. Getting the brand wrong posts (or spends) as the wrong company. That is the sharpest edge in this codebase.

---

## Capability map — “do it all”

Legend: **in** = this repo does it today · **thin** = this repo remote-controls another system · **out** = stays in a specialist tool · **gap** = needed, not built.

### 1. Brand development & logo

| Piece | Status | Where it lives |
| --- | --- | --- |
| Voice, colors, guardrails, asset links | **in** | `brand_kits` + client page editor |
| Logo generation / design studio | **out / gap** | Human + design tools. Store outputs on the kit. Do not build a logo maker here. |
| Client-facing brand page | **in** | `/portal/brand` |

### 2. Website development, launch, hosting

| Piece | Status | Where it lives |
| --- | --- | --- |
| 8emedia.com itself | **in** | This Next.js app on Vercel |
| Client site factory (new Next apps, DNS, SSL) | **gap** | Each client site is its own repo/project (EHA already is). This OS should *track* launch state via the checklist, not host every site. |
| Landing pages / HVCO opt-ins | **gap** | Still the #1 marketing hole (see playbook). Build pages here or in the client repo; capture into that brand's GHL location. |

### 3. Social platform setup

| Piece | Status | Where it lives |
| --- | --- | --- |
| Per-brand checklist (GBP, Meta BM, IG, X, LinkedIn, TikTok, YouTube, GHL) | **in** | `lib/portal/checklist.ts` |
| Actual Page / handle creation | **out** | Done in each platform; staff ticks the box |

### 4. Social management & posting (including YouTube, X, LinkedIn)

| Piece | Status | Where it lives |
| --- | --- | --- |
| Compose / schedule / publish | **thin** | Social Planner → GHL Social Planner API |
| Calendar, approvals, per-network variants, analytics | **out** | GHL's own UI (and optionally Metricool for *reporting*) |
| Native YouTube / X / LinkedIn APIs in this repo | **out** | GHL already holds those OAuth tokens. Rebuilding them here duplicates the sharpest integration we have. |

**Metricool** is a dashboard, not a publisher. Use it later if staff want one analytics pane across networks. Do not route posts through Metricool and GHL at the same time — pick GHL as the publisher (already wired, per-brand scoped).

### 5. Video shooting, editing, clipping

| Piece | Status | Where it lives |
| --- | --- | --- |
| Intake a shoot / edit / clip request | **in** | Portal requests |
| Edit timeline, storage of raws, clip factory | **gap / out** | Frame.io / Drive / CapCut / Premiere. Next slice is a request type + asset links + a weekly “3 clips per brand” ritual, not an in-browser NLE. |

### 6. Paid media

| Piece | Status | Where it lives |
| --- | --- | --- |
| Meta Pixel on 8emedia.com | **thin** | Consent-gated tag, waiting on a real Pixel id |
| Meta CAPI (PageView / Contact / Lead) | **in** (this build) | `/api/meta/capi` + contact + onboarding |
| Connect ad account, create Pixel, list / open paused campaigns | **thin** (this build) | `/invoicing/ads` |
| Ad-set targeting, creative upload, budgets that spend | **out** | Meta Ads Manager |
| Google Ads | **gap** | Same pattern as Meta, second |
| YouTube / LinkedIn ads | **gap** | After Google, and only for brands whose LTV supports it |

### 7. CRM, email, SMS, booking

| Piece | Status | Where it lives |
| --- | --- | --- |
| Speed-to-lead, missed-call, review engine, pipelines | **out / kit** | GHL. Copy in `docs/GHL_BUILDOUT.md` |
| Contact push from site → GHL | **thin** | `lib/ghl.ts` |

### 8. Money

| Piece | Status | Where it lives |
| --- | --- | --- |
| Invoices, customers, payment links | **in** | Stripe, live on every request |
| Per-brand LTV → max CAC scoreboard | **gap** | The number that decides ad spend. Not built. |

---

## Recommended operating model

Keep three layers. Do not collapse them.

```
STAFF CONTROL PLANE     this repo (/invoicing)
  brand picker → GHL social, Meta ads, requests, invoices

SYSTEM OF RECORD
  Stripe          money
  Supabase        clients, kits, tokens
  GHL             CRM + social publish
  Meta            ads + pixel + CAPI
  (later) Google  search ads

HUMAN / SPECIALIST
  brand & logo, video edit, client site code, Ads Manager creative
```

Per-brand wiring (the assembly line from the marketing playbook):

1. Portal client + brand kit + guardrails.
2. GHL sub-account (location id + PIT) on the client page.
3. Meta Business Portfolio: 8E as partner, system-user token + ad account + Pixel on the client page.
4. Universal GHL trio before any ad dollar.
5. Pixel + CAPI live on *that brand's site* (EHA already has a clinic-side pixel; 8E did not).
6. Content cadence: 3 short-form / week through Social Planner.
7. Paid traffic last, budgeted from LTV → max CAC.

---

## Build sequence (technical, not calendar)

1. **Meta for 8E** — this pull request. Pixel, CAPI, Ads page, client Meta card.
2. **Owner action:** create the Business Portfolio / ad account / system user in Meta, paste env vars, create the Pixel from `/invoicing/ads`, set `NEXT_PUBLIC_META_PIXEL_ID`, redeploy. Apply the Supabase migration so client tokens can store.
3. **EHA Meta as a client row** — partner access, not 8E's ad account. Clinic site keeps its own consent-gated pixel; this OS only remote-controls the ad account.
4. **HVCO + opt-in on 8emedia.com** — still the #1 conversion hole. Pixel without a bait page is a speedometer on a parked car.
5. **Google Ads** — same connect / list / paused-campaign shape as Meta.
6. **Scoreboard** — Stripe + GHL + Meta spend → CAC vs max-CAC per brand.
7. **Video request lane** — typed requests, asset URLs, weekly clip quota. Not an editor.
8. **Metricool (optional)** — read-only analytics if GHL's reporting is not enough. Never a second publisher.
9. **Client site factory** — only if brand-dev volume justifies a second Next/Vercel template. Until then, one repo per site.

---

## What this pull request ships

- Staff **Ads** page (`/invoicing/ads`) with the same brand picker as Social Planner.
- Agency setup card with the exact Business Manager steps (there is no Pixel id to invent from code).
- Create a Pixel on a connected ad account; list existing ones.
- List campaigns; create a **PAUSED** campaign only.
- Client Meta connection on the client page (token write-only, verified before save).
- Consent-gated browser Pixel + matching CAPI PageView; CAPI Contact / Lead from the contact and onboarding forms.
- Trackers stay off `/invoicing`, `/portal`, and `/pay`.
- SQL migration for `portal_clients` Meta columns.
- Runbook: `docs/META_ADS.md`.

What it deliberately does not ship: live spend, creative upload, Advantage+ setup, Metricool, Google Ads, or a video editor.
