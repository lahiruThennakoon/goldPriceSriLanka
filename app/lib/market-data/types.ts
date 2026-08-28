// AD-2: MarketDataProvider adapter -- concrete vendors are swappable behind this shape.
import type { PriceForecast } from "@/lib/price-forecast";
import type { MarketInsights } from "@/lib/market-data/insights-provider";
import type { HistorySnapshot } from "@/lib/storage";

export type { HistorySnapshot };
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

export type HistoryRangeKey = "1D" | "1W" | "1M" | "3M" | "1Y";

export interface MarketHistoryResponse {
  status: "fresh" | "unavailable";
  points: HistorySnapshot[];
  source: "market-estimate";
  reason?: string;
}

export interface MarketForecastResponse {
  status: "fresh" | "unavailable";
  forecast: PriceForecast | null;
  reason?: string;
}

export interface MarketInsightsResponse {
  status: "fresh" | "unavailable";
  insights: MarketInsights | null;
  reason?: string;
}
