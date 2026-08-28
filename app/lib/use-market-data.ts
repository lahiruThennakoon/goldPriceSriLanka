"use client";

import { useEffect, useRef, useState } from "react";
import type { MarketDataResponse } from "@/lib/market-data/types";
import { GRAMS_PER_PAVAN, lkrPerGramAtPurity } from "@/lib/gold-math";
import { appendHistorySnapshot, getSettings, shouldCaptureSnapshot } from "@/lib/storage";

const OFFLINE_CACHE_KEY = "goldpwa.v1.lastMarketData";

export function useMarketData() {
  const [response, setResponse] = useState<MarketDataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSnapshotRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/market-data", { cache: "no-store" });
        const json = (await res.json()) as MarketDataResponse;
        if (cancelled) return;
        setResponse(json);
        setLoading(false);

        if (json.data) {
          window.localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(json.data));
        }

        if (json.data && json.status !== "unavailable") {
          const settings = getSettings();
          if (shouldCaptureSnapshot(lastSnapshotRef.current, settings.refreshIntervalMinutes)) {
            const lkrPerGram24k = lkrPerGramAtPurity(json.data.goldUsdPerTroyOunce, json.data.usdLkrRate, 24);
            const lkrPerGram22k = lkrPerGramAtPurity(json.data.goldUsdPerTroyOunce, json.data.usdLkrRate, 22);
            appendHistorySnapshot({
              timestamp: json.data.fetchedAt,
              lkrPerPavan24k: lkrPerGram24k * GRAMS_PER_PAVAN,
              lkrPerPavan22k: lkrPerGram22k * GRAMS_PER_PAVAN,
            });
            lastSnapshotRef.current = json.data.fetchedAt;
          }
        }
      } catch {
        // Network unreachable (offline): fall back to the last known-good
        // payload cached client-side, explicitly relabeled stale (PRD FR18).
        if (cancelled) return;
        try {
          const cached = window.localStorage.getItem(OFFLINE_CACHE_KEY);
          if (cached) {
            setResponse({ status: "stale-cache", data: JSON.parse(cached) });
          } else {
            setResponse({ status: "unavailable", data: null, reason: "offline, no cached price yet" });
          }
        } catch {
          setResponse({ status: "unavailable", data: null, reason: "offline, no cached price yet" });
        }
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { response, loading };
}

export function formatFreshness(fetchedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(fetchedAt).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}
