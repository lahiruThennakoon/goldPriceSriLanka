import { GRAMS_PER_TROY_OUNCE, GRAMS_PER_PAVAN } from "@/lib/gold-math";
import type { MarketDataProvider, MarketDataResult } from "./types";

/** Fallback when the live provider is unreachable -- clearly labeled to the client via `status: "sample"`. */
export class SampleMarketDataProvider implements MarketDataProvider {
  async fetch(): Promise<MarketDataResult> {
    const goldUsdPerTroyOunce = 2650;
    const usdLkrRate = 305;
    const usdPerGram24k = goldUsdPerTroyOunce / GRAMS_PER_TROY_OUNCE;
    const lkrPerGram22k = ((usdPerGram24k * usdLkrRate) * 22) / 24;
    const referenceLkrPerPavan22k = lkrPerGram22k * GRAMS_PER_PAVAN * 1.004;

    return {
      goldUsdPerTroyOunce,
      usdLkrRate,
      referenceLkrPerPavan22k,
      referenceIsSample: true,
      fetchedAt: new Date().toISOString(),
    };
  }
}
