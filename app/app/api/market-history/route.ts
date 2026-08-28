import { NextResponse } from "next/server";
import {
  fetchMarketHistory,
  type HistoryRangeKey,
} from "@/lib/market-data/historical-provider";
import type { MarketHistoryResponse } from "@/lib/market-data/types";

const VALID_RANGES = new Set<HistoryRangeKey>(["1D", "1W", "1M", "3M", "1Y"]);

const cache = new Map<string, { expires: number; points: MarketHistoryResponse["points"] }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rangeParam = searchParams.get("range") ?? "1M";

  if (!VALID_RANGES.has(rangeParam as HistoryRangeKey)) {
    const body: MarketHistoryResponse = {
      status: "unavailable",
      points: [],
      source: "market-estimate",
      reason: "invalid range",
    };
    return NextResponse.json(body, { status: 200 });
  }

  const range = rangeParam as HistoryRangeKey;
  const cached = cache.get(range);
  if (cached && cached.expires > Date.now()) {
    const body: MarketHistoryResponse = {
      status: "fresh",
      points: cached.points,
      source: "market-estimate",
    };
    return NextResponse.json(body);
  }

  try {
    const points = await fetchMarketHistory(range);
    cache.set(range, { expires: Date.now() + CACHE_TTL_MS, points });
    const body: MarketHistoryResponse = {
      status: "fresh",
      points,
      source: "market-estimate",
    };
    return NextResponse.json(body);
  } catch (err) {
    const body: MarketHistoryResponse = {
      status: "unavailable",
      points: [],
      source: "market-estimate",
      reason: err instanceof Error ? err.message : "unknown error",
    };
    return NextResponse.json(body, { status: 200 });
  }
}
