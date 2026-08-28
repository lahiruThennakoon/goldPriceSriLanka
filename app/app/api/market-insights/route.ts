import { NextResponse } from "next/server";
import { fetchMarketInsights } from "@/lib/market-data/insights-provider";
import type { MarketInsightsResponse } from "@/lib/market-data/types";

const CACHE_TTL_MS = 30 * 60 * 1000;
let cache: { expires: number; body: MarketInsightsResponse } | null = null;

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json(cache.body);
  }

  try {
    const insights = await fetchMarketInsights();
    const body: MarketInsightsResponse = { status: "fresh", insights };
    cache = { expires: Date.now() + CACHE_TTL_MS, body };
    return NextResponse.json(body);
  } catch (err) {
    const body: MarketInsightsResponse = {
      status: "unavailable",
      insights: null,
      reason: err instanceof Error ? err.message : "unknown error",
    };
    return NextResponse.json(body, { status: 200 });
  }
}
