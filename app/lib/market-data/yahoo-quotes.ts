const YAHOO_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart";
const FETCH_TIMEOUT_MS = 8000;

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      meta?: { regularMarketPrice?: number; regularMarketTime?: number };
      indicators?: { quote?: Array<{ close?: (number | null)[] }> };
    }> | null;
  };
};

export type YahooQuote = {
  price: number;
  asOf: string;
};

async function fetchYahooChart(symbol: string, range: string, interval: string): Promise<YahooQuote> {
  const url = `${YAHOO_CHART_URL}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "GoldValueLK/1.0" },
    });

    if (!res.ok) {
      throw new Error(`yahoo chart error: ${res.status}`);
    }

    const json = (await res.json()) as YahooChartResponse;
    const result = json.chart?.result?.[0];
    const metaPrice = result?.meta?.regularMarketPrice;
    const metaTime = result?.meta?.regularMarketTime;

    if (metaPrice != null && metaPrice > 0) {
      const asOf =
        metaTime != null
          ? new Date(metaTime * 1000).toISOString()
          : new Date().toISOString();
      return { price: metaPrice, asOf };
    }

    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];

    for (let i = closes.length - 1; i >= 0; i--) {
      const close = closes[i];
      if (close != null && close > 0) {
        const ts = timestamps[i] ?? Date.now() / 1000;
        return { price: close, asOf: new Date(ts * 1000).toISOString() };
      }
    }

    throw new Error(`yahoo chart empty: ${symbol}`);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchYahooLatestQuote(symbol: string): Promise<YahooQuote> {
  try {
    return await fetchYahooChart(symbol, "1d", "1m");
  } catch {
    return fetchYahooChart(symbol, "5d", "5m");
  }
}
