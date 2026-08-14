# Sell Like Crazy Gap Analysis — Elevated Health Augusta × 8th & Exchange Media
**Date:** 2026-08-13
**Framework:** Sabri Suby's 8-phase system (*Sell Like Crazy*, King Kong), including his 2024–26 updates (AI-drafted creative volume, founder-led short-form, platform-AI era targeting).
**Scope:** Both properties — the clinic (elevatedhealthaugusta.com) and the agency that executes for it (8emedia.com). This file is kept identical in both repos: `docs/marketing/` (EHA) and `docs/` (8E).

The one-paragraph verdict: **both funnels are built exclusively for the 3% of buyers who are ready today, and neither has any machinery for the other 97%.** Suby's Larger Market Formula says at any moment ~3% of a market is in buy-now mode, ~17% is gathering information, ~20% is problem-aware, and ~60% doesn't know it has the problem. EHA's site is program pages plus "Book the $79 assessment"; 8E's site is a (beautiful) portfolio plus "start a project." Every gap below is some version of: no bait for the 97%, no capture, no nurture, no engineered offer, and no unit-economics ceiling for ad spend. The infrastructure to fix it already exists — GHL for both brands (per-client scoping shipped 2026-08-13), Meta Pixel consent-gated on the clinic site, 8E's Social Planner, onboarding wizard, and brand-kit engine.

---

## The framework in one table

| Phase | Suby's rule | EHA today | 8E today |
|---|---|---|---|
| 1. Dream Buyer | One avatar per offer, built from HALO-harvested verbatim language | ✗ none documented | ✗ none documented |
| 2. HVCO (bait) | Free asset solving ONE burning problem, tabloid-grade title | ✗ none | ✗ none |
| 3. Capture | Dedicated opt-in page, 2 fields, no nav | ✗ no email capture on site at all | △ onboarding wizard exists, but it's a request-a-quote, not bait |
| 4. Godfather Offer | Reason-why + value stack + premiums + power guarantee + honest scarcity | △ $79 assessment is a good entry price with zero offer framing | ✗ "start a project" — no offer at all |
| 5. Traffic | Google for the 3%, Meta/YT education for the 97%; copy is the moat | ✗ pixel wired (consent-gated), no campaigns, no ad copy system | ✗ no own ads (the agency must be its own best case study) |
| 6. Magic Lantern | 2–3 pure-value pieces walking non-bookers toward the outcome | ✗ nothing | ✗ nothing |
| 7. Sales conversion | Application → triage → doctor-frame call, 2-min pitch, silence | △ paid assessment *is* triage; enrollment call exists but no doctor-frame script | △ wizard collects budget/goals (application ✓); no strategy-session offer wrapping it |
| 8. Automate & ascend | Owned email list, plain-text cadence, ascension ladder, retention > acquisition | △ strong clinical retention; zero marketing email, no referral program | ✗ no list, no cadence, no productized ascension |
| Copy | 17-step long-form pages, proof stacking, prospect's exact words | ✗ pages are elegant but not direct-response; **one fabricated testimonial (must remove)** | ✗ editorial voice, no proof wall, no long-form sales page |
| Economics | Max CAC derived from LTV; he who can spend most wins | ✗ never computed | ✗ never computed |
| 2024+ layer | Founder-led faces, ~3 short-form creatives/week, 3-sec hooks, AI drafting volume, one conversion action | ✗ | ✗ |

Legend: ✗ missing · △ partial

---

## EHA — the ten gaps, in priority order

### GAP 1 (fix first, costs nothing): the fabricated testimonial
`src/components/NotReadyToBook.tsx` variant "c" ships *"Sarah M., Augusta patient since 2023"*, *"500+ patients"*, and *"they even helped me understand my insurance benefits"* — on a cash-pay clinic that opened in 2026 and does not bill insurance. This is an invented review (an FTC problem and a trust bomb if a patient ever notices) that also contradicts the clinic's own positioning. Suby's proof-stacking rule is *quantified real proof*; fabricated proof is the one thing worse than no proof. **Remove the variant; replace with real Google-review pull-through once the review engine (below) produces volume.**

### GAP 2: no unit economics, so no spend ceiling
Suby's scoreboard is LTV → max allowable CAC → "he who can spend the most to acquire a customer wins." Nobody has computed EHA's numbers. The raw material is in Stripe already. Directional math to be replaced with real retention data:

| Program | Monthly margin proxy | If median retention is 6 mo | Max CAC at 3:1 LTV:CAC |
|---|---|---|---|
| GLP-1 sema $349 | ~$200–250 | LTV ~$1,200–1,500 | **$400–500** |
| TRT $249 | ~$170–200 | LTV ~$1,000–1,200 | **$330–400** |
| HRT $229 | ~$155–185 | LTV ~$900–1,100 | **$300–370** |

A local competitor buying "weight loss clinic augusta" leads at $150 CAC loses the auction to a clinic that *knows* it can pay $450. Add-on attach (combos +$129–349/mo) and the IV lane push LTV higher — Suby's "Black Tiger" inversion says spend 80% of effort raising LTV/AOV, 20% cutting CAC, then outbid everyone. **Action: pull real cohort retention from Stripe (first cohorts are now 2–3 months old), compute per-program LTV quarterly, publish max CAC in this folder, and set ad budgets from it — not from gut.**

