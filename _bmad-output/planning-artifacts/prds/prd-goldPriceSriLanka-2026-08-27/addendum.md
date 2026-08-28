# Addendum: Sri Lanka Gold Value PWA

Technical-how, options-considered, and rejected-alternative depth that doesn't belong in the PRD's main narrative. Downstream consumers: architecture / solution design.

## Preferred Stack (author's stated preference, not yet validated by an architecture pass)

- Frontend: Next.js (App Router) + React + TypeScript
- Styling: Tailwind CSS or equivalent modern responsive CSS
- PWA: Web App Manifest + Service Worker for installability, offline caching, splash/icon
- Storage: LocalStorage or IndexedDB for settings and saved gold items (device-local, no backend account store)
- API: server-side API routes act as a proxy to external market-data providers, so no third-party API key is ever shipped to the client (supports NFR4)

## API Architecture

Flow: PWA requests current gold data → backend fetches gold spot price → backend fetches USD/LKR rate → backend computes normalized values → backend returns one normalized payload to the PWA.

Normalized response shape (author-proposed, adjust once real providers are chosen):

```json
{
  "gold_usd_per_troy_ounce": 0,
  "gold_usd_per_gram_24k": 0,
  "usd_lkr": 0,
  "gold_lkr_per_gram_24k": 0,
  "gold_lkr_per_8g_24k": 0,
  "gold_lkr_per_gram_22k": 0,
  "gold_lkr_per_8g_22k": 0,
  "updated_at": ""
}
```

## Calculation Reference (implements NFR1)

```
usd_per_gram_24k        = gold_usd_per_troy_ounce / 31.1034768
lkr_per_gram_24k         = usd_per_gram_24k * usd_lkr_rate
lkr_per_gram_at_purity   = lkr_per_gram_24k * purity_karat / 24
gold_value               = lkr_per_gram_at_purity * weight_in_grams
grams_to_pavan           = weight_in_grams / 8
pavan_to_grams           = pavan * 8
```

Do not round any of the intermediate values above; round only the final `gold_value` for display.

## Open Vendor Questions (feeds PRD §6)

- **Gold spot price provider.** "Kitco" was the originally stated source, but Kitco does not publish an official public API — an actual data vendor (paid or free) that tracks spot gold in USD/oz needs to be selected and validated against Kitco's published number as a sanity check.
- **USD/LKR exchange-rate provider.** Needs to be accurate for the Sri Lankan context specifically; the official CBSL rate and the open/parallel market rate can diverge, and the PRD explicitly does not require using the official rate — just an accurate one. Candidates should be evaluated against real local rates before committing.
- **Local reference price for cross-checking (PRD FR5/FR6).** Needs at least one concrete source that reliably publishes a Sri Lankan gold price (an example raised during discovery was a named local jeweller's published rate) — ideally something scrapable or API-accessible on a schedule.

## Notification Delivery Constraints

Web Push is the likely mechanism (via the Service Worker), but platform support varies: iOS Safari only supports web push for PWAs added to the home screen, and only from iOS 16.4 onward. This should be surfaced to iOS users gracefully (e.g., detect and explain rather than silently failing) rather than assumed to work uniformly — not written into the PRD as an FR since it's a platform constraint, not a product decision.

## Price History Storage (feeds PRD FR12–13, Open Question)

No historical data exists before the app starts recording it. Options for later consideration, not decided:

1. **Start from zero (current assumption).** Begin snapshotting the computed LKR/Pavan value on some regular cadence from first use; longer ranges (3M/1Y) simply show partial data until enough time passes. Simplest, no extra cost.
2. **Backfill via a paid historical data API.** If a chosen gold-price/FX vendor offers historical series, reconstruct a synthetic history at launch. Adds vendor cost/complexity — only worth it if early user feedback shows people actually want a populated 1Y chart on day one.

## Rejected Alternative: Jewellery / Retail Framing

The original product concept (pre-brainstorm) included jewellery item categories (ring, chain, gold coin) and a configurable making-charge (fixed or percentage, per gram or per Pavan) to estimate a jewellery purchase price. This was deliberately dropped after a reverse-brainstorming session surfaced that the product's real audience is gold **investors**, not people transacting with a jewellery shop — making the buy/sell spread and making-charge concepts inapplicable. Saved-item categories were replaced with investment-grade forms (biscuit/bar, coin) accordingly. See the originating session log: `_bmad-output/brainstorming/brainstorm-sri-lanka-gold-value-pwa-2026-08-27/.memlog.md`.
