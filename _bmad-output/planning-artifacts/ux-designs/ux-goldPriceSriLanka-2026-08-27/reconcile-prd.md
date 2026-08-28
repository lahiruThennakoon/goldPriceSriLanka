---
title: PRD ↔ UX Spine Reconciliation
source-prd: ../../prds/prd-goldPriceSriLanka-2026-08-27/prd.md
source-addendum: ../../prds/prd-goldPriceSriLanka-2026-08-27/addendum.md
checked-against:
  - DESIGN.md
  - EXPERIENCE.md
created: 2026-08-27
---

# PRD ↔ UX Spine Reconciliation

Method: every FR/NFR with a UI/UX dimension checked against DESIGN.md (visual identity) and EXPERIENCE.md (behavior/IA/state) for an explicit surface, component, state, or rule. PRD §7 Out of Scope also checked for leakage into either spine.

## Functional Requirements

| FR | Requirement (short) | Status | Evidence |
|---|---|---|---|
| FR1 | Fetch spot + FX, derive LKR/gram & LKR/Pavan @24K | Covered (indirect) | Data/compute requirement, not itself a UI surface; its outputs are what Price Hero / FR4 dashboard display. No spine gap. |
| FR2 | Weight + purity entry, instant result, no submit | **Covered** | EXPERIENCE.md Component Patterns: "Calculator Input Row ... No submit button. Every keystroke/selection recalculates instantly (PRD FR2, NFR6)." |
| FR3 | Result shows weight, grams, Pavan, purity, LKR value | **Covered** | EXPERIENCE.md: "Result Card ... Always restates weight in both units (PRD FR3) — never shows Pavan without the gram figure or vice versa." Purity + value via Price Hero reuse. |
| FR4 | Home dashboard: 22K price per Pavan **and per gram**, spot price, FX rate, last-updated | **Gap (partial)** | IA table lists "Price Hero (22K/Pavan), ... exchange-rate + spot price detail" — Pavan figure and spot/FX detail are named, but no per-gram 22K figure is called out as a Home-dashboard figure. DESIGN.md's Price Hero example is also Pavan-only ("e.g. 22K per Pavan"). FR4 explicitly requires both units as primary figures; the spine only substantiates Pavan. |
| FR5 | Cross-check vs. independent local reference, displayed alongside | **Covered** | Verification Banner: "Shows the reference price alongside the calculated one." |
| FR6 | Explicit divergence disclosure, never hidden/favored | **Covered** | Verification Banner two states (match/diverge); diverge copy: "Reference: Rs. X · This calculation: Rs. Y"; State Patterns row "Verification diverges." |
| FR7 | Never framed as an actual buy/sell quote from a specific jeweller/dealer | **Covered** | Voice and Tone table: "Estimated value — Rs. 45,230" vs. "Your gold is worth Rs. 45,230!"; Verification Banner labels the second source as "reference," not a quote. |
| FR8 | Save item: name, weight, unit, purity | **Covered** | Holding Row: "name, form (biscuit/bar/coin), weight/purity"; IA "My Gold ... Saved holdings list (FR8–11)"; add-item modal referenced in IA. |
| FR9 | Categories = biscuit/bar, coin (not jewellery), free-text fallback | **Covered** | Holding Row form field restricted to "biscuit/bar/coin," matching PRD's investor-only categories; name field distinct from form, supporting free-text fallback. |
| FR10 | Edit/delete; value auto-recalculates on current rate | **Gap (partial)** | Edit/delete covered ("Tap → edit sheet. Swipe-to-delete ... confirm before destructive delete"). Auto-recalculation on rate change is specified for Price Hero ("refreshes in place when new data lands") but never extended, even by cross-reference, to Holding Row or the portfolio total — so FR10's recalculation half is unconfirmed for this surface. |
| FR11 | Total value across all saved items | **Covered** | IA: "Saved holdings list + total value"; DESIGN.md: "the portfolio total earns that [Price-Hero] treatment, not each row"; Flow 2 references "his portfolio's total value." |
| FR12 | Chart of computed LKR-per-Pavan (24K & 22K) over time | **Covered** | Chart Card: "LKR-per-Pavan chart, 24K/22K, 1D–1Y ranges (PRD FR12–13)." |
| FR13 | Ranges: 1D/1W/1M/3M/1Y | **Covered** | Same Chart Card row; State Patterns "Empty Price History" notes shorter ranges populate first. |
| FR14 | Daily notification at self-chosen fixed time, showing current rate | **Gap** | No component or state pattern documents a time-picker / toggle for the daily digest itself. Alert Row is specified for **threshold** alerts (FR15) only; the daily-digest control is only implied via the generic "Settings Row" and the IA's "notifications/alerts" label — no explicit behavioral rule (e.g., what the notification's copy says, whether it reuses Alert Row) is given. |
| FR15 | Threshold alerts, percentage or absolute LKR, user picks style | **Covered** | Alert Row: "percentage vs. absolute-LKR shown as a small label-style tag"; Flow 2 walks through setting one. |
| FR16 | Permission requested only at first-alert or daily-digest moment, never at launch, with benefit stated first | **Gap (partial)** | State Patterns: "First alert / notification setup ... Permission request appears here, after the benefit is explained inline — never at app launch (PRD FR16)." This covers the **alert** trigger point explicitly; the **daily-digest-enable** trigger point named in FR16 has no matching state row, consistent with the FR14 gap above — the digest path isn't modeled, so its permission moment isn't either. |
| FR17 | Installable, own icon, splash, standalone display feels native | **Covered** | EXPERIENCE.md Foundation: "Single-surface mobile PWA, installable to home screen (PRD FR17)." Icon/splash asset specifics are production detail rather than an interaction/behavior concern, reasonably left to build; no contradiction. |
| FR18 | Offline: show cached price, rate, calculations, **and saved items**, visibly marked stale | **Gap (partial)** | State Patterns "Offline / stale" row lists surfaces as "Home, Calculator" only. My Gold (saved items) is not named in this row despite FR18 explicitly including saved items among the offline-visible data, and despite My Gold having its own "Empty My Gold" state elsewhere in the same table — an "offline with cached holdings" case is never distinguished from empty. |
| FR19 | Settings: default purity, default weight unit, notification prefs, refresh interval, theme | **Covered** | IA: "Settings ... Defaults, notifications/alerts, refresh interval, theme (PRD FR19)"; Foundation: theme dark-default with light/system as Settings choice. |

