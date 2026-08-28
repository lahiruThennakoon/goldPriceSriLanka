"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMarketData } from "@/lib/use-market-data";
import { PriceHero } from "@/components/price-hero";
import { VerificationBanner } from "@/components/verification-banner";
import { formatLkr, goldValueLkr, lkrPerGramAtPurity } from "@/lib/gold-math";
import { getHoldings, getSettings, type Holding } from "@/lib/storage";

export default function HomePage() {
  const { response, loading } = useMarketData();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [defaultPurity, setDefaultPurity] = useState(24);

  useEffect(() => {
    setHoldings(getHoldings());
    setDefaultPurity(getSettings().defaultPurity);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-md p-4">
        <div className="h-40 animate-pulse rounded-md bg-surface-raised" />
      </main>
    );
  }

  if (!response || !response.data) {
    return (
      <main className="mx-auto max-w-md p-4">
        <p className="text-sm" style={{ color: "var(--negative)" }}>
          Price unavailable right now. {response?.reason ?? "Please try again shortly."}
        </p>
      </main>
    );
  }

  const { data, status } = response;
  // The Verification Banner always compares at 22K -- that's the basis the
  // reference price (FR5/FR6) is computed against, independent of whichever
  // purity the user has chosen as their display default below.
  const lkrPerGram22k = lkrPerGramAtPurity(data.goldUsdPerTroyOunce, data.usdLkrRate, 22);
  const lkrPerPavan22k = lkrPerGram22k * 8;

  const lkrPerGram24k = lkrPerGramAtPurity(data.goldUsdPerTroyOunce, data.usdLkrRate, 24);

  const lkrPerGramDefault = lkrPerGramAtPurity(data.goldUsdPerTroyOunce, data.usdLkrRate, defaultPurity);
  const lkrPerPavanDefault = lkrPerGramDefault * 8;

  const portfolioTotal = holdings.reduce(
    (sum, h) => sum + goldValueLkr(data.goldUsdPerTroyOunce, data.usdLkrRate, h.purityKarat, h.weightGrams),
    0
  );

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <PriceHero
        purity={defaultPurity}
        lkrPerPavan={lkrPerPavanDefault}
        lkrPerGram={lkrPerGramDefault}
        status={status}
        fetchedAt={data.fetchedAt}
      />

      <VerificationBanner
        calculatedLkrPerPavan22k={lkrPerPavan22k}
        referenceLkrPerPavan22k={data.referenceLkrPerPavan22k}
        referenceIsSample={data.referenceIsSample}
      />

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
            <dt>24K per gram</dt>
            <dd>{formatLkr(lkrPerGram24k)}</dd>
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
