import { NextResponse } from "next/server";
import { LiveMarketDataProvider } from "@/lib/market-data/live-provider";
import { SampleMarketDataProvider } from "@/lib/market-data/sample-provider";
import type { MarketDataResponse, MarketDataResult } from "@/lib/market-data/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// AD-1: this route is the only code allowed to call external providers.
const live = new LiveMarketDataProvider();
const sample = new SampleMarketDataProvider();

let lastGood: MarketDataResult | null = null;

function jsonResponse(body: MarketDataResponse, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}

export async function GET() {
  try {
    const data = await live.fetch();
    lastGood = data;
    const body: MarketDataResponse = { status: "fresh", data };
    return jsonResponse(body);
  } catch (err) {
    if (lastGood) {
      const body: MarketDataResponse = { status: "stale-cache", data: lastGood };
      return jsonResponse(body);
    }
    try {
      const data = await sample.fetch();
      const body: MarketDataResponse = { status: "sample", data };
      return jsonResponse(body);
    } catch {
      // AD-5: never fabricate a number here -- only path allowed to omit `data`.
      const body: MarketDataResponse = {
        status: "unavailable",
        data: null,
        reason: err instanceof Error ? err.message : "unknown error",
      };
      return jsonResponse(body);
    }
  }
}
