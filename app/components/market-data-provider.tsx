"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { MarketDataResponse } from "@/lib/market-data/types";
import { GRAMS_PER_PAVAN, lkrPerGramAtPurity } from "@/lib/gold-math";
import { appendHistorySnapshot } from "@/lib/storage";

const OFFLINE_CACHE_KEY = "goldpwa.v1.lastMarketData";

type MarketDataContextValue = {
  response: MarketDataResponse | null;
  loading: boolean;
};

const MarketDataContext = createContext<MarketDataContextValue>({
  response: null,
  loading: true,
});

async function fetchMarketData(): Promise<MarketDataResponse> {
  const res = await fetch("/api/market-data", { cache: "no-store" });
  return (await res.json()) as MarketDataResponse;
}

function cacheMarketData(data: MarketDataResponse["data"]) {
  if (data) {
    window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(data));
  }
}

function loadOfflineFallback(): MarketDataResponse {
  try {
    const cached = window.localStorage.getItem(OFFLINE_CACHE_KEY);
    if (cached) {
      return { status: "stale-cache", data: JSON.parse(cached) };
    }
  } catch {
    // fall through
  }
  return { status: "unavailable", data: null, reason: "offline, no cached price yet" };
}

function maybeCaptureHistory(json: MarketDataResponse) {
  if (!json.data || json.status === "unavailable") return;

  const lkrPerGram24k = lkrPerGramAtPurity(json.data.goldUsdPerTroyOunce, json.data.usdLkrRate, 24);
  const lkrPerGram22k = lkrPerGramAtPurity(json.data.goldUsdPerTroyOunce, json.data.usdLkrRate, 22);
  appendHistorySnapshot({
    timestamp: new Date().toISOString(),
    lkrPerPavan24k: lkrPerGram24k * GRAMS_PER_PAVAN,
    lkrPerPavan22k: lkrPerGram22k * GRAMS_PER_PAVAN,
  });
}

export function MarketDataProvider({ children }: { children: ReactNode }) {
  const [response, setResponse] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const json = await fetchMarketData();
        if (cancelled) return;
        setResponse(json);
        setLoading(false);
        cacheMarketData(json.data);
        maybeCaptureHistory(json);
      } catch {
        if (cancelled) return;
        const fallback = loadOfflineFallback();
        setResponse(fallback);
        setLoading(false);
        maybeCaptureHistory(fallback);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <MarketDataContext.Provider value={{ response, loading }}>
      {children}
    </MarketDataContext.Provider>
  );
}

export function useMarketData() {
  return useContext(MarketDataContext);
}

export function formatFreshness(fetchedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}