## Non-Functional Requirements

| NFR | Requirement (short) | Status | Evidence |
|---|---|---|---|
| NFR1 | Accuracy: exact constants, no intermediate rounding | N/A to UX spine | Pure computation rule (addendum Calculation Reference); nothing for a UI spine to encode beyond displaying the final rounded figure, which tabular-numeral display already assumes. |
| NFR2 | Freshness transparency: timestamp visible without extra taps, stale never visually indistinguishable from fresh | **Covered** | Price Hero: "freshness timestamp directly beneath it"; Offline/stale state: "Never visually identical to a fresh state"; "Lifted from weather apps" always-visible timestamp pattern. |
| NFR3 | Offline resilience: **calculator and saved-items views** remain usable offline | **Gap (partial)** | Same evidence gap as FR18 — Calculator is explicitly covered by the Offline/stale state row, but My Gold (saved-items view) is not named there, so its offline usability is asserted by the PRD but not modeled in the spine's state table. |
| NFR4 | Security: no API keys in client code | N/A to UX spine | Backend/architecture concern (addendum), correctly absent from both UX documents. |
| NFR5 | Usability: ≥44×44px targets, no dense data grid, no unnecessary animation | **Covered** | Accessibility Floor: "Tap targets ≥ 44×44px everywhere (PRD NFR5)"; Inspiration & Anti-patterns: "Rejected — spreadsheet-style dense data grids"; Interaction Primitives "Banned" list (no celebratory animation, badges, streaks, carousels). |
| NFR6 | Instant feedback: no perceptible delay on local computation | **Covered** | Calculator Input Row: "Every keystroke/selection recalculates instantly (PRD FR2, NFR6)." |

## Out-of-Scope Leakage Check (PRD §7)

| Excluded item | Found in DESIGN.md / EXPERIENCE.md? | Verdict |
|---|---|---|
| Making-charge configuration (%/fixed, per-gram/per-Pavan) or jewellery buy/sell-spread modeling | No mention in either document; Holding Row form field is restricted to biscuit/bar/coin (investor-grade), no charge/spread UI or copy anywhere | **Clean** |
| Multi-language / localization | No i18n components, language switchers, or locale-specific copy variants in either document | **Clean** |
| Cloud backup, sync, or account system | No login, account, sign-in, or cross-device-sync surface, state, or copy anywhere in the IA, flows, or component list | **Clean** |

No out-of-scope leakage found.

## Summary

- **20 of 23 FR/NFR items with a UI dimension: fully covered.**
- **4 partial gaps**, all addressable by adding rows/detail to EXPERIENCE.md rather than redesigning anything:
  1. **FR4** — Home dashboard's per-gram 22K figure isn't confirmed alongside the Pavan figure (spine's Price Hero example only shows Pavan).
  2. **FR14 / FR16 (daily digest path)** — no component/state pattern for the daily-notification time picker, or for the permission-request moment when enabling the digest (only the alert-creation trigger is modeled).
  3. **FR18 / NFR3** — the "Offline / stale" state pattern names Home and Calculator but omits My Gold, leaving saved-items offline behavior unmodeled despite being explicitly required.
  4. **FR10** — Holding Row / portfolio-total auto-recalculation on rate refresh isn't stated (only Price Hero's live-refresh behavior is documented).
- 3 items (NFR1, NFR4, FR1 as pure data-plumbing) are correctly out of UX-spine scope — no gap, just not applicable.
- Out-of-scope leakage check: clean on all three excluded areas (jewellery/making-charges, localization, cloud sync).
