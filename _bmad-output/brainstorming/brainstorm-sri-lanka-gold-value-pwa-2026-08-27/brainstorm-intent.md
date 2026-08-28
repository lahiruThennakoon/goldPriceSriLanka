# Brainstorm Intent: Sri Lanka Gold Value PWA

## 1. Product Framing

An installable, mobile-first PWA for Sri Lankan **gold investors** to track the current LKR value of their gold holdings, computed from live spot gold price and USD/LKR exchange rate. The audience is explicitly investors holding gold as an asset — **not** customers of jewellery shops making buy/sell transactions. This pivot ruled out any making-charge (per-gram/per-pavan) configuration and buy/sell-spread features, since neither applies when there's no retail transaction happening.

## 2. Confirmed Scope Decisions

- **Audience**: gold investors only, not jewellery-shop transaction customers.
- **Removed**: jewellery-retail framing and making-charge (%/fixed, per-gram/per-pavan) configuration — doesn't fit an investor tool.
- **Removed**: buy/sell spread — irrelevant without retail transactions.
- **Replaced**: jewellery item categories → investment-grade gold forms: biscuits (bars), coins, and bars/moulds.
- **Not required**: localization/multi-language — target users have sufficient English literacy.
- **Out of scope**: local-storage data loss / backup handling.
- **Exchange-rate source**: does not need to be the official bank rate, but whatever source is used must be genuinely accurate — selection requires proper analysis (see Open Questions).
- **Build as**: a proper installable PWA, native-feeling and mobile-first — explicitly not a spreadsheet-like data dump (rows/columns UI with no hierarchy is the fail mode to avoid).

## 3. Core Feature Ideas (by theme)

**Trust / verification**
- Cross-check the spot-derived price against a known local reference price source (e.g., a published jeweller gold price) so the app can prove it isn't silently deviating from real market/jeweller prices.
- Treat cross-checking as a core, serious feature, not an afterthought: actively display the local reference price alongside the spot-derived price, and be explicit when they diverge (e.g., "the real price is X, this calculation shows Y") — this guards against local market dynamics (e.g., a monopoly/cartel-set rate) diverging from the global spot+FX calculation.

**Transparency**
- Always display the gold price and the exchange rate together with their fetch/last-updated timestamp, so stale data is never visually indistinguishable from fresh data.

**Engagement**
- Daily notification at a user-set fixed time showing the current rate.
- User-configurable threshold/margin alerts triggered when the gold rate rises or falls past a set point.
- Threshold alerts should support both percentage-move and absolute-LKR-amount styles; user picks which.
- Notification permission should be requested at the point of value (i.e., when the user sets their first alert), led with the benefit — not as an abrupt OS prompt at app launch.

## 4. Open Questions / Needs Further Analysis

- Exact exchange-rate source selection — must be accurate, but which specific source, and how to validate its accuracy, is undecided.
- Bullion certification/premium handling for investment-grade forms (biscuits, coins, bars) was not resolved — surfaced as a gap, not decided.

## 5. Synthesis

**Trust-through-verification is the core design principle**: never let a displayed number stand unverified — cross-check both the gold rate and the exchange rate against real local references, disclose any divergence, and timestamp everything. This principle, combined with the investor-only pivot (which resolves the buy/sell-spread and making-charge questions by elimination) and permission-at-point-of-value for notifications, defines the direction: build the PRD around an investor-focused, verification-first gold value tracker.
