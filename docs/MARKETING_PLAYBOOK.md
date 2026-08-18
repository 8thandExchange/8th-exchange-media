# 8th & Exchange Media — Marketing Playbook
**Date:** 2026-08-13
**Framework:** Sabri Suby's Sell Like Crazy 8-phase system + his 2024–26 updates. Full gap analysis (this agency *and* Elevated Health Augusta) in `SUBY_GAP_ANALYSIS_2026-08.md`, kept identical in both repos.

Two jobs for one playbook: (1) how 8E markets **itself** — the agency must be its own reference implementation — and (2) the operating rules for how 8E executes for **clients**, starting with EHA, so both funnels stay consistent.

---

## 1. The 8E funnel (target state)

```
TRAFFIC    founder-led short-form, 3×/week, 3-second hooks, own Social Planner
           (+ optional paid once the offer converts organically)
BAIT       HVCO: "The 5-point creative autopsy — why your cost per lead
           doubled this year" (teardown format)
CAPTURE    stripped opt-in page → 8E GHL location
NURTURE    3-part teardown email series (80% value / 20% pitch)
OFFER      THE GROWTH MAP — free 30-min strategy session, $1,000 stated value:
           we audit your ads, funnel, and follow-up BEFORE the call; you leave
           with a written 90-day growth map whether or not you hire us.
           Reason-why: we'd rather show than pitch. Scarcity: N new clients
           per quarter (real capacity, state it honestly).
CONVERT    onboarding wizard = the application (budget, goals, timeline,
           + readiness 1–10). Low scorers → nurture, not calendar.
           Session runs doctor-frame: diagnose, 2-minute pitch, silence.
ASCEND     productized entry (audit/sprint) → retainer → portfolio work.
           Weekly plain-text teardown email to the list — the owned asset.
```

Non-negotiables from the gap analysis:
- **The free session must actually deliver the written map.** King Kong's own Trustpilot complaints are about thin "free" sessions that are all pitch. The deliverable *is* the marketing.
- **Proof wall = real numbers only.** Fill StatGrid with true counts; grow them. The EHA engagement is the flagship case study — instrument CAC/bookings/member growth from day one. **Approved 2026-08-13: EHA may be published by name with aggregate marketing numbers (never patient data), with the common ownership disclosed wherever it appears.**
- **Run our own ads eventually; publish our own account.** An agency with no ads of its own is unbelievable.
- **Economics before spend:** retainer LTV → max CAC, reviewed quarterly. A discounted or guarantee-backed first month is *paid acquisition*, priced from that math — not a favor.

## 2. Client execution rules (consistency layer)

