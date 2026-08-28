import { GRAMS_PER_TROY_OUNCE, GRAMS_PER_PAVAN } from "@/lib/gold-math";
import type { MarketDataProvider, MarketDataResult } from "./types";

const GOLD_SPOT_URL = "https://api.gold-api.com/price/XAU";
const FX_URL = "https://open.er-api.com/v6/latest/USD";
const FETCH_TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Live provider: gold-api.com (spot XAU/USD) + open.er-api.com (USD/LKR).
 * The reference price used for Trust & Verification (FR5/FR6) is a labeled
 * sample offset -- a real independent local source is a Deferred item in
 * ARCHITECTURE-SPINE.md, not yet selected. Never presented as authoritative.
 */
export class LiveMarketDataProvider implements MarketDataProvider {
  async fetch(): Promise<MarketDataResult> {
    const [goldRes, fxRes] = await Promise.all([
      fetchWithTimeout(GOLD_SPOT_URL),
      fetchWithTimeout(FX_URL),
    ]);

    if (!goldRes.ok || !fxRes.ok) {
      throw new Error(`upstream error: gold=${goldRes.status} fx=${fxRes.status}`);
    }

    const goldJson = (await goldRes.json()) as { price: number };
    const fxJson = (await fxRes.json()) as { rates: Record<string, number> };

    const goldUsdPerTroyOunce = goldJson.price;
    const usdLkrRate = fxJson.rates?.LKR;

    if (!goldUsdPerTroyOunce || !usdLkrRate) {
      throw new Error("malformed upstream payload");
    }

    const usdPerGram24k = goldUsdPerTroyOunce / GRAMS_PER_TROY_OUNCE;
    const lkrPerGram24k = usdPerGram24k * usdLkrRate;
    const lkrPerGram22k = (lkrPerGram24k * 22) / 24;
    const lkrPerPavan22k = lkrPerGram22k * GRAMS_PER_PAVAN;

    // Deterministic-but-varying sample offset standing in for a real local
    // reference source (Deferred in the architecture spine). Seeded off the
    // current hour so it doesn't jitter on every request within the demo.
    const hourSeed = new Date().getUTCHours();
    const sampleVariancePct = ((hourSeed % 5) - 2) * 0.35; // -0.7% .. +0.7%
    const referenceLkrPerPavan22k = lkrPerPavan22k * (1 + sampleVariancePct / 100);

    return {
      goldUsdPerTroyOunce,
      usdLkrRate,
      referenceLkrPerPavan22k,
      referenceIsSample: true,
      fetchedAt: new Date().toISOString(),
    };
  }
}
