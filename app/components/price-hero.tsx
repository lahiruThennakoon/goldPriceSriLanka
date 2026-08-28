import { formatLkr } from "@/lib/gold-math";
import { formatFreshness } from "@/lib/use-market-data";
import type { MarketDataStatus } from "@/lib/market-data/types";

export function PriceHero({
  purity,
  lkrPerPavan,
  lkrPerGram,
  status,
  fetchedAt,
}: {
  purity: number;
  lkrPerPavan: number;
  lkrPerGram: number;
  status: MarketDataStatus;
  fetchedAt: string;
}) {
  const stale = status === "stale-cache" || status === "sample";

  return (
    <div className="rounded-md bg-surface-raised p-5">
      <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
        {purity}K Gold &middot; per Pavan (8g)
      </p>
      <p className="tabular-nums mt-1 text-4xl font-semibold" style={{ color: "var(--accent-gold)" }}>
        {formatLkr(lkrPerPavan)}
      </p>
      <p className="tabular-nums mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
        {formatLkr(lkrPerGram)} / gram
      </p>
      <p className="mt-3 text-xs" style={{ color: stale ? "var(--verify-amber)" : "var(--ink-secondary)" }}>
        {status === "unavailable"
          ? "Price unavailable right now"
          : stale
            ? `Showing prices from ${formatFreshness(fetchedAt)} — ${status === "sample" ? "demo data, live source not connected" : "not connected"}`
            : `Updated ${formatFreshness(fetchedAt)}`}
      </p>
    </div>
  );
}
