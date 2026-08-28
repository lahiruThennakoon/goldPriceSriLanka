import { GRAMS_PER_PAVAN, lkrPerGramAtPurity } from "@/lib/gold-math";
import type { HistorySnapshot } from "@/lib/storage";

const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const FETCH_TIMEOUT_MS = 8000;

export type HistoryRangeKey = "1D" | "1W" | "1M" | "3M" | "1Y";

type PricePoint = { ts: number; close: number };

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: (number | null)[] }> };
    }> | null;
  };
};

function rangeToYahoo(range: HistoryRangeKey): { range: string; interval: string } {
  switch (range) {
    case "1D":
      return { range: "1d", interval: "30m" };
    case "1W":
      return { range: "5d", interval: "1h" };
    case "1M":
      return { range: "1mo", interval: "1d" };
    case "3M":
      return { range: "3mo", interval: "1d" };
    case "1Y":
      return { range: "1y", interval: "1d" };
  }
}

async function fetchYahooSeries(symbol: string, range: HistoryRangeKey): Promise<PricePoint[]> {
  const { range: yahooRange, interval } = rangeToYahoo(range);
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=${interval}&range=${yahooRange}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "GoldValueLK/1.0" },
    });

    if (!res.ok) {
      throw new Error(`yahoo chart error: ${res.status}`);
    }

    const json = (await res.json()) as YahooChartResponse;
    const result = json.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    const points: PricePoint[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const close = closes[i];
      if (close != null && close > 0) {
        points.push({ ts: timestamps[i], close });
      }
    }
    return points;
  } finally {
    clearTimeout(timeout);
  }
}

function nearestFxRate(fx: PricePoint[], ts: number): number | null {
  if (fx.length === 0) return null;

  let best = fx[0];
  let bestDist = Math.abs(fx[0].ts - ts);

  for (const point of fx) {
    const dist = Math.abs(point.ts - ts);
    if (dist < bestDist) {
      best = point;
      bestDist = dist;
    }
  }

  // Reject matches more than 3 days apart (misaligned holiday gaps).
  if (bestDist > 3 * 24 * 60 * 60) return null;
  return best.close;
}

function toSnapshots(gold: PricePoint[], fx: PricePoint[]): HistorySnapshot[] {
  const fxSorted = [...fx].sort((a, b) => a.ts - b.ts);

  return gold
    .map((g) => {
      const usdLkrRate = nearestFxRate(fxSorted, g.ts);
      if (!usdLkrRate) return null;

      const lkrPerGram24k = lkrPerGramAtPurity(g.close, usdLkrRate, 24);
      const lkrPerGram22k = lkrPerGramAtPurity(g.close, usdLkrRate, 22);

      return {
        timestamp: new Date(g.ts * 1000).toISOString(),
        lkrPerPavan24k: lkrPerGram24k * GRAMS_PER_PAVAN,
        lkrPerPavan22k: lkrPerGram22k * GRAMS_PER_PAVAN,
      };
    })
    .filter((p): p is HistorySnapshot => p !== null);
}

export async function fetchMarketHistory(range: HistoryRangeKey): Promise<HistorySnapshot[]> {
  const [gold, fx] = await Promise.all([
    fetchYahooSeries("GC=F", range),
    fetchYahooSeries("USDLKR=X", range),
  ]);

  if (gold.length === 0 || fx.length === 0) {
    throw new Error("insufficient historical market data");
  }

  return toSnapshots(gold, fx);
}
