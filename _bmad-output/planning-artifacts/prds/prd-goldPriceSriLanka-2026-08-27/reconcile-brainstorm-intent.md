# Reconciliation: brainstorm-intent.md → PRD + addendum

Source: `_bmad-output/brainstorming/brainstorm-sri-lanka-gold-value-pwa-2026-08-27/brainstorm-intent.md`
Checked against: `prd.md` and `addendum.md` (prd-goldPriceSriLanka-2026-08-27)

## Overall assessment

Coverage is strong. The PRD writer preserved not just the decisions but much of the original tone and even phrasing — e.g. the PRD opens with "Its central design principle is trust-through-verification," lifting the brainstorm's synthesis almost verbatim, and FR6's example ("reference price: X, this calculation: Y") mirrors the brainstorm's own example almost word-for-word. The Trust & Verification FR section even carries an inline note explaining *why* it exists ("dominant, recurring concern... treated as a first-class feature area, not a footnote"), which is exactly the kind of qualitative framing that a plain FR list usually loses.

## Point-by-point coverage

| Brainstorm point | PRD/addendum location | Status |
|---|---|---|
| Audience = investors, not jewellery-shop customers | §1, §3 | Covered |
| Removed making-charge config | §7; addendum "Rejected Alternative" | Covered |
| Removed buy/sell spread | §7; FR7 | Covered |
| Categories → biscuit/bar, coin | FR9 (marked ASSUMPTION) | Covered |
| No localization needed | §7 | Covered |
| Local-storage data loss out of scope | §7 | Covered |
| Exchange-rate source: accurate but not necessarily official, needs analysis | §6 (elaborated with parallel/kerb-market nuance); addendum vendor questions | Covered, and strengthened |
| Build as proper installable, native-feeling, mobile-first PWA | §1, FR17, NFR5 | Covered functionally |
| Cross-check spot price vs local reference, display alongside | FR5 | Covered |
| Treat cross-check as core feature, not afterthought | Explicit inline note in §4 Trust & Verification header | Covered, tone preserved |
| "real price is X, this calc shows Y" divergence disclosure | FR6 | Covered, near-verbatim |
| Timestamp everything, stale ≠ fresh visually | NFR2, FR4, FR18 | Covered |
| Daily notification at user-set time | FR14 | Covered |
| Threshold alerts, % or absolute-LKR, user picks | FR15 | Covered |
| Notification permission at point of value, benefit-led | FR16 | Covered, extended to daily-digest trigger too |
| Exchange-rate source open question | §6 | Covered |
| Bullion certification/premium unresolved | §6 (explicitly flagged, not folded into FRs) | Covered |
| Trust-through-verification as core design principle | §1 opening sentence | Covered, phrase reused directly |

## Gaps / weakened points

1. **"Not a spreadsheet-like data dump" anti-pattern warning is flattened into generic usability language.** The brainstorm explicitly calls out a *fail mode to avoid*: "rows/columns UI with no hierarchy." The PRD's NFR5 ("large touch targets, minimal clutter, no unnecessary animation or decoration") is a reasonable usability NFR but doesn't carry the specific warning. A generic "minimal clutter" bar can still be satisfied by a tidy table of rows and columns — which is precisely the outcome the brainstorm wanted ruled out. This is a UX-relevant nuance that matters most at implementation/design-review time, and it has no explicit anchor in the PRD to check against. Worth carrying into the UX spec if one exists, since the PRD itself doesn't preserve the concrete anti-pattern.

2. **The "why" behind the trust/cross-check feature is dropped.** The brainstorm gives a specific causal rationale for why local-reference cross-checking is a *serious* feature and not just a nice-to-have sanity check: it guards against "local market dynamics (e.g., a monopoly/cartel-set rate) diverging from the global spot+FX calculation." FR5/FR6 capture the *mechanism* (fetch a reference, disclose divergence) faithfully, but the PRD never states *why* divergence is expected/plausible in the Sri Lankan gold market. Losing this rationale risks an implementer treating FR5/FR6 as a minor cross-check widget rather than the core defense against a known, named market-structure risk — which could affect how much rigor goes into picking and validating the reference source (§6 open question already flags source selection, but not the reason accuracy here is especially high-stakes).

3. **Minor: "native-feeling" quality is implied but not stated.** The brainstorm asks for a PWA that feels native, not just installable. The PRD covers the mechanics (FR17: icon, splash screen, standalone display) and general polish (NFR5) but never states "native-feeling" as an explicit bar. Low severity — likely to be re-derived naturally during UX/architecture work — but flagged for completeness since it was explicit language in the source.

No decisions, scope boundaries, or open questions from the brainstorm were dropped outright; every omission found is a tonal/rationale nuance rather than a missing requirement or a silently-abandoned decision.