### GAP 3: nothing for the 97% — no HVCO, no capture
The entire site funnels to booking. A 52-year-old woman who suspects her fatigue is hormonal but isn't ready to book has *nothing to take*. Build three HVCOs, one per avatar (Phase 1 avatars below), each a 2-page PDF or 3-minute video, each with its own stripped opt-in page (headline = HVCO title, 3–5 fascination bullets, mock-up image, name + email only, GHL form → EHA location):

1. **"The 7 lab markers your annual physical misses — and what they say about your energy, weight, and drive."** (Feeds all three lines; the clinic's actual Comprehensive/Expanded panels are the payoff.)
2. **GLP-1 candidacy quiz** — "Is medical weight loss right for you? 12 questions." (The `ConsultPrequal` component is 70% of the build; quiz funnels are Suby's highest-converting HVCO format for the 20% problem-aware tier.)
3. **"The real cost of feeling 'fine': cash-pay pricing decoded"** — the transparency story EHA already tells, weaponized as bait (compare hidden-fee competitors' first-year cost vs EHA's one number).

Guardrails apply to bait too: no outcome promises, no retatrutide, no Maintain-tier acquisition marketing.

### GAP 4: the $79 assessment is a price, not a Godfather Offer
Right now: "Book Your $79 Wellness Assessment." Suby's seven ingredients are all absent — no reason-why, no value stack, no premium, no risk reversal, no scarcity. The offer rebuilt (copy direction, owner approves final):

> **The $79 Elevated Baseline** — 30–45 minutes with our RN: full health history, vitals, body composition, and a written, personalized treatment roadmap you keep whether or not you ever come back. *(Value stack: $79 visit + body-comp analysis + written roadmap — itemize it.)* **Why $79?** Because we'd rather earn your trust with an honest baseline than bill your insurance $400 for a rushed physical. **Guarantee:** you leave with a written plan in hand, or the visit is free. **Capacity:** our RN sees a limited number of new assessments each week — real scarcity, state it as such.

Note the guarantee is about the *deliverable* (a written plan), never a clinical outcome — that keeps it inside both medical-marketing rules and the clinic's own no-outcome-promises guardrail. Bonus/premium candidate (owner decision): apply the $79 as a credit toward first-month membership on enrollment.

### GAP 5: no nurture (Magic Lantern) behind any capture
GHL sequences to build per line, 80% value / 20% pitch, each piece open-looping the next, soft CTA to the assessment: V1 "How to read your own lab report" → V2 "Three things that move these markers in 30 days" → V3 "What treatment actually looks like here (a walkthrough, no names)" → book. The phone AI already captures name/phone/email/interest on every call — **those captured leads currently go into a nurture void**; wire them into the same sequences.

### GAP 6: traffic — infrastructure without campaigns
Pixel, Metricool, GHL chat: wired, consent-gated, marketing-routes-only (good — that's the HIPAA-safe posture; keep remarketing audiences built only from public marketing pages, never portal/checkout paths). Missing: the campaigns. Suby split:
- **3% (Google Search):** "trt clinic augusta", "testosterone therapy evans ga", "medical weight loss augusta", "hormone doctor near me", "iv therapy augusta". Point at program pages rebuilt per GAP 8. Expect ~20 headline iterations per ad group before a control emerges.
- **97% (Meta/YouTube):** education-first, native-looking creative pointed at HVCOs, never straight at checkout. GLP-1/TRT campaigns run under platform health-ad certification (LegitScript where required); creative pivots to condition-and-service framing ("medical weight loss program"), never drug names, which also keeps the retatrutide/Maintain guardrails structurally safe.

### GAP 7: no doctor-frame on the one human sales moment
The enrollment call (protocol approved → enroll → then Rx) is EHA's sales call, and a clinic can run Suby's "sell like a doctor" frame *literally*. Script structure for the existing call-scripts library: diagnose first (their words: why now, what they've tried, cost of doing nothing, readiness 1–10) → 2-minute prescription using their exact words → state the monthly price → silence. Add the readiness/motivation questions to intake so the caller has them on screen (they also become lead-scoring data).

### GAP 8: pages aren't sales pages
Program pages (WeightLoss, HormonesMen, HormonesWomen, IVLounge) should each follow the 17-step anatomy — audience call-out → promise → problem → solution → credentials → benefits → proof → offer (GAP 4 framing) → price → honest scarcity → deliverable guarantee → one CTA → P.S. Long-form wins; EHA's transparency story is genuinely differentiated raw material. Build a **real proof inventory** to stack: Google review count/rating (see GAP 9), patients served (real number only), years of physician experience, "one monthly price, no hidden fees" vs itemized competitor comparison (PricingComparison page already exists — surface its content on program pages).

### GAP 9: review engine (the local-market proof wall)
Post-visit review ask via GHL (SMS, after IV visits and assessments — transactional consent covers a service-feedback ask; keep it a simple "how was it + Google link"). Local pack rankings for "weight loss clinic augusta" etc. are won on review velocity; every future proof stack depends on this compounding early.

### GAP 10: retention is clinical, not commercial
Quarterly labs, RN check-ins, Nobody Waits — excellent clinical retention machinery, zero commercial layer on top: no weekly owned-list email (plain-text, personal sender, one story + one soft CTA — this is also what warms the HVCO list), no referral program (member gets X, referee gets Y — owner decision on incentive), no win-back sequence for lapsed members (where provider-offered **Maintain** naturally lives — retention/downsell only, never acquisition, per the standing guardrail). SMS marketing runs only against contacts with explicit marketing consent captured at the new opt-ins; the existing Twilio traffic stays transactional.

---

## 8E Media — the agency must be the reference implementation

King Kong's own funnel is the template: high-volume founder-led creative → free-book/HVCO funnel → proof-walled homepage → free "$1,000-value" strategy session gated by a 12-question application → doctor-frame call delivering a growth map → ascension (course vs agency). 8E's gaps against it:

1. **No Godfather Offer.** "Start a project" asks the prospect to do the selling. Build the signature offer: **"The Growth Map — a free 30-minute strategy session"**: we audit your ads, funnel, and follow-up before the call, you leave with a written 90-day growth map whether or not you hire us ($1,000-stated-value deliverable, reason-why = we'd rather show than pitch, honest capacity scarcity = we take N new clients/quarter). *Consultant's caution from King Kong's own Trustpilot: the free session must actually deliver the map, or it burns trust — the deliverable is the marketing.*
2. **Onboarding wizard → application.** The wizard already collects budget/goals/timeline — that *is* Suby's qualification application. Add motivation/readiness (1–10) and current-results questions, route low scorers to nurture instead of the calendar, and put the wizard *behind* the Growth Map offer instead of behind "start a project."
3. **No HVCO.** First bait asset: **"The 5-point creative autopsy: why your cost per lead doubled this year"** — teardown format, which doubles as the Magic Lantern series (3 teardown emails) for wizard leads who don't book. All capture → 8E's GHL location (already wired).
4. **No proof wall.** StatGrid exists as a component; fill it with real numbers only (clients, campaigns shipped, portfolio brands) and grow it. The EHA engagement itself becomes the flagship case study — instrument it from day one (CAC, bookings, member growth) so the numbers exist to publish (with EHA's approval).
5. **No own ads, no founder content.** The agency that runs no ads for itself is unbelievable. Minimum viable: 3 short-form pieces/week through its own Social Planner (now multi-brand), founder-led, 3-second hooks, all pointing at the Growth Map. AI-draft the variants (brand-kit engine feeds the copy voice), human-edit every one.
6. **No email cadence.** Weekly plain-text teardown email to the captured list. The list is the only owned asset; everything else rents attention from an algorithm.

**Consistency rule (this is the alignment the two repos share):** every asset 8E produces for EHA is checked against `docs/pricing/pricing_source_of_truth.md` and the EHA guardrails (no outcome guarantees, no staff names without owner approval, Maintain = retention only, retatrutide never, discontinued items never, cash-pay clarity before checkout, deliverable-not-outcome guarantees). These live in EHA's brand-kit notes in the 8E portal so they travel with every request. EHA campaigns run only in EHA's GHL location via the per-client scoping shipped 2026-08-13.

---

## 30 / 60 / 90

**Days 1–30 — foundations (no ad spend):**
Remove the fabricated testimonial · compute real LTV/max-CAC from Stripe cohorts · write the three EHA avatars + one 8E avatar (HALO: local FB groups, competitor Google reviews, Reddit r/trt r/Semaglutide, call-log language from the phone AI transcripts) · build HVCO #1 + opt-in page + 3-part nurture (EHA) and the Growth Map offer page + application rework (8E) · reframe the $79 assessment per GAP 4 · start the review engine · start weekly email (both brands) · connect EHA's GHL location in the 8E portal.

**Days 31–60 — traffic on (bounded by max CAC):**
Google Search on buy-intent terms (EHA; 8E optional) · Meta education campaigns → HVCOs · platform health-ad certification for GLP-1/TRT · founder/RN short-form program 3×/week both brands (owner decision: who is on camera — the phone-line no-names rule is a phone rule, not necessarily an ads rule, but it's the owner's call) · doctor-frame enrollment script live · HVCOs #2–3.

**Days 61–90 — compound:**
Program pages rebuilt to 17-step anatomy · referral program (incentive = owner decision) · win-back sequence with provider-gated Maintain · first EHA case-study numbers into 8E's proof wall · quarterly LTV/CAC review ritual → budgets re-derived · kill/scale ad decisions purely on ROI ("the only metric that truly matters").

**Owner decisions needed:** on-camera policy (who fronts the creative) · $79-as-credit premium · referral incentive · guarantee wording sign-off · monthly ad budget ceiling (derived from GAP 2 math once real retention is in) · EHA as named 8E case study.
