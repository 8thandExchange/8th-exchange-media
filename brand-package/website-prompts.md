# 8th & Exchange Media — Website Brand-Alignment Prompts
Target: **media.8thandexchange.com** (Next.js + Tailwind, Vercel). Paste into Cursor in order.

**Setup first:** copy this package's `assets/` folder into the repo at `public/brand/`, and keep `tokens.css` / `tokens.json` open — several prompts reference them.

> Note: these are written as *audit-and-apply* — they tell the agent the exact target system and have it find and replace whatever's currently there. Run them one at a time and review each diff.

---

## ⓪ Pin this as a project rule (paste once, at the top)

> Brand system for 8th & Exchange Media. **Colors:** navy `#0B1B3D` (primary bg/text), gold `#C5A059` (accent ONLY — headline pivots, labels, dividers; never a fill, never body, never on cream), gold-dark `#9C7A38` (small gold labels on light, large sizes only), cream `#F4EFE3` (light bg / reversed text), paper `#FBF8F1` (alt light bg), ink `#0A1424` (body text on cream). **Fonts:** Playfair Display (display/headlines/logo) + Hanken Grotesk (body/UI/labels), both Google Fonts. **Geometry:** squared corners (radius 0), hairline rules. **Contrast law:** all running text is navy/ink on cream OR cream on navy; gold is accents only and NEVER on cream (2.1:1 — fails WCAG). **Signature move:** oversized Playfair headlines with ONE phrase pivoted into *italic gold*; tiny wide-tracked Hanken caps for eyebrows/labels. Do not invent new colors or fonts.

---

## ① Fonts & tokens
> Set up brand type and tokens. (1) Load **Playfair Display** (weights 400–700 + italic) and **Hanken Grotesk** (400–700) via `next/font/google` in `app/layout`, exposed as CSS vars `--font-display` and `--font-body`. (2) Replace the `:root` in `globals.css` with the variables from `public/brand/tokens.css`. (3) Extend the Tailwind theme from `public/brand/tokens.json` — colors (navy, gold, goldDark, cream, paper, ink), fontFamily (display, body), and `borderRadius.DEFAULT = 0`. Remove any pre-existing brand colors/fonts. Don't touch copy.

## ② Logo & favicon
> Replace the logo everywhere. In the **header**, use `public/brand/assets/logo/lockup-horizontal.svg` on light sections and `lockup-horizontal-reversed.svg` on navy. In the **footer**, use the reversed lockup. Replace the current "8TH & EXCHANGE / MEDIA" text lockup entirely. Set **favicons** from `public/brand/assets/favicon/` (`favicon-16`, `favicon-32`, `apple-touch-icon-180`, `icon-512`) — these are the **clean** coin cut, correct for small sizes. The antiqued coin is only for feature sizes.

## ③ Typography system
> Apply the type scale. Headings (`h1/h2/h3` + section titles) → **Playfair Display 600**; body/lead/labels/buttons → **Hanken Grotesk**. Scale: H1 `clamp(2.6rem,6vw,4.2rem)` / line-height 1.02 / tracking −.01em; H2 2rem / 1.1; H3 (Hanken) 1.25rem; lead 1.125rem / 1.6; body 1rem / 1.65 / max-width 62ch; eyebrow & label .75rem / 600 / tracking .18em / uppercase; button .8125rem / 600 / tracking .14em / uppercase. Then apply the **signature**: in the hero headline and major section headers, wrap the key phrase in `<em>` styled italic + gold (on dark) or gold-dark (on light). For the hero "Media engineered to command the market.", italicize-and-gold "command the market."

## ④ Color & contrast enforcement
> Recolor to the palette and enforce the contrast law. Backgrounds: navy, cream, or paper only. Body text: ink/navy on light, cream on navy. Gold is ONLY for headline italic pivots, eyebrows/labels, dividers, and small accents — NEVER body text, NEVER on a cream/paper background (for a small gold label on light use gold-dark, large sizes only). Audit every text node and fix any low-contrast gold-on-light. Buttons: 1.5px navy outline on light / cream or gold outline on navy, squared corners, Hanken caps.

## ⑤ Structural details
> Match structural devices. Section eyebrows like "( 01 ) — The Studio" → Hanken 600, tracking .18em, uppercase, gold-dark on light / gold on navy. Dividers → 1px hairline gold at ~50% opacity. Cards & sections → squared corners (zero border-radius), 1px hairline borders `rgba(11,27,61,.10)`. The scrolling services marquee → Hanken caps with gold ◆ separators. Keep the whitespace generous.

## ⑥ Antiqued finish (the coin's signature)
> Where the brand mark appears at feature size (hero, footer mark, any large coin), use the **antiqued** SVGs from `public/brand/assets/logo/` (`coin-primary-antiqued.svg`, the `lockup-*` files) — they carry the paper-grain + hand-printed-ring filter. Do NOT use the antiqued cut at ≤32px (favicon/inline icons) — use the clean cut there. Optionally add a very subtle paper-grain overlay to large navy hero sections (opacity ≤ 0.05) to echo the coin — but never over text.

## ⑦ Accessibility & polish
> Hit the quality floor. Visible keyboard focus (gold ring on navy, navy ring on cream); respect `prefers-reduced-motion` (disable the stat count-up and the marquee for those users); confirm all text ≥ 4.5:1 (the palette satisfies this if the contrast law was followed); alt text on every image; sensible mobile type scale. Introduce no new colors or fonts.

---

### Quick reference — drop-in tokens
```css
:root{
  --navy:#0B1B3D; --gold:#C5A059; --gold-dark:#9C7A38;
  --cream:#F4EFE3; --paper:#FBF8F1; --ink:#0A1424;
  --font-display:'Playfair Display',Georgia,serif;
  --font-body:'Hanken Grotesk','Inter',sans-serif;
  --radius:0;
}
```
```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400;1,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```
