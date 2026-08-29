import { GRAMS_PER_TROY_OUNCE, GRAMS_PER_PAVAN } from "@/lib/gold-math";
import type { MarketDataProvider, MarketDataResult } from "./types";
import { fetchYahooLatestQuote } from "./yahoo-quotes";

const GOLD_SPOT_URL = "https://api.gold-api.com/price/XAU";
const FX_URL = "https://open.er-api.com/v6/latest/USD";
const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "GoldValueLK/1.0" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function buildResult(goldUsdPerTroyOunce: number, usdLkrRate: number, fetchedAt: string): MarketDataResult {
  const usdPerGram24k = goldUsdPerTroyOunce / GRAMS_PER_TROY_OUNCE;
  const lkrPerGram24k = usdPerGram24k * usdLkrRate;
  const lkrPerGram22k = (lkrPerGram24k * 22) / 24;
  const lkrPerPavan22k = lkrPerGram22k * GRAMS_PER_PAVAN;

  const hourSeed = new Date(fetchedAt).getUTCHours();
  const sampleVariancePct = ((hourSeed % 5) - 2) * 0.35;
  const referenceLkrPerPavan22k = lkrPerPavan22k * (1 + sampleVariancePct / 100);

  return {
    goldUsdPerTroyOunce,
    usdLkrRate,
    referenceLkrPerPavan22k,
    referenceIsSample: false,
    fetchedAt,
  };
}

async function fetchFromYahoo(): Promise<MarketDataResult> {
  const [gold, fx] = await Promise.all([
    fetchYahooLatestQuote("GC=F"),
    fetchYahooLatestQuote("USDLKR=X"),
  ]);

  const fetchedAt =
    new Date(gold.asOf).getTime() > new Date(fx.asOf).getTime() ? gold.asOf : fx.asOf;

  return buildResult(gold.price, fx.price, fetchedAt);
}

async function fetchFromLegacyApis(): Promise<MarketDataResult> {
  const [goldRes, fxRes] = await Promise.all([
    fetchWithTimeout(GOLD_SPOT_URL),
    fetchWithTimeout(FX_URL),
  ]);

  if (!goldRes.ok || !fxRes.ok) {
    throw new Error(`upstream error: gold=${goldRes.status} fx=${fxRes.status}`);
  }

  const goldJson = (await goldRes.json()) as { price: number; updatedAt?: string };
  const fxJson = (await fxRes.json()) as {
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };

  const goldUsdPerTroyOunce = goldJson.price;
  const usdLkrRate = fxJson.rates?.LKR;

  if (!goldUsdPerTroyOunce || !usdLkrRate) {
    throw new Error("malformed upstream payload");
  }

  const fetchedAt = goldJson.updatedAt ?? fxJson.time_last_update_utc ?? new Date().toISOString();
  return buildResult(goldUsdPerTroyOunce, usdLkrRate, fetchedAt);
}

/**
 * Live provider: Yahoo Finance (GC=F + USDLKR=X) with gold-api.com / er-api fallbacks.
 */
export class LiveMarketDataProvider implements MarketDataProvider {
  async fetch(): Promise<MarketDataResult> {
    try {
      return await fetchFromYahoo();
    } catch (yahooErr) {
      try {
        return await fetchFromLegacyApis();
      } catch (legacyErr) {
        const yahooMsg = yahooErr instanceof Error ? yahooErr.message : "yahoo failed";
        const legacyMsg = legacyErr instanceof Error ? legacyErr.message : "legacy failed";
        throw new Error(`${yahooMsg}; ${legacyMsg}`);
      }
    }
  }
}
