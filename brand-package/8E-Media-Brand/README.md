# 8th & Exchange Media — Brand Package v2.0

The definitive brand system, built around the antiqued 8|E coin. Hand this whole folder
to a developer or an AI website builder; the guideline is self-contained and tokens are paste-ready.

## What's inside
- **brand-guidelines.html** — the full guideline, built around the antiqued coin (self-contained).
- **brand-guidelines-preview.png** — flat preview.
- **tokens.css / tokens.json** — design tokens (JSON includes contrast data + Tailwind block).
- **assets/logo/** — coin: antiqued (4 colorways) + clean (small-use); stacked & horizontal lockups (light + reversed).
- **assets/favicon/** — clean coin at 16 / 32 / 180 / 512 px.
- **assets/video/** — antiqued title card + nameplate templates.

## The mark
The **8|E coin** — numeral 8 and letter E (equal size, equal weight) joined by a single canted
stroke, Playfair Display, double ring. Finish is **antiqued, not crisp**: faint hand-printed
ring irregularity + soft paper grain.
- **Antiqued cut** → feature sizes (hero, print, letterhead, the cream primary).
- **Clean cut** → 16–32px (favicon, app icon), where grain would muddy. Same mark, two finishes.

## Type — unified (both fonts free, no licensing)
- **Playfair Display** — coin, mastheads, headlines.
- **Hanken Grotesk** — body, UI, labels, buttons.
- Signature: oversized Playfair against small wide-tracked labels, one phrase pivoted into *italic gold*.

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..700;1,400;1,600&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
```

| Role | Face | Size | Weight | Line-height | Tracking |
|---|---|---|---|---|---|
| Display/H1 | Playfair | clamp 42–67px | 600 | 1.02 | −.01em |
| H2 | Playfair | 32px | 600 | 1.10 | 0 |
| H3 | Hanken | 20px | 600 | 1.30 | 0 |
| Lead | Hanken | 18px | 400 | 1.60 | 0 |
| Body | Hanken | 16px | 400 | 1.65 | 0 (≤62ch) |
| Label | Hanken | 12px | 600 | 1.40 | .18em caps |
| Button | Hanken | 13px | 600 | — | .14em caps |

## Color & contrast (measured WCAG ratios)
| Token | Hex | Use |
|---|---|---|
| navy | #0B1B3D | primary — bg, text |
| gold | #C5A059 | accent only — headlines, labels |
| gold-dark | #9C7A38 | gold labels on light (large only) |
| cream | #F4EFE3 | light bg, reversed text |
| paper | #FBF8F1 | alternate light bg |
| ink | #0A1424 | deepest navy, body on cream |

- navy↔cream **14.8:1** (AAA) · gold/navy **6.9:1** (AA, accents) · **gold/cream 2.1:1 FAILS — never gold type on cream.**
- All running text is navy/ink on cream, or cream on navy.

## Video
Title card delivered as vector; composite the metallic-over-footage finish in DaVinci Resolve (Fusion) or After Effects.

## Open flags
- **Jeremy Miller title** — no public "CEO" use (incl. nameplates) until the Moda Operandi clearance letter is filed as Exhibit C.
- **Trademark** — "8th & Exchange" held personally by Troy Akers, licensed to the operating entity.
