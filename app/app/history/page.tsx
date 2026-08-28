"use client";

import { useCallback, useState } from "react";
import { HistoryChart } from "@/components/history-chart";
import { formatLkr } from "@/lib/gold-math";
import { getHistory, getDefaultHistoryPurity, type HistorySnapshot } from "@/lib/storage";
import { useStoreRefresh } from "@/lib/use-store-refresh";

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
  const [purity, setPurity] = useState<"24k" | "22k">(() => getDefaultHistoryPurity());

  const refresh = useCallback(() => {
    setHistory(getHistory());
    setPurity(getDefaultHistoryPurity());
  }, []);
  useStoreRefresh(refresh);

  const rangeMs = RANGES.find((r) => r.key === range)!.ms;
  const cutoff = Date.now() - rangeMs;
  const filtered = history.filter((h) => new Date(h.timestamp).getTime() >= cutoff);
  const totalSnapshots = history.length;

  const latest = filtered[filtered.length - 1];
  const value = latest ? (purity === "22k" ? latest.lkrPerPavan22k : latest.lkrPerPavan24k) : null;

  return (
    <main className="mx-auto max-w-md space-y-4 p-4">
      <h1 className="text-lg font-semibold">Price History</h1>

      <div className="flex gap-2">
        {(["24k", "22k"] as const).map((p) => (
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
        {filtered.length >= 1 ? (
          <>
            {filtered.length === 1 && (
              <p className="mb-3 text-xs" style={{ color: "var(--ink-secondary)" }}>
                1 reading saved — reopen the app later to build the trend line.
              </p>
            )}
            <HistoryChart points={filtered} purity={purity} />
          </>
        ) : (
          <p className="py-8 text-center text-sm" style={{ color: "var(--ink-secondary)" }}>
            {totalSnapshots > 0
              ? "No readings in this time range yet. Try a longer range above."
              : "Price readings are saved each time you open the app. Visit Home once, then check back after your next visit."}
          </p>
        )}
      </div>
    </main>
  );
}
