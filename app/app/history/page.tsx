"use client";

import { useEffect, useState } from "react";
import { HistoryChart } from "@/components/history-chart";
import { formatLkr } from "@/lib/gold-math";
import { getHistory, type HistorySnapshot } from "@/lib/storage";

const RANGES = [
  { key: "1D", ms: 24 * 60 * 60 * 1000 },
  { key: "1W", ms: 7 * 24 * 60 * 60 * 1000 },
  { key: "1M", ms: 30 * 24 * 60 * 60 * 1000 },
  { key: "3M", ms: 90 * 24 * 60 * 60 * 1000 },
  { key: "1Y", ms: 365 * 24 * 60 * 60 * 1000 },
] as const;

export default function HistoryPage() {
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [range, setRange] = useState<(typeof RANGES)[number]["key"]>("1D");
  const [purity, setPurity] = useState<"24k" | "22k">("22k");

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const rangeMs = RANGES.find((r) => r.key === range)!.ms;
  const cutoff = Date.now() - rangeMs;
  const filtered = history.filter((h) => new Date(h.timestamp).getTime() >= cutoff);

  const latest = filtered[filtered.length - 1];
  const value = latest ? (purity === "22k" ? latest.lkrPerPavan22k : latest.lkrPerPavan24k) : null;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-lg font-semibold">Price History</h1>

      <div className="flex gap-2">
        {(["22k", "24k"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPurity(p)}
            className="min-h-[44px] flex-1 rounded-sm border border-border-hairline text-sm uppercase"
            style={{
              background: purity === p ? "var(--accent-gold)" : "transparent",
              color: purity === p ? "var(--surface-base)" : "var(--ink-primary)",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto rounded-sm border border-border-hairline p-1">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className="min-h-[36px] flex-1 rounded-sm px-2 text-xs"
            style={{
              background: range === r.key ? "var(--accent-gold)" : "transparent",
              color: range === r.key ? "var(--surface-base)" : "var(--ink-primary)",
            }}
          >
            {r.key}
          </button>
        ))}
      </div>

      <div className="rounded-md bg-surface-raised p-4">
        {value !== null && (
          <p className="tabular-nums mb-2 text-2xl font-semibold" style={{ color: "var(--accent-gold)" }}>
            {formatLkr(value)}
          </p>
        )}
        {filtered.length >= 2 ? (
          <HistoryChart points={filtered} purity={purity} />
        ) : (
          <p className="py-8 text-center text-sm" style={{ color: "var(--ink-secondary)" }}>
            Building your price history for this range — check back as data accumulates. This
            app doesn&apos;t backfill history from before you started using it, so shorter ranges
            (1D, 1W) fill in first.
          </p>
        )}
      </div>
    </main>
  );
}
