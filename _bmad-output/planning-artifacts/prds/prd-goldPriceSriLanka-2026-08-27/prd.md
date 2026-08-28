---
title: Sri Lanka Gold Value PWA
status: final
created: 2026-08-27
updated: 2026-08-27
---

# Sri Lanka Gold Value PWA — PRD

## 1. Overview

A mobile-first, installable PWA that lets Sri Lankan gold **investors** see the current LKR value of their physical gold holdings — computed from a live gold spot price and the USD/LKR exchange rate — for any weight and purity they enter. It is explicitly an investor's tool, not a jewellery-shop companion: it does not model retail making charges or buy/sell spreads, because no retail transaction happens inside the app. Its central design principle is **trust-through-verification**: every number the app shows is timestamped and checkable against an independent local reference, so the app never asks for blind trust.

## 2. Goals & Success

**Primary goal:** the user trusts the displayed value enough to act on it — to make a real decision (hold, sell, buy more) based on what the app shows.

- **Success signal:** the user checks the app regularly (daily/near-daily) without feeling the need to cross-verify the number elsewhere first.
- **Counter-metric:** the user stops opening the app, or manually double-checks every value against another source before trusting it — both indicate the trust goal has failed.

## 3. Users & Scope

**Primary user:** an individual in Sri Lanka who holds physical gold (bars/biscuits, coins) as an investment and wants a fast, trustworthy read on its current LKR value — not a jewellery-shop customer negotiating a purchase or sale.

**[ASSUMPTION]** Other people beyond the original author may install and use the app, each on their own device. There is no login or account system — each install holds its own independent local data (no cross-device sync; this was already decided as out of scope, see §7). Onboarding should work for a first-time stranger, not just the author.

## 4. Features & Functional Requirements

### Market Data & Calculator

- **FR1.** The app fetches a live gold spot price (USD per troy ounce) and a USD/LKR exchange rate, and derives LKR-per-gram and LKR-per-Pavan (8g) values at 24K.
- **FR2.** The user enters a weight (grams or Pavan) and selects a purity (24K/22K/21K/18K/14K/Custom 1–24), and sees the resulting estimated gold value in LKR instantly, with no separate submit step.
- **FR3.** The result view shows: entered weight, weight restated in grams, equivalent Pavan, selected purity, and the LKR value.
- **FR4.** A home dashboard surfaces the price per Pavan and per gram, at the user's default purity (Settings, FR19; defaults to 24K), as the primary figures (Pavan is the primary Sri Lankan reference unit), plus the raw spot price, exchange rate, and last-updated time.

### Trust & Verification

