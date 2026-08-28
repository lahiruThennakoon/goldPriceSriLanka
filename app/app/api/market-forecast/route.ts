import { NextResponse } from "next/server";
import { fetchMarketHistory } from "@/lib/market-data/historical-provider";
import type { MarketForecastResponse } from "@/lib/market-data/types";
import { buildPriceForecast } from "@/lib/price-forecast";

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { expires: number; body: MarketForecastResponse } | null = null;

export async function GET() {
  if (cache && cache.expires > Date.now()) {
    return NextResponse.json(cache.body);
  }

  try {
    const history = await fetchMarketHistory("3M");
    const forecast = buildPriceForecast(history, 4);

    if (!forecast) {
      const body: MarketForecastResponse = {
        status: "unavailable",
        forecast: null,
        reason: "not enough historical data for a projection",
      };
      return NextResponse.json(body, { status: 200 });
    }

    const body: MarketForecastResponse = {
      status: "fresh",
      forecast,
    };
    cache = { expires: Date.now() + CACHE_TTL_MS, body };
    return NextResponse.json(body);
  } catch (err) {
    const body: MarketForecastResponse = {
      status: "unavailable",
      forecast: null,
      reason: err instanceof Error ? err.message : "unknown error",
    };
    return NextResponse.json(body, { status: 200 });
  }
}
