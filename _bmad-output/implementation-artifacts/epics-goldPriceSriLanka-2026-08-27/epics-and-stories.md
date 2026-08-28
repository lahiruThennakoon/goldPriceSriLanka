---
title: Sri Lanka Gold Value PWA — Epics & Stories
status: final
created: 2026-08-27
sources:
  - ../../planning-artifacts/prds/prd-goldPriceSriLanka-2026-08-27/prd.md
  - ../../planning-artifacts/architecture/architecture-goldPriceSriLanka-2026-08-27/ARCHITECTURE-SPINE.md
---

# Epics & Stories

## Epic 1 — Market Data & Calculator (FR1–FR4)

- S1.1 Server route `/api/market-data` with `MarketDataProvider` adapter, fallback sample data, `fresh|stale-cache|unavailable` status (AD-1, AD-2, AD-5)
- S1.2 Gold math library: exact troy-ounce/Pavan conversions, purity scaling, no intermediate rounding (NFR1)
- S1.3 Calculator screen: live weight/purity input → instant LKR result (FR2, FR3)
- S1.4 Home dashboard: Price Hero (22K per Pavan + per gram), spot/FX detail, last-updated (FR4)

## Epic 2 — Trust & Verification (FR5–FR7)

- S2.1 Reference-price fetch via the same provider adapter
- S2.2 Verification Banner: match vs. diverge states, explicit disclosure copy
- S2.3 Disclaimer copy: never framed as an actual jeweller buy/sell quote (FR7)

## Epic 3 — My Gold Holdings (FR8–FR11)

- S3.1 Local storage schema (`goldpwa.v1.holdings`) — biscuit/bar/coin categories + free-text name
- S3.2 Add/edit/delete holding UI, swipe-to-delete
- S3.3 Auto-recalculation on rate refresh + portfolio total

## Epic 4 — Price History (FR12–FR13)

- S4.1 Client-side snapshot ring buffer, captured on foreground (AD-4)
- S4.2 History chart component, 1D/1W/1M/3M/1Y range control
- S4.3 Empty/sparse-range state copy (no backfill)

## Epic 5 — Engagement & Notifications (FR14–FR16)

- S5.1 Daily digest time picker (Settings)
- S5.2 Threshold alert editor (percentage or absolute LKR)
- S5.3 Permission request wired to first alert/digest save only (AD-6)

## Epic 6 — PWA & Offline (FR17–FR18)

- S6.1 Web manifest (icon, splash, standalone display)
- S6.2 Service worker: cache-first for app shell, stale-data labeling
- S6.3 Offline state treatment across Home, Calculator, My Gold

## Epic 7 — Settings (FR19)

- S7.1 Defaults (purity, weight unit), refresh interval, theme (system/light/dark)

## Build Order for Demo

Epic 1 → Epic 3 → Epic 2 → Epic 4 → Epic 7 → Epic 6 → Epic 5 (notifications last: least demoable without a real push backend).