1. **One brand, one GHL location.** Client campaigns, contacts, and Social Planner posts run in the client's own sub-account via the per-client scoping (client page → "Go High Level sub-account"). Never post or sync a client's audience through 8E's location.
2. **Client guardrails travel with the work.** Every client's compliance/claims rules live in their brand-kit notes in the portal, and every asset that states a price, names a product, or makes a claim is checked against the client's source-of-truth docs before publish. For EHA that means: `docs/pricing/pricing_source_of_truth.md` (every price), no outcome guarantees (deliverable guarantees only), no staff names without owner approval, GLP-1 Maintain = retention only / never acquisition, retatrutide never marketed, discontinued services never advertised, cash-pay clarity before checkout, marketing SMS only against explicit marketing consent.
3. **Same funnel anatomy for every client:** avatar (HALO verbatim language) → HVCO → stripped opt-in → Godfather-framed entry offer → Magic Lantern nurture → application/triage → doctor-frame close → ascension + owned email. The client plan documents each phase (see EHA's `docs/marketing/MARKETING_PLAN_2026-08.md` as the template).
4. **Creative program:** ~3 new short-form pieces/week per active brand, founder/staff-led where the client allows, pattern-interrupt inside 3 seconds, native over polished, every piece pointing at ONE conversion action. AI drafts volume (brand-kit voice feeds the prompts); a human edits every piece into the avatar's language.
5. **Scoreboard is ROI only.** Report CAC vs the client's derived max-CAC, cost per opt-in, nurture→booking rate, and revenue attributed — not impressions. Kill/scale on those numbers.

## 3. Build backlog (this repo)

- [x] Growth Map offer page (17-step anatomy, long-form) replacing "start a project" as the primary CTA target — live, all primary CTAs point at /growth-map
- [x] Homepage rebuilt on the editorial identity (the Mailchimp-parity SaaS pastiche, its fabricated stats, and the undisclosed anonymous testimonial are gone); /work portfolio page added (family brands, ownership disclosed)
- [x] Portal sign-in replaced with emailed one-time codes (no more permanent access code); staff password field gained show/hide
- [ ] HVCO #1 asset + stripped opt-in page (no site nav) → GHL
- [ ] Onboarding wizard: add readiness/motivation (1–10) + current-results questions; score-based routing (calendar vs nurture)
- [ ] 3-part Magic Lantern teardown email sequence (GHL)
- [ ] StatGrid proof wall with real numbers; case-study slot for EHA
- [ ] Weekly plain-text email cadence (owned list)
- [ ] Exit-intent variant of the Growth Map offer
- [ ] Social Planner: EHA connected (location id + PIT token via client page) and posting cadence live for both brands
- [x] Meta Ads foundation: `/invoicing/ads` connection + pixel + paused campaigns; CAPI on contact/onboarding (2026-08-18). Staff still must create the Business Portfolio and paste a System User token — software cannot invent a Pixel ID.
- [ ] 8E own-ads live: Growth Map campaign on, pixel verified in Events Manager
- [ ] EHA Meta connection on the client page (their pixel, their ad account — never 8E's)

## 4. Portfolio rollout — the assembly line

Every family brand goes through the same line. One brand per wave; a wave ships when its machine produces measurable weeks, not when the next brand gets impatient.

**Per-brand checklist (the "8E treatment"):**
1. Portal client + brand kit loaded (voice, colors, guardrails, links).
2. Own GHL location connected via the client page (location id + PIT token — never 8E's).
3. Universal trio first: speed-to-lead, missed-call text-back, review engine (copy adapted from the EHA/8E kits).
4. Avatar (HALO verbatim language) → Godfather-framed entry offer → HVCO + stripped opt-in → 3-part nurture.
5. Content cadence: 3 short-form/week from a monthly 2-hour shoot; one conversion action.
6. Pipeline in GHL; monthly numbers logged.
7. Paid traffic last, budgeted from that brand's LTV → max CAC.

**Waves (by economics and readiness):**
- **Wave 1 — Elevated Health Augusta** (live): recurring revenue, best LTV, the flagship case study.
- **Wave 2 — CourtPro Augusta + 8th Street Construction**: high-ticket local services are the easiest direct-response wins. Entry offers in the Growth Map mold: CourtPro "free court assessment + written resurfacing plan"; 8th Street "free site walk + budget range letter."
- **Wave 3 — Wetzel's + Dink'd**: hospitality/community brands run on reviews, social, and events more than funnels — the trio plus content cadence carries most of the weight.
- **Line of Duty Medical**: a platform launch, not a local funnel — its own plan when it's ready.

**8E sells outward** only after two internal case studies have real numbers. The pitch is then a shown artifact, not a promise: "here's the machine running on our own companies; here's what a customer costs them now."

**The owner's cadence (the whole job, ~3 hours/week):**
- **Weekly:** film or approve the 3 posts per active brand · glance at pipeline columns ("which column grew?") · unstick anything staff flagged.
- **Monthly:** LTV/CAC review per brand · log case-study numbers · pick ONE experiment (new hook, new offer variant, new channel) — never three.
- **Quarterly:** re-derive budgets from the math · re-read the gap analysis · decide the next wave.
