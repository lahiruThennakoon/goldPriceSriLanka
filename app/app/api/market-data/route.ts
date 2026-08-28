import { NextResponse } from "next/server";
import { LiveMarketDataProvider } from "@/lib/market-data/live-provider";
import { SampleMarketDataProvider } from "@/lib/market-data/sample-provider";
import type { MarketDataResponse, MarketDataResult } from "@/lib/market-data/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const STALE_MAX_AGE_MS = 10 * 60 * 1000;

const live = new LiveMarketDataProvider();
const sample = new SampleMarketDataProvider();

let lastGood: MarketDataResult | null = null;

function jsonResponse(body: MarketDataResponse, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

function isFreshEnough(data: MarketDataResult): boolean {
  const age = Date.now() - new Date(data.fetchedAt).getTime();
  return age >= 0 && age <= STALE_MAX_AGE_MS;
}

export async function GET() {
  try {
    const data = await live.fetch();
    lastGood = data;
    return jsonResponse({ status: "fresh", data });
  } catch (err) {
    if (lastGood && isFreshEnough(lastGood)) {
      return jsonResponse({ status: "stale-cache", data: lastGood });
    }

    try {
      const data = await sample.fetch();
      return jsonResponse({ status: "sample", data });
    } catch {
      return jsonResponse({
        status: "unavailable",
        data: null,
        reason: err instanceof Error ? err.message : "unknown error",
      });
    }
  }
}
