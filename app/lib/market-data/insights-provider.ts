import { GRAMS_PER_PAVAN, GRAMS_PER_TROY_OUNCE, lkrPerGramAtPurity } from "@/lib/gold-math";
import { fetchMarketHistory } from "@/lib/market-data/historical-provider";
import { LiveMarketDataProvider } from "@/lib/market-data/live-provider";

const YAHOO_GOLD_RSS = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=GC=F&region=US&lang=en-US";
const GOOGLE_GOLD_RSS =
  "https://news.google.com/rss/search?q=gold+price+OR+%22gold+prices%22+OR+XAUUSD+when:1d&hl=en-US&gl=US&ceid=US:en";

const GOLD_RELEVANCE_KEYWORDS = [
  "gold",
  "xau",
  "bullion",
  "precious metal",
  "comex",
  "gc=f",
  "safe haven",
];

const HIGH_IMPACT_KEYWORDS = [
  "fed",
  "federal reserve",
  "interest rate",
  "rate hike",
  "rate cut",
  "inflation",
  "cpi",
  "dollar",
  "treasury",
  "geopolit",
  "central bank",
  "yield",
  "recession",
];

const IRRELEVANT_KEYWORDS = [
  "bitcoin",
  "crypto",
  "ethereum",
  "stock market",
  "nfl",
  "nba",
  "celebrity",
  "movie",
  "football",
  "cricket score",
];

export type ImpactLevel = "high" | "medium";
export type FactorDirection = "up" | "down" | "neutral";

export interface MarketNewsItem {
  title: string;
  link: string;
  publisher: string;
  publishedAt: string;
  impact: ImpactLevel;
  summary: string;
}

export interface MarketFactor {
  id: string;
  label: string;
  value: string;
  direction: FactorDirection;
  impact: ImpactLevel;
  detail: string;
}

export interface MarketInsights {
  asOf: string;
  news: MarketNewsItem[];
  factors: MarketFactor[];
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1]) : "";
}

function parseRss(xml: string, defaultPublisher: string): Omit<MarketNewsItem, "impact">[] {
  const items: Omit<MarketNewsItem, "impact">[] = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

  for (const block of blocks) {
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const pubDate = extractTag(block, "pubDate");
    const description = extractTag(block, "description");
    const source = extractTag(block, "source");

    if (!title || !link) continue;

    items.push({
      title,
      link,
      publisher: source || defaultPublisher,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      summary: description.slice(0, 220),
    });
  }

  return items;
}

function isGoldRelevant(title: string, summary: string): boolean {
  const text = `${title} ${summary}`.toLowerCase();
  if (IRRELEVANT_KEYWORDS.some((keyword) => text.includes(keyword))) return false;
  return GOLD_RELEVANCE_KEYWORDS.some((keyword) => text.includes(keyword));
}

function scoreImpact(title: string, summary: string): ImpactLevel {
  const text = `${title} ${summary}`.toLowerCase();
  const goldHit = GOLD_RELEVANCE_KEYWORDS.some((keyword) => text.includes(keyword));
  const macroHit = HIGH_IMPACT_KEYWORDS.some((keyword) => text.includes(keyword));
  if (goldHit && macroHit) return "high";
  if (goldHit) return "medium";
  return "medium";
}

function isRecentToday(iso: string): boolean {
  const published = new Date(iso);
  const now = new Date();
  const hours = (now.getTime() - published.getTime()) / (60 * 60 * 1000);
  return hours >= 0 && hours <= 36;
}

async function fetchRss(url: string, publisher: string): Promise<Omit<MarketNewsItem, "impact">[]> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": "GoldValueLK/1.0" },
  });
  if (!res.ok) throw new Error(`rss error: ${res.status}`);
  const xml = await res.text();
  return parseRss(xml, publisher);
}

