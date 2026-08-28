import { formatLkr } from "@/lib/gold-math";
import { formatFreshness } from "@/lib/use-market-data";
import type { MarketDataStatus } from "@/lib/market-data/types";

export function PriceHero({
  lkrPerPavan22k,
  lkrPerGram22k,
  status,
  fetchedAt,
}: {
  lkrPerPavan22k: number;
  lkrPerGram22k: number;
  status: MarketDataStatus;
  fetchedAt: string;
}) {
  const stale = status === "stale-cache" || status === "sample";

  return (
    <div className="rounded-md bg-surface-raised p-5">
      <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
        22K Gold &middot; per Pavan (8g)
      </p>
      <p className="tabular-nums mt-1 text-4xl font-semibold" style={{ color: "var(--accent-gold)" }}>
        {formatLkr(lkrPerPavan22k)}
      </p>
      <p className="tabular-nums mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
        {formatLkr(lkrPerGram22k)} / gram
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
