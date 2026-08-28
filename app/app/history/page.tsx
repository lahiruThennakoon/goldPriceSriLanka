"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { HistoryChart } from "@/components/history-chart";
import { PriceForecastCard } from "@/components/price-forecast-card";
import { formatLkr } from "@/lib/gold-math";
import { mergeHistorySnapshots } from "@/lib/history-merge";
import type { MarketForecastResponse, MarketHistoryResponse } from "@/lib/market-data/types";
import type { PriceForecast } from "@/lib/price-forecast";
import { getHistory, getDefaultHistoryPurity, type HistorySnapshot } from "@/lib/storage";
import { useStoreRefresh } from "@/lib/use-store-refresh";

const RANGES = [
  { key: "1D", ms: 24 * 60 * 60 * 1000 },
  { key: "1W", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "1M", ms: 30 * 24 * 60 * 60 * 1000 },
  { key: "3M", ms: 90 * 24 * 60 * 60 * 1000 },
  { key: "1Y", ms: 365 * 24 * 60 * 60 * 1000 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

export default function HistoryPage() {
  const [localHistory, setLocalHistory] = useState<HistorySnapshot[]>([]);
  const [marketHistory, setMarketHistory] = useState<HistorySnapshot[]>([]);
  const [marketStatus, setMarketStatus] = useState<MarketHistoryResponse["status"]>("fresh");
  const [marketLoading, setMarketLoading] = useState(true);
  const [forecast, setForecast] = useState<PriceForecast | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("1M");
  const [purity, setPurity] = useState<"24k" | "22k">(() => getDefaultHistoryPurity());

  const refreshLocal = useCallback(() => {
    setLocalHistory(getHistory());
    setPurity(getDefaultHistoryPurity());
  }, []);
  useStoreRefresh(refreshLocal);

  useEffect(() => {
    let cancelled = false;

    async function loadMarketHistory() {
      setMarketLoading(true);
      try {
        const res = await fetch(`/api/market-history?range=${range}`, { cache: "no-store" });
        const json = (await res.json()) as MarketHistoryResponse;
        if (cancelled) return;
        setMarketHistory(json.points ?? []);
        setMarketStatus(json.status);
      } catch {
        if (cancelled) return;
        setMarketHistory([]);
        setMarketStatus("unavailable");
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
    }

    loadMarketHistory();
    return () => {
      cancelled = true;
    };
  }, [range]);

  useEffect(() => {
    let cancelled = false;

    async function loadForecast() {
      setForecastLoading(true);
      try {
        const res = await fetch("/api/market-forecast", { cache: "no-store" });
        const json = (await res.json()) as MarketForecastResponse;
        if (cancelled) return;
        setForecast(json.status === "fresh" ? json.forecast : null);
      } catch {
        if (!cancelled) setForecast(null);
      } finally {
        if (!cancelled) setForecastLoading(false);
      }
    }

    loadForecast();
    return () => {
      cancelled = true;
    };
  }, []);

  const rangeMs = RANGES.find((r) => r.key === range)!.ms;
  const cutoff = Date.now() - rangeMs;

  const history = useMemo(
    () => mergeHistorySnapshots(marketHistory, localHistory),
    [marketHistory, localHistory]
  );

  const filtered = history.filter((h) => new Date(h.timestamp).getTime() >= cutoff);

  const latest = filtered[filtered.length - 1];
  const value = latest ? (purity === "22k" ? latest.lkrPerPavan22k : latest.lkrPerPavan24k) : null;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-lg font-semibold">Price History</h1>

      <div className="flex gap-2">
        {(["24k", "22k"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPurity(p)}
            className="min-h-[44px] flex-1 rounded-sm border border-border-hairline text-sm uppercase"
            style={{
              background: purity === p ? "var(--accent-gold)" : "transparent",
              color: purity === p ? "var(--surface-base)" : "var(--ink-primary)",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-sm border border-border-hairline p-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="min-h-[36px] flex-1 rounded-sm px-2 text-xs"
            style={{
              background: range === r.key ? "var(--accent-gold)" : "transparent",
              color: range === r.key ? "var(--surface-base)" : "var(--ink-primary)",
            }}
          >
            {r.key}
          </button>
        ))}
      </div>

      <div className="rounded-md bg-surface-raised p-4">
        {value !== null && (
          <p className="tabular-nums mb-2 text-2xl font-semibold" style={{ color: "var(--accent-gold)" }}>
            {formatLkr(value)}
          </p>
        )}

        {marketLoading ? (
          <div className="h-48 animate-pulse rounded-sm bg-surface-base" />
        ) : filtered.length >= 1 ? (
          <>
            <p className="mb-3 text-xs" style={{ color: "var(--ink-secondary)" }}>
              {marketStatus === "fresh"
                ? "Estimated from global gold (COMEX) and USD/LKR market data. Your on-device readings refine recent points."
                : "Showing on-device readings only — market history is temporarily unavailable."}
            </p>
            <HistoryChart points={filtered} purity={purity} />
          </>
        ) : (
          <p className="py-8 text-center text-sm" style={{ color: "var(--ink-secondary)" }}>
            No price history available for this range right now.
          </p>
        )}
      </div>

      {forecastLoading ? (
        <div className="h-40 animate-pulse rounded-md bg-surface-raised" />
      ) : forecast ? (
        <PriceForecastCard forecast={forecast} purity={purity} />
      ) : null}
    </main>
  );
}