function dedupeNews(items: MarketNewsItem[]): MarketNewsItem[] {
  const seen = new Set<string>();
  const out: MarketNewsItem[] = [];

  for (const item of items) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function directionFromPct(pct: number): FactorDirection {
  if (pct > 0.15) return "up";
  if (pct < -0.15) return "down";
  return "neutral";
}

function formatPct(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function buildFactors(
  goldUsd: number,
  usdLkr: number,
  history: Awaited<ReturnType<typeof fetchMarketHistory>>
): MarketFactor[] {
  const sorted = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const previous = sorted[Math.max(0, sorted.length - 2)];
  const weekAgo = sorted[0];

  const lkrPavan24kNow = lkrPerGramAtPurity(goldUsd, usdLkr, 24) * GRAMS_PER_PAVAN;
  const lkrDayPct = previous ? pctChange(lkrPavan24kNow, previous.lkrPerPavan24k) : 0;

  const goldUsdPrev = previous
    ? (previous.lkrPerPavan24k * GRAMS_PER_TROY_OUNCE) / (usdLkr * GRAMS_PER_PAVAN)
    : goldUsd;
  const goldUsdDayPct = pctChange(goldUsd, goldUsdPrev);

  const fxPrev = previous
    ? (previous.lkrPerPavan24k * GRAMS_PER_TROY_OUNCE) / (goldUsd * GRAMS_PER_PAVAN)
    : usdLkr;
  const fxDayPct = pctChange(usdLkr, fxPrev);

  const weekGoldUsd = weekAgo
    ? (weekAgo.lkrPerPavan24k * GRAMS_PER_TROY_OUNCE) / (usdLkr * GRAMS_PER_PAVAN)
    : goldUsd;
  const weekGoldPct = pctChange(goldUsd, weekGoldUsd);

  const factors: MarketFactor[] = [
    {
      id: "gold-usd",
      label: "Global gold (USD/oz)",
      value: formatPct(goldUsdDayPct),
      direction: directionFromPct(goldUsdDayPct),
      impact: Math.abs(goldUsdDayPct) >= 1 ? "high" : "medium",
      detail: `Spot near $${goldUsd.toFixed(0)}/oz vs prior session.`,
    },
    {
      id: "usd-lkr",
      label: "USD/LKR exchange rate",
      value: formatPct(fxDayPct),
      direction: directionFromPct(fxDayPct),
      impact: Math.abs(fxDayPct) >= 0.3 ? "high" : "medium",
      detail: `Rupee at ${usdLkr.toFixed(2)} per USD — a weaker rupee lifts local gold prices.`,
    },
    {
      id: "lkr-gold",
      label: "LKR gold price (24K pavan)",
      value: formatPct(lkrDayPct),
      direction: directionFromPct(lkrDayPct),
      impact: "high",
      detail: "Combined effect of global gold and the rupee on local value.",
    },
    {
      id: "week-momentum",
      label: "7-day momentum",
      value: formatPct(weekGoldPct),
      direction: directionFromPct(weekGoldPct),
      impact: Math.abs(weekGoldPct) >= 2 ? "high" : "medium",
      detail: "Broader weekly trend feeding into near-term direction.",
    },
  ];

  return factors.sort((a, b) => {
    const rank = (f: MarketFactor) => (f.impact === "high" ? 0 : 1);
    return rank(a) - rank(b);
  });
}

export async function fetchMarketInsights(): Promise<MarketInsights> {
  const live = new LiveMarketDataProvider();
  const [liveData, history, yahooNews, googleNews] = await Promise.all([
    live.fetch(),
    fetchMarketHistory("1W"),
    fetchRss(YAHOO_GOLD_RSS, "Yahoo Finance"),
    fetchRss(GOOGLE_GOLD_RSS, "Google News"),
  ]);

  const scored = [...yahooNews, ...googleNews]
    .filter((item) => isGoldRelevant(item.title, item.summary))
    .map((item) => ({
      ...item,
      impact: scoreImpact(item.title, item.summary),
    }))
    .filter((item) => isRecentToday(item.publishedAt))
    .sort((a, b) => {
      const impactRank = (impact: ImpactLevel) => (impact === "high" ? 0 : 1);
      if (impactRank(a.impact) !== impactRank(b.impact)) {
        return impactRank(a.impact) - impactRank(b.impact);
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

  const news = dedupeNews(scored).slice(0, 3);
  const factors = buildFactors(
    liveData.goldUsdPerTroyOunce,
    liveData.usdLkrRate,
    history
  );

  return {
    asOf: liveData.fetchedAt,
    news,
    factors,
  };
}
