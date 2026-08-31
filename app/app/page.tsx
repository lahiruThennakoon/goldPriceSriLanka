"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useMarketData } from "@/lib/use-market-data";
import { BrandLogo } from "@/components/brand-logo";
import { HomeHero, HomeHeroSkeleton } from "@/components/home-hero";
import { MarketInsightsCard } from "@/components/market-insights-card";
import { VerificationBanner } from "@/components/verification-banner";
import { formatLkr, goldValueLkr, lkrPerGramAtPurity, scalePavanPriceToPurity } from "@/lib/gold-math";
import type { MarketInsights } from "@/lib/market-data/insights-provider";
import type { MarketInsightsResponse } from "@/lib/market-data/types";
import { getDefaultPurityKarat, getHoldings, type Holding } from "@/lib/storage";
import { useStoreRefresh } from "@/lib/use-store-refresh";

export default function HomePage() {
  const { response, loading } = useMarketData();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [defaultPurity, setDefaultPurity] = useState(() => getDefaultPurityKarat());
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  const refresh = useCallback(() => {
    setHoldings(getHoldings());
    setDefaultPurity(getDefaultPurityKarat());
  }, []);
  useStoreRefresh(refresh);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      setInsightsLoading(true);
      try {
        const res = await fetch("/api/market-insights", { cache: "no-store" });
        const json = (await res.json()) as MarketInsightsResponse;
        if (!cancelled) setInsights(json.status === "fresh" ? json.insights : null);
      } catch {
        if (!cancelled) setInsights(null);
      } finally {
        if (!cancelled) setInsightsLoading(false);
      }
    }

    loadInsights();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-4">
        <HomeHeroSkeleton />
      </main>
    );
  }

  if (!response || !response.data) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-4">
        <div
          className="flex justify-center rounded-lg px-4 py-5"
          style={{ background: "linear-gradient(180deg, #0a1528 0%, #0d1a2f 100%)" }}
        >
          <BrandLogo width={118} />
        </div>
        <p className="text-sm" style={{ color: "var(--negative)" }}>
          Price unavailable right now. {response?.reason ?? "Please try again shortly."}
        </p>
      </main>
    );
  }

  const { data, status } = response;
  // Reference data is sourced at 22K; scale both sides to the user's display purity.
  const REFERENCE_KARAT = 22;

  const lkrPerGramDefault = lkrPerGramAtPurity(data.goldUsdPerTroyOunce, data.usdLkrRate, defaultPurity);
  const lkrPerPavanDefault = lkrPerGramDefault * 8;

  const referenceLkrPerPavanDefault = scalePavanPriceToPurity(
    data.referenceLkrPerPavan22k,
    REFERENCE_KARAT,
    defaultPurity
  );

  const portfolioTotal = holdings.reduce(
    (sum, h) => sum + goldValueLkr(data.goldUsdPerTroyOunce, data.usdLkrRate, h.purityKarat, h.weightGrams),
    0
  );

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <HomeHero
        purity={defaultPurity}
        lkrPerPavan={lkrPerPavanDefault}
        lkrPerGram={lkrPerGramDefault}
        status={status}
        fetchedAt={data.fetchedAt}
      />

      <VerificationBanner
        purity={defaultPurity}
        calculatedLkrPerPavan={lkrPerPavanDefault}
        referenceLkrPerPavan={referenceLkrPerPavanDefault}
        referenceIsSample={data.referenceIsSample}
      />

      {insightsLoading ? (
        <div className="h-48 animate-pulse rounded-md bg-surface-raised" />
      ) : insights ? (
        <MarketInsightsCard insights={insights} />
      ) : null}

      <div className="rounded-md bg-surface-raised p-4 text-sm">
        <p className="mb-2 font-medium" style={{ color: "var(--ink-primary)" }}>
          Market detail
        </p>
        <dl className="tabular-nums space-y-1" style={{ color: "var(--ink-secondary)" }}>
          <div className="flex justify-between">
            <dt>Gold spot (USD/oz)</dt>
            <dd>${data.goldUsdPerTroyOunce.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>USD/LKR</dt>
            <dd>{data.usdLkrRate.toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{defaultPurity}K per gram</dt>
            <dd>{formatLkr(lkrPerGramDefault)}</dd>
          </div>
        </dl>
      </div>

      {holdings.length > 0 && (
        <Link
          href="/my-gold"
          className="block rounded-md bg-surface-raised p-4"
        >
          <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
            Your saved gold ({holdings.length} item{holdings.length === 1 ? "" : "s"})
          </p>
          <p className="tabular-nums text-xl font-semibold" style={{ color: "var(--ink-primary)" }}>
            {formatLkr(portfolioTotal)}
          </p>
        </Link>
      )}

      <Link
        href="/calculator"
        className="block rounded-md p-4 text-center font-medium"
        style={{ background: "var(--accent-gold)", color: "var(--surface-base)" }}
      >
        Open Calculator
      </Link>
    </main>
  );
}
