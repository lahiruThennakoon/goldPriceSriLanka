"use client";

import { formatLkr } from "@/lib/gold-math";
import type { PriceForecast } from "@/lib/price-forecast";

type Purity = "22k" | "24k";

function pickWeek(
  week: PriceForecast["weeks"][number],
  purity: Purity
): { midpoint: number; low: number; high: number } {
  if (purity === "22k") {
    return { midpoint: week.lkrPerPavan22k, low: week.low22k, high: week.high22k };
  }
  return { midpoint: week.lkrPerPavan24k, low: week.low24k, high: week.high24k };
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-LK", { month: "short", day: "numeric" });
}

export function PriceForecastCard({
  forecast,
  purity,
}: {
  forecast: PriceForecast;
  purity: Purity;
}) {
  const trendPct = purity === "22k" ? forecast.trendPct22k : forecast.trendPct24k;
  const trendColor =
    forecast.trend === "up"
      ? "var(--positive)"
      : forecast.trend === "down"
        ? "var(--negative)"
        : "var(--ink-secondary)";

  const trendLabel =
    forecast.trend === "up" ? "Upward trend" : forecast.trend === "down" ? "Downward trend" : "Mostly flat";

  return (
    <section className="rounded-md bg-surface-raised p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-secondary)" }}>
            Next {forecast.horizonWeeks} weeks
          </p>
          <p className="mt-1 text-sm font-semibold">Trend projection ({purity.toUpperCase()})</p>
        </div>
        <div className="text-right">
          <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
            {trendLabel}
          </p>
          <p className="tabular-nums text-sm font-medium" style={{ color: trendColor }}>
            {trendPct >= 0 ? "+" : ""}
            {trendPct.toFixed(1)}% over {forecast.horizonWeeks}w
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {forecast.weeks.map((week) => {
          const { midpoint, low, high } = pickWeek(week, purity);
          return (
            <div
              key={week.week}
              className="rounded-sm border border-border-hairline p-3"
              style={{
                background: "color-mix(in srgb, var(--accent-gold) 6%, var(--surface-base))",
              }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--ink-secondary)" }}>
                {week.label}
              </p>
              <p className="text-[10px]" style={{ color: "var(--ink-disabled)" }}>
                ~{formatShortDate(week.date)}
              </p>
              <p className="tabular-nums mt-1 text-base font-semibold" style={{ color: "var(--accent-gold)" }}>
                {formatLkr(midpoint)}
              </p>
              <p className="tabular-nums mt-1 text-[10px] leading-snug" style={{ color: "var(--ink-secondary)" }}>
                Range {formatLkr(low)} – {formatLkr(high)}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--verify-amber)" }}>
        Projections extrapolate recent gold and USD/LKR trends — they are estimates, not guarantees. Markets can
        shift quickly; do not treat this as financial advice or a jeweller quote.
      </p>
    </section>
  );
}
