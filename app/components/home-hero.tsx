import { BrandLogo } from "@/components/brand-logo";
import { formatLkr } from "@/lib/gold-math";
import { formatFreshness } from "@/lib/use-market-data";
import type { MarketDataStatus } from "@/lib/market-data/types";

type HomeHeroProps = {
  purity: number;
  lkrPerPavan: number;
  lkrPerGram: number;
  status: MarketDataStatus;
  fetchedAt: string;
};

export function HomeHero({ purity, lkrPerPavan, lkrPerGram, status, fetchedAt }: HomeHeroProps) {
  const stale = status === "stale-cache" || status === "sample";

  return (
    <section
      className="overflow-hidden rounded-lg border border-border-hairline"
      style={{
        boxShadow: "0 8px 28px color-mix(in srgb, #000 28%, transparent)",
      }}
    >
      <div
        className="flex justify-center px-4 pt-5 pb-4"
        style={{
          background: "linear-gradient(180deg, #0a1528 0%, #0d1a2f 100%)",
          borderBottom: "1px solid color-mix(in srgb, var(--accent-gold) 18%, transparent)",
        }}
      >
        <BrandLogo width={118} priority />
      </div>

      <div className="bg-surface-raised px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-secondary)" }}>
          {purity}K gold &middot; per pavan (8g)
        </p>
        <p
          className="tabular-nums mt-2 text-[2.35rem] font-semibold leading-none"
          style={{ color: "var(--accent-gold)" }}
        >
          {formatLkr(lkrPerPavan)}
        </p>
        <p className="tabular-nums mt-2 text-sm" style={{ color: "var(--ink-secondary)" }}>
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
    </section>
  );
}

export function HomeHeroSkeleton() {
  return (
    <section className="overflow-hidden rounded-lg border border-border-hairline">
      <div
        className="flex justify-center px-4 py-5"
        style={{ background: "linear-gradient(180deg, #0a1528 0%, #0d1a2f 100%)" }}
      >
        <div className="h-[118px] w-[118px] animate-pulse rounded-md bg-white/5" />
      </div>
      <div className="space-y-3 bg-surface-raised px-5 py-5">
        <div className="h-3 w-32 animate-pulse rounded bg-surface-base" />
        <div className="h-10 w-48 animate-pulse rounded bg-surface-base" />
        <div className="h-3 w-24 animate-pulse rounded bg-surface-base" />
      </div>
    </section>
  );
}