*(This section exists because it was the dominant, recurring concern raised across the product's originating brainstorm — treated as a first-class feature area, not a footnote.)* Cross-checking matters specifically because a spot+FX calculation can be mathematically correct and still diverge from reality: local gold pricing in Sri Lanka can be influenced by a small number of large market participants effectively setting the day's rate, independent of the global spot price. FR5/FR6 exist to catch and disclose that gap rather than let the app quietly look "wrong."

- **FR5.** The app cross-checks its spot-derived price against at least one independent local reference price source and displays that reference alongside the calculated value.
- **FR6.** When the calculated value and the local reference diverge, the app discloses this explicitly (e.g., "reference price: X, this calculation: Y") rather than hiding or silently favoring one number.
- **FR7.** The app never represents its displayed value as an actual buying or selling quote from any specific jeweller or dealer — it is always framed as an estimated, spot-derived investment value.

**[ASSUMPTION]** The local reference source is configurable and may start with a single example source (a published local gold-market price); which specific source(s) is still open — see §6.

### My Gold (Holdings)

- **FR8.** The user can save individual gold items with a name, weight, unit, and purity.
- **[ASSUMPTION] FR9.** Item categories reflect investment-grade forms — biscuit/bar, coin — rather than jewellery pieces, consistent with the investor-only scope; a free-text name field remains available for anything that doesn't fit a preset category.
- **FR10.** Saved items can be edited or deleted, and each item's value recalculates automatically using the current rate.
- **FR11.** The app shows a total current value across all saved items.

### Price History

- **FR12.** The app tracks and charts the computed LKR-per-Pavan value (24K and 22K) over time, not just the raw USD spot price.
- **FR13.** Time ranges offered: 1D, 1W, 1M, 3M, 1Y.

**[ASSUMPTION]** History is built from the app's own recorded data going forward from first use — there is no backfilled history before a user's install date in v1 (see Open Questions, §6, on whether backfilling via a historical data provider is worth adding later). Longer ranges (3M/1Y) will simply show less data until enough time has passed.

### Engagement & Notifications

- **FR14.** The user can enable a daily notification at a self-chosen fixed time, showing the current rate.
- **FR15.** The user can set one or more threshold alerts that fire when the gold rate crosses a margin, defined as either a percentage move or an absolute LKR amount — the user picks which style per alert.
- **FR16.** Notification permission is requested at the moment the user sets their first alert or enables the daily digest — never proactively at app launch — and the request is preceded by an explanation of the benefit.

### PWA & Offline

- **FR17.** The app is installable to a device home screen, with its own icon, splash screen, and standalone (non-browser-chrome) display that feels native, not like a browser tab.
- **FR18.** When offline, the app shows the most recently cached price, rate, calculations, and saved items, and visibly marks that data as stale rather than presenting it as live.

### Settings

- **FR19.** The user can set default purity, default weight unit, notification preferences, refresh interval, and theme (system/light/dark).

## 5. Non-Functional Requirements

- **NFR1 (Accuracy).** Use exactly 31.1034768 g per troy ounce and exactly 8 g per Pavan. Do not round intermediate calculation steps; round only the final displayed LKR figure, to a sensible currency precision.
- **NFR2 (Data freshness transparency).** Every displayed price and rate is shown with its fetch/last-updated timestamp, visible without extra taps — stale data must never be visually indistinguishable from fresh data.
- **NFR3 (Offline resilience).** Core calculator and saved-items views remain usable offline using cached data (see FR18).
- **NFR4 (Security).** No third-party API keys or credentials are ever exposed in client-side code (implementation approach in `addendum.md`).
- **NFR5 (Usability).** Optimized for one-handed mobile use: touch targets at least 44×44px, no screen showing more than one dense data grid at a time (the explicit fail mode to avoid is a spreadsheet-style rows/columns dump with no visual hierarchy), no unnecessary animation or decoration.
- **NFR6 (Instant feedback).** Calculator results update immediately as inputs change, with no perceptible delay for a purely local computation.

## 6. Open Questions

- **Exchange-rate source.** Must be accurate but doesn't need to be the official bank rate (e.g., parallel/kerb-market rates may be more representative). Which specific provider(s) to use, and how to validate ongoing accuracy, is undecided — needs research before build.
- **Gold spot price source.** A concrete, reliable data provider for the live spot price still needs to be selected (see `addendum.md` for vendor considerations).
- **Local reference price source(s) for FR5/FR6.** Needs at least one concrete, ideally scrapable/API-able source identified and validated.
- **Bullion certification / brand premiums.** Whether and how to account for certification or brand premiums (e.g., a mint-branded bar vs. a generic one) on investment-grade forms was raised but not resolved — currently out of the FR set above; revisit if it turns out to matter to real users.
- **Price history backfill.** Whether to invest in backfilling history from before a user's install date via a paid historical data API, or accept that history simply starts accumulating from first use (current assumption, FR12–13).

## 7. Out of Scope (explicitly excluded)

- Making-charge configuration (%/fixed, per-gram/per-pavan) and any jewellery buy/sell-spread modeling — ruled out by the investor-only pivot; there is no retail transaction to price.
- Multi-language / localization — target users have sufficient English literacy for this app's scope.
- Cloud backup, sync, or account system for saved gold items — each install's local data stands alone; loss of local storage (e.g., clearing browser data) is an accepted risk, not something this product solves for.

## 8. Assumptions Index

Every inline `[ASSUMPTION]` above, in one place:

1. **§3 Users & Scope** — other people beyond the author may install the app; still no accounts or cross-device sync, each install is independent.
2. **§4 Trust & Verification** — the local reference source is configurable, starting from a single example source; the specific source(s) are still open (§6).
3. **§4 My Gold (FR9)** — saved-item categories are biscuit/bar and coin, not jewellery pieces, with a free-text fallback name.
4. **§4 Price History** — no historical backfill in v1; the chart starts empty and fills in from first use.
