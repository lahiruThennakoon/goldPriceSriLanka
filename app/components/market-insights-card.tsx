"use client";

import type { MarketInsights, MarketFactor, MarketNewsItem } from "@/lib/market-data/insights-provider";

function directionColor(direction: MarketFactor["direction"]): string {
  if (direction === "up") return "var(--positive)";
  if (direction === "down") return "var(--negative)";
  return "var(--ink-secondary)";
}

function directionArrow(direction: MarketFactor["direction"]): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  return "→";
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" });
}

function NewsRow({ item }: { item: MarketNewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-sm border border-border-hairline p-3 transition-opacity hover:opacity-90"
      style={{
        background: "color-mix(in srgb, var(--surface-base) 60%, transparent)",
      }}
    >
      <div className="mb-1 flex items-center gap-2">
        <span
          className="rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
          style={{
            background:
              item.impact === "high"
                ? "color-mix(in srgb, var(--verify-amber) 22%, transparent)"
                : "color-mix(in srgb, var(--ink-disabled) 30%, transparent)",
            color: item.impact === "high" ? "var(--verify-amber)" : "var(--ink-secondary)",
          }}
        >
          {item.impact === "high" ? "High impact" : "Notable"}
        </span>
        <span className="text-[10px]" style={{ color: "var(--ink-disabled)" }}>
          {item.publisher} · {formatTime(item.publishedAt)}
        </span>
      </div>
      <p className="text-sm font-medium leading-snug">{item.title}</p>
      {item.summary && (
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
          {item.summary}
        </p>
      )}
    </a>
  );
}

function FactorRow({ factor }: { factor: MarketFactor }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border-hairline pt-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{factor.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--ink-secondary)" }}>
          {factor.detail}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="tabular-nums text-sm font-semibold" style={{ color: directionColor(factor.direction) }}>
          {directionArrow(factor.direction)} {factor.value}
        </p>
        <p className="text-[10px] uppercase" style={{ color: "var(--ink-disabled)" }}>
          {factor.impact} impact
        </p>
      </div>
    </div>
  );
}

export function MarketInsightsCard({ insights }: { insights: MarketInsights }) {
  const highImpactNews = insights.news.filter((n) => n.impact === "high");
  const otherNews = insights.news.filter((n) => n.impact !== "high");

  return (
    <section className="space-y-4">
      <div className="rounded-md bg-surface-raised p-4">
        <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-secondary)" }}>
          Today&apos;s decisive factors
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
          What is moving gold prices right now
        </p>
        <div className="mt-3 space-y-3">
          {insights.factors.map((factor) => (
            <FactorRow key={factor.id} factor={factor} />
          ))}
        </div>
      </div>

      {insights.news.length > 0 && (
        <div className="rounded-md bg-surface-raised p-4">
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--ink-secondary)" }}>
            Gold market news
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--ink-secondary)" }}>
            High-impact headlines from the last 36 hours
          </p>

          <div className="mt-3 space-y-2">
            {highImpactNews.map((item) => (
              <NewsRow key={item.link} item={item} />
            ))}
            {otherNews.map((item) => (
              <NewsRow key={item.link} item={item} />
            ))}
          </div>

          <p className="mt-3 text-xs leading-relaxed" style={{ color: "var(--verify-amber)" }}>
            News is sourced from public feeds and ranked by relevance to gold, rates, and the dollar. Headlines
            are informational only — not financial advice.
          </p>
        </div>
      )}
    </section>
  );
}
