// AD-2: MarketDataProvider adapter -- concrete vendors are swappable behind this shape.
export interface MarketDataResult {
  goldUsdPerTroyOunce: number;
  usdLkrRate: number;
  /** Local reference price for cross-checking (PRD FR5/FR6). */
  referenceLkrPerPavan22k: number;
  referenceIsSample: boolean;
  fetchedAt: string;
}

export type MarketDataStatus = "fresh" | "stale-cache" | "sample" | "unavailable";

export interface MarketDataResponse {
  status: MarketDataStatus;
  data: MarketDataResult | null;
  reason?: string;
}

export interface MarketDataProvider {
  fetch(): Promise<MarketDataResult>;
}
