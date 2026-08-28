---
name: Sri Lanka Gold Value PWA
status: final
created: 2026-08-27
updated: 2026-08-27
description: Investor-focused gold value tracker. Calm, factual, trust-first financial utility. Dark mode by default.
colors:
  surface-base-dark: '#121212'
  surface-raised-dark: '#1C1C1F'
  ink-primary-dark: '#F5F3EF'
  ink-secondary-dark: '#9A968D'
  ink-disabled-dark: '#5C594F'
  accent-gold-dark: '#E6C55C'
  positive-dark: '#5FBF8F'
  negative-dark: '#E2685F'
  verify-amber-dark: '#E3A83B'
  border-hairline-dark: '#2A2A2E'
  surface-base: '#FAF9F6'
  surface-raised: '#FFFFFF'
  ink-primary: '#1A1A1A'
  ink-secondary: '#6B6660'
  ink-disabled: '#B5AFA5'
  accent-gold: '#A6791E'
  positive: '#2F8F5B'
  negative: '#C4453C'
  verify-amber: '#B8862A'
  border-hairline: '#E8E4DD'
typography:
  display:
    note: 'Large price figure — tabular (lining) numerals mandatory so digits align; platform-native numeric font'
  title:
    note: 'Platform native — iOS Title 2 · Android Title Large'
  body:
    note: 'Platform native — iOS Body · Android Body Large'
  label:
    note: 'Platform native — iOS Caption 1 · Android Label Medium; used for freshness timestamps, unit tags'
rounded:
  sm: 8px
  md: 14px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
---

## Brand & Style

This is a financial utility, not a trading-game app — the visual language earns trust through restraint, not excitement. Dark surfaces by default (most gold-checking happens in idle moments, day or night, and a calm dark canvas keeps a price figure from feeling like an alarm). One warm gold accent reserved for the figures that matter — the current value, the primary CTA — never for decoration. No confetti, no celebratory motion on a price moving in the user's favor: this app reports, it doesn't cheerlead.

The one deliberate departure from a pure single-accent palette: a muted positive/negative pair for price direction and a distinct amber for verification/divergence disclosure. These are functional signals a financial tool needs, not decoration — each is always paired with text, never color alone (see Accessibility Floor in `EXPERIENCE.md`).

## Colors

- **Surface (`surface-base-dark` #121212 / `surface-base` #FAF9F6)** — the default canvas. Dark is the primary experience; light is a Settings choice, not an afterthought, and gets equal care.
- **Ink (`ink-primary-dark` #F5F3EF / `ink-primary` #1A1A1A)** — body and figure text. `ink-secondary` for timestamps, labels, and anything supporting the primary figure.
- **Accent Gold (`accent-gold-dark` #E6C55C / `accent-gold` #A6791E)** — the current value figure, primary buttons, active tab. Nothing else earns this color.
- **Positive / Negative (`positive-dark` #5FBF8F / `negative-dark` #E2685F, and light equivalents)** — price-direction indicators on Price History and threshold alerts only. Muted, not neon — this is a utility, not a stock-ticker marquee.
- **Verify Amber (`verify-amber-dark` #E3A83B / `verify-amber` #B8862A)** — reserved exclusively for the Verification Banner (FR5/FR6 divergence disclosure). Deliberately distinct from Accent Gold so a "the numbers diverge" moment never reads as just another gold-colored highlight.
- **Hairline (`border-hairline-dark` #2A2A2E / `border-hairline` #E8E4DD)** — lowest-contrast dividers between list rows (holdings, settings).

Avoid: gradients, multiple competing chromatic accents, red used for anything other than a genuine negative/divergence signal (never as generic emphasis).

## Typography

Platform conventions govern `title`, `body`, and `label`. The one invented level is `display` — the large current-value figure on Home and the Calculator result. It must use **tabular (lining) numerals** so a price that ticks from 45,230 to 45,180 doesn't visually jitter as digit widths change. This is a hard rule, not a preference: an unstable-looking number undermines the entire trust premise of this app.

Dynamic type honored at every level; at maximum accessibility text size, the `display` figure may wrap to a second line rather than truncate or shrink below its minimum readable size.

## Layout & Spacing

Scale: 4 / 8 / 12 / 16 / 24 / 32px. Generous space around the primary value figure on Home and Calculator — it should read as the obvious anchor of the screen, not compete with secondary data (exchange rate, timestamp, reference price) for attention. Secondary data sits below in a tighter rhythm.

Mobile margins follow platform convention (16pt/16dp). Single column throughout; no split-pane, no side-by-side card grids (that reads as the spreadsheet-dump anti-pattern this product explicitly rejects).

## Elevation & Depth

Flat by default. `surface-raised` distinguishes cards (Holding rows, Chart card, Verification Banner) from `surface-base` by tone alone, not shadow. The one exception: the Verification Banner may carry a single soft shadow when it's actively showing a divergence, as a deliberate (rare) attention cue — never for routine cards.

## Shapes

`rounded/sm` (8px) for inputs, list rows, buttons. `rounded/md` (14px) for cards (Chart card, Verification Banner, Result card). Nothing fully circular except the small unit-toggle control (grams/Pavan) and the theme-mode icon.

## Components

- **Price Hero** — the `display`-styled current value (e.g. 22K per Pavan), with the freshness timestamp directly beneath it in `label` style. Used on Home and as the Calculator result.
- **Verification Banner** — `surface-raised` card, `verify-amber` accent border/icon-free text lockup. Shows the reference price alongside the calculated one; states plainly when they match ("within expected range") or diverge ("reference: Rs. X — this calculation: Rs. Y").
- **Calculator Input Row** — weight field + grams/Pavan segmented toggle, purity selector below. No submit button — output updates live.
- **Result Card** — restates entered weight (grams + Pavan), selected purity, and the Price Hero value.
- **Holding Row** (My Gold) — name, form (biscuit/bar/coin), weight/purity as `label`, current value right-aligned in `body` weight (not full `display` — the portfolio total earns that treatment, not each row).
- **Chart Card** (Price History) — line chart, time-range segmented control (1D/1W/1M/3M/1Y) above it, positive/negative color only on the trend line itself.
- **Alert Row** (Settings/notifications) — label + current threshold value + edit chevron; percentage vs. absolute-LKR shown as a small `label`-style tag.
- **Settings Row** — label left, value or chevron right, matching the reference pattern for this shape of control.

## Do's and Don'ts

| Do | Don't |
|---|---|
| One gold accent for the figures that matter | Multiple chromatic accents competing for attention |
| Tabular numerals on every price figure | Proportional numerals that jitter as values change |
| Pair every color signal (positive/negative/divergence) with text | Rely on color alone to communicate direction or trust status |
| Generous space around the primary value | Dense multi-column data grids (the spreadsheet anti-pattern) |
| Flat surfaces, tone-based hierarchy | Shadow-heavy cards, gradients |
| Equal design care in light and dark mode | Treat light mode as an afterthought |
