---
title: Sri Lanka Gold Value PWA
status: final
created: 2026-08-27
updated: 2026-08-27
sources:
  - ../../prds/prd-goldPriceSriLanka-2026-08-27/prd.md
  - ../../prds/prd-goldPriceSriLanka-2026-08-27/addendum.md
---

# Sri Lanka Gold Value PWA — Experience Spine

## Foundation

Single-surface mobile PWA, installable to home screen (PRD FR17). No named UI system — inherits platform conventions for navigation, gestures, and dynamic type. `DESIGN.md` is the visual identity reference; this spine is the behavior. Dark mode is the default surface; light and system are Settings choices (PRD FR19).

**[ASSUMPTION]** No distinct tablet/desktop layout in v1 — the PRD is silent on form-factor beyond "mobile-first"; a wide viewport gets the same single-column layout, simply centered with margins, rather than a bespoke responsive redesign.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Home | App open (cold) | Price Hero (22K per Pavan **and** per gram, PRD FR4), Verification Banner, exchange-rate + spot price detail, portfolio value teaser, quick-calc entry point |
| Calculator | Tab bar | Full weight + purity calculator (PRD FR2/FR3) |
| My Gold | Tab bar | Saved holdings list + total value (PRD FR8–11) |
| Price History | Tab bar | LKR-per-Pavan chart, 24K/22K, 1D–1Y ranges (PRD FR12–13) |
| Settings | Tab bar | Defaults, notifications/alerts, refresh interval, theme (PRD FR19) |

Bottom tab bar, five items (confirmed — not merged). No drawer. Modal stacks one level deep (e.g. "add holding," "set alert") never two.

Home's quick-calc entry point is a shortcut into Calculator with values carried over — it is not a second, parallel calculator implementation.

→ Composition reference: none rendered yet this pass (Fast path skips creative tools). Spine wins on conflict with any future mock.

## Voice and Tone

Microcopy. Brand posture lives in `DESIGN.md.Brand & Style`.

