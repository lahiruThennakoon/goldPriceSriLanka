import { BrandLogo } from "@/components/brand-logo";
import { formatLkr } from "@/lib/gold-math";
import { formatFreshness } from "@/lib/use-market-data";
import type { MarketDataStatus } from "@/lib/market-data/types";

const HERO_NAVY = "#0a1528";
const HERO_NAVY_MID = "#0d1a2f";

type HomeHeroProps = {
  purity: number;
  lkrPerPavan: number;
  lkrPerGram: number;
  status: MarketDataStatus;
  fetchedAt: string;
};

function StatusLine({ status, fetchedAt }: { status: MarketDataStatus; fetchedAt: string }) {
  const stale = status === "stale-cache" || status === "sample";

  if (status === "unavailable") {
    return <span>Price unavailable right now</span>;
  }

  if (stale) {
    return (
      <span>
        Showing prices from {formatFreshness(fetchedAt)} —{" "}
        {status === "sample" ? "demo data, live source not connected" : "not connected"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: "var(--positive)" }}
        aria-hidden
      />
      Updated {formatFreshness(fetchedAt)}
    </span>
  );
}

export function HomeHero({ purity, lkrPerPavan, lkrPerGram, status, fetchedAt }: HomeHeroProps) {
  const stale = status === "stale-cache" || status === "sample";

  return (
    <section
      className="overflow-hidden rounded-md border border-border-hairline"
      style={{
        background: `linear-gradient(180deg, ${HERO_NAVY} 0%, ${HERO_NAVY_MID} 38%, var(--surface-raised) 38%, var(--surface-raised) 100%)`,
      }}
    >
      <div className="flex items-center justify-center px-4 pt-3 pb-2 sm:pt-4">
        <BrandLogo height={60} priority />
      </div>

      <div
        className="mx-5 h-px"
        style={{ background: "color-mix(in srgb, var(--accent-gold) 14%, transparent)" }}
        aria-hidden
      />

      <div className="px-5 pb-4 pt-3.5 sm:px-6 sm:pb-5 sm:pt-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.16em]"
          style={{ color: "var(--ink-secondary)" }}
        >
          {purity}K gold &middot; per pavan (8g)
        </p>

        <p
          className="tabular-nums mt-1.5 text-[clamp(2rem,9vw,2.75rem)] font-bold leading-[1.05] tracking-tight"
          style={{ color: "var(--accent-gold)" }}
        >
          {formatLkr(lkrPerPavan)}
        </p>

        <p className="tabular-nums mt-1.5 text-sm" style={{ color: "var(--ink-secondary)" }}>
          {formatLkr(lkrPerGram)} / gram
        </p>

        <p
          className="mt-2.5 text-[11px]"
          style={{ color: stale ? "var(--verify-amber)" : "var(--ink-secondary)" }}
        >
          <StatusLine status={status} fetchedAt={fetchedAt} />
        </p>
      </div>
    </section>
  );
}

export function HomeHeroSkeleton() {
  return (
    <section
      className="overflow-hidden rounded-md border border-border-hairline"
      style={{
        background: `linear-gradient(180deg, ${HERO_NAVY} 0%, ${HERO_NAVY_MID} 38%, var(--surface-raised) 38%, var(--surface-raised) 100%)`,
      }}
    >
      <div className="flex justify-center px-4 py-3">
        <div className="h-[58px] w-[140px] animate-pulse rounded-sm bg-white/5" />
      </div>
      <div className="mx-5 h-px bg-white/5" aria-hidden />
      <div className="space-y-2.5 px-5 py-4">
        <div className="h-2.5 w-36 animate-pulse rounded bg-surface-base/80" />
        <div className="h-10 w-52 animate-pulse rounded bg-surface-base/80" />
        <div className="h-3 w-28 animate-pulse rounded bg-surface-base/80" />
        <div className="h-2.5 w-24 animate-pulse rounded bg-surface-base/80" />
      </div>
    </section>
  );
}

export function HomeHeroBrandOnly() {
  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-md border border-border-hairline px-4 py-3"
      style={{ background: `linear-gradient(180deg, ${HERO_NAVY} 0%, ${HERO_NAVY_MID} 100%)` }}
    >
      <BrandLogo height={60} />
    </div>
  );
}
