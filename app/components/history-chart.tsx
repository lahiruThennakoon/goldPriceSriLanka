import type { HistorySnapshot } from "@/lib/storage";

export function HistoryChart({ points }: { points: HistorySnapshot[]; }) {
  if (points.length < 2) return null;

  const values = points.map((p) => p.lkrPerPavan22k);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const width = 320;
  const height = 140;
  const pad = 8;

  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (p.lkrPerPavan22k - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trendUp = values[values.length - 1] >= values[0];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Price history chart">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke={trendUp ? "var(--positive)" : "var(--negative)"}
        strokeWidth={2}
      />
    </svg>
  );
}