| Do | Don't |
|---|---|
| "Estimated value — Rs. 45,230" | "Your gold is worth Rs. 45,230!" |
| "Reference: Rs. X · This calculation: Rs. Y" | "⚠️ Price mismatch detected!!" |
| "Updated 4 minutes ago" | "Live" (when it isn't verified fresh) |
| "Not connected — showing last known prices from [time]" | "Error: network unavailable" |
| Plain, complete sentences; numbers do the talking | Exclamation marks, hype, gamified praise |

## Component Patterns

Behavioral. Visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| Price Hero | Home, Calculator result | Updates live, no loading spinner after first paint — cached value shows instantly, refreshes in place when new data lands. |
| Verification Banner | Home (always visible, not dismissible) | Two states only: *matches* (reference within expected range) and *diverges* (reference and calculation shown side by side, PRD FR6). Never hidden, never a one-time toast. |
| Calculator Input Row | Calculator, Home quick-calc | No submit button. Every keystroke/selection recalculates instantly (PRD FR2, NFR6). |
| Result Card | Calculator | Always restates weight in both units (PRD FR3) — never shows Pavan without the gram figure or vice versa. |
| Holding Row | My Gold | Tap → edit sheet. Swipe-to-delete (native pattern, confirm before destructive delete). Value recalculates automatically whenever the rate refreshes (PRD FR10) — same live-refresh behavior as Price Hero, just smaller type. |
| Chart Card | Price History | Time-range control persists across app sessions (last-viewed range remembered). |
| Alert Row | Settings | Tap → alert editor (percentage or absolute-LKR, PRD FR15). |
| Daily Digest Row | Settings | Time picker for the daily notification (PRD FR14); permission requested here too, same benefit-first pattern as the alert editor (PRD FR16). |
| Settings Row | Settings | Tap → detail sheet or inline toggle. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold open, cached data available | Home | Show cached Price Hero + Verification Banner immediately; refresh silently in place. No blocking spinner. |
| Cold open, no cache (first-ever launch) | Home | `Fetching today's price…` with skeleton on Price Hero; Verification Banner skeleton too. |
| Offline / stale | Home, Calculator, My Gold | Cached data shown with a persistent, non-dismissible label: `Showing prices from [timestamp] — not connected.` (PRD FR18, NFR3). My Gold values freeze at their last-computed figures under the same stale label, rather than showing blank or zeroed values. Never visually identical to a fresh state. |
| Verification diverges | Home | Verification Banner switches to its amber "diverges" treatment (see Component Patterns). Non-blocking — calculator remains usable. |
| Empty My Gold | My Gold | `No saved gold yet — add your first item.` CTA into the add-item sheet. |
| Empty Price History (insufficient data) | Price History | `Building your price history — check back as data accumulates.` for ranges beyond what's been recorded yet (no backfill in v1, PRD §8 Assumptions Index #4). Shorter ranges (1D/1W) populate first. |
| First alert / notification setup | Settings → Alert editor | Permission request appears here, after the benefit is explained inline — never at app launch (PRD FR16). |
| Threshold alert fires | System notification | States the trigger plainly: `Gold crossed your Rs. X threshold — now Rs. Y per Pavan.` |

## Interaction Primitives

- Tap to act; no long-press menus except native text selection.
- Live recalculation on every input change — no submit/confirm step in the Calculator (PRD FR2).
- Swipe-to-delete on Holding rows (native pattern, destructive confirm).
- Pull-to-refresh on Home and Price History for a manual price check.
- Segmented control (not dropdown) for weight-unit toggle and chart time-range — both are frequent, low-cardinality choices.
- **Banned:** celebratory animation or haptics tied to a price increase, badge counts, streak mechanics, carousels, auto-playing anything.

## Accessibility Floor

Behavioral; visual contrast lives in `DESIGN.md`.

- Tap targets ≥ 44×44px everywhere (PRD NFR5).
- Every color-coded signal (positive/negative price direction, verification match/diverge) is paired with explicit text — never color alone (screen-reader and colorblind-safe by construction).
- Price figures announce with full context to screen readers: value, unit, purity, and freshness (e.g. "45,230 rupees, 22 karat, per Pavan, updated 4 minutes ago") — not just the bare number.
- Dynamic type honored through `DESIGN.md` typography tokens; at maximum text size the Price Hero may wrap rather than shrink or truncate.
- Reduce Motion: skip any chart-line draw-in animation; render the completed chart directly.

## Inspiration & Anti-patterns

- **Rejected — spreadsheet-style dense data grids** (the explicit fail mode named in PRD NFR5): no multi-column tables of raw numbers; one hierarchy-led view at a time.
- **Rejected — trading-app gamification** (streaks, confetti on gains, aggressive re-engagement push): clashes directly with the calm, trust-first posture; a personal investment tracker should not manufacture urgency.
- **Lifted from banking apps** — the single large balance/value figure as the obvious anchor of a home screen, secondary detail below and smaller.
- **Lifted from weather apps** — an always-visible, unobtrusive "last updated" timestamp treatment, applied here to price/rate freshness (PRD NFR2).
- **Noted, not designed here:** the user's stated interest in price *prediction* is not in the current PRD (which covers historical charts only, FR12–13) — no forecasting UI is speculated into this spine. Revisit if/when the PRD is updated to include it.

## Key Flows

### Flow 1 — Daily price check (Nimal, a quiet moment before evening tea)

1. Nimal opens the app.
2. Home shows the cached 22K Pavan price instantly — no spinner.
3. The Verification Banner confirms the price is within expected range of the reference source.
4. He glances at the "updated 4 minutes ago" label — confident it's current.
5. He taps into Price History to see the week's trend.
6. **Climax:** the chart confirms the price has been climbing steadily — enough to decide it's not yet time to sell, without needing to check anywhere else.

Failure: if the fetch is stale, step 2 instead shows the "not connected — showing prices from [time]" label, and Nimal knows explicitly not to treat the number as current.

### Flow 2 — Setting a threshold alert (Nimal, after checking his holdings' total)

1. From My Gold, Nimal sees his portfolio's total value has been drifting near a number he cares about.
2. He goes to Settings → Alerts → Add Alert.
3. He chooses "absolute LKR amount" and enters his threshold.
4. Only now — at the moment of setting his first alert — does the app ask for notification permission, with the benefit stated inline ("Get notified the moment gold crosses this level").
5. He grants permission.
6. **Climax:** a confirmation shows the alert is active, restating the exact threshold back to him — proof the app understood what he asked for, not just that a toggle flipped.

Failure: if he declines permission, the alert is saved but shown as "inactive — enable notifications to receive this" rather than silently discarded.
