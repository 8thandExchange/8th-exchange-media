# Meta Ads + Pixel — runbook

8E Media has never had a production Pixel id. `NEXT_PUBLIC_META_PIXEL_ID` in `.env.example` was an empty stub, so the consent banner never appeared and no browser or server event could fire. This runbook creates the Meta objects, wires them into the studio, and keeps every brand in its own ad account.

Code lives in `src/lib/meta.ts`, `src/lib/portal/metaAuth.ts`, `/invoicing/ads`, and `/api/invoicing/ads/*`.

---

## What you create in Meta (once per brand)

You cannot generate a Pixel id from this repo. Meta issues it. The Ads page will create the Pixel *after* an ad account + system-user token exist.

### 8E Media (agency)

1. Go to [business.facebook.com](https://business.facebook.com) and create a Business Portfolio named **8th & Exchange Media** if it does not exist.
2. **Business settings → Accounts → Ad accounts → Add → Create a new ad account.** Name it `8E Media`. Timezone America/New_York. Add a payment method. Copy the id (`act_…`).
3. **Business settings → Users → System users → Add.** Name `8E Studio`, role Admin.
4. On that system user: **Add assets** → the 8E Media ad account → permission **Manage campaigns**.
5. **Generate token.** App: create a Business-type app in [developers.facebook.com](https://developers.facebook.com) if you do not have one (name `8E Studio`, use case Business). Token permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
6. In Vercel → project `8th-exchange-media` → Settings → Environment Variables (Production and Preview):

   | Variable | Value |
   | --- | --- |
   | `META_AD_ACCOUNT_ID` | `act_…` |
   | `META_ACCESS_TOKEN` | the system-user token |
   | `META_BUSINESS_ID` | optional, the portfolio id |

7. Redeploy. Open `/invoicing/ads`. The connection card should show the account name and status.
8. Click **Create Pixel for 8E Media**. Copy the id.
9. Set `NEXT_PUBLIC_META_PIXEL_ID` to that id and redeploy. The consent banner on 8emedia.com will appear; Allow analytics sends browser PageView + CAPI PageView with the same `event_id`.
10. Events Manager → Settings → Domain verification for `8emedia.com`. Put the content code in `NEXT_PUBLIC_META_DOMAIN_VERIFY` and redeploy. The root layout emits `<meta name="facebook-domain-verification">`.

Optional while testing CAPI: `META_CAPI_TEST_EVENT_CODE` from Events Manager → Test events. Remove it in production.

`META_CAPI_ACCESS_TOKEN` is optional. If unset, CAPI uses `META_ACCESS_TOKEN`.

### A client brand (EHA, CourtPro, …)

Client owns the Business Portfolio. 8E is a partner, never the owner.

1. Client (or staff on a shared session) creates the portfolio, Page, Instagram Business, ad account, payment method.
2. **Business settings → Users → Partners** → add 8E's Business Portfolio with control of the Page and ad account.
3. In *their* portfolio, create a system user (or use 8E's system user if they assigned the ad account to it) and generate a token with `ads_management` + `ads_read` on *that* ad account only.
4. Open `/invoicing/clients/<id>` → **Meta Ads account**. Paste ad account id + token (Pixel id optional). Save. The token is write-only and never shown again.
5. Open `/invoicing/ads?client=<id>` → **Create Pixel** if they do not have one. The new id is stored on the client row.
6. Install *that* Pixel on *their* site — never `NEXT_PUBLIC_META_PIXEL_ID` (that is 8E's site only).

Apply `supabase/migrations/20260818_portal_clients_meta.sql` in the **8th-exchange-media** Supabase project before step 4. Git push does not apply it.

---

## What the studio does vs Ads Manager

| In `/invoicing/ads` | In Ads Manager |
| --- | --- |
| Verify token + account | Billing, payment failures |
| Create / list Pixels | Event quality, Aggregated Event Measurement |
| List campaigns | Ad sets, targeting, placements |
| Create a **PAUSED** campaign | Creative, budget that actually spends, publish |

A paused campaign is a labeled container. This app will not set status to `ACTIVE`. Turning spend on is a human action in Ads Manager.

---

## Events this site sends (8E only)

| Event | When | Path |
| --- | --- | --- |
| `PageView` | Visitor allows analytics | Browser Pixel + `POST /api/meta/capi` |
| `Contact` | Contact form succeeds | Server CAPI from `/api/contact` |
| `Lead` | Onboarding wizard succeeds | Server CAPI from `/api/onboarding` |

Emails and phones are SHA-256 hashed before they leave the server. `/invoicing`, `/portal`, and `/pay` never load the Pixel and CAPI refuses those URLs.

For EHA and any clinical brand: keep remarketing audiences on public marketing pages only. Do not put this agency Pixel on the clinic site.

---

## Tokens and isolation

`resolveMetaAuth(clientId)` mirrors `resolveGhlAuth`:

- `null` → env (`META_ACCESS_TOKEN` / `META_AD_ACCOUNT_ID`)
- a client id → `portal_clients.meta_*`

Putting a client's token on the agency env (or posting 8E ads from a client token) spends the wrong money. Treat it like the GHL location rule.

Tokens stay server-side. `getClientMetaConnection` never returns `meta_access_token`.

---

## App Review

A system user inside a Business that owns (or was assigned) the ad account can manage that account without a consumer OAuth login. If Meta later requires App Review for `ads_management` on your app, complete it — until then, keep the app in the same Business Portfolio as the ad accounts and use system users only.

Standard access + a system user is enough to create a Pixel and a paused campaign on accounts the Business already administers.

---

## Failure modes (actionable)

| Symptom | Fix |
| --- | --- |
| Ads page shows the setup card | `META_ACCESS_TOKEN` and `META_AD_ACCOUNT_ID` are missing in Vercel. Add them and redeploy. |
| “Meta … failed (190)” | Token expired or wrong app. Generate a new system-user token. |
| “Meta columns are not on portal_clients” | Run `supabase/migrations/20260818_portal_clients_meta.sql`. |
| Consent banner never appears | `NEXT_PUBLIC_META_PIXEL_ID` (or GA4) is empty. Create the Pixel, set the env, redeploy. |
| Events Manager shows browser hits, no server | `META_ACCESS_TOKEN` (or `META_CAPI_ACCESS_TOKEN`) missing, or `META_CAPI_TEST_EVENT_CODE` still set and you are looking at the live stream. |
| Client missing from the Ads brand picker | They are inactive or have no stored token. Connect them on the client page. |

---

## First 8E campaign (after Pixel is live)

Do not spend until the Growth Map offer converts organically enough to know the landing page works.

1. `/invoicing/ads` → create paused campaign, objective **Traffic** or **Leads**, name `Growth Map — traffic`.
2. Ads Manager → ad set: Augusta + surrounding, 25–65, Advantage off until you have conversion volume.
3. Creative: founder-led 3-second hook, one action (Growth Map).
4. Conversion: CAPI `Lead` / `Contact` + landing-page view. Budget from retainer LTV → max CAC, not from gut.
5. Switch the campaign on in Ads Manager only.
