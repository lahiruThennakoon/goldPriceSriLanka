"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { formatLkr } from "@/lib/gold-math";
import type { HistorySnapshot } from "@/lib/storage";

type Purity = "22k" | "24k";

function getValue(point: HistorySnapshot, purity: Purity): number {
  return purity === "22k" ? point.lkrPerPavan22k : point.lkrPerPavan24k;
}

function formatAxisLkr(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  return Math.round(value).toLocaleString("en-LK");
}

function formatChartDate(iso: string, spanMs: number): string {
  const date = new Date(iso);
  if (spanMs <= 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString("en-LK", { hour: "numeric", minute: "2-digit" });
  }
  if (spanMs <= 90 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString("en-LK", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-LK", { month: "short", year: "2-digit" });
}

function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x},${points[0].y} L ${points[1].x},${points[1].y}`;
  }

  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export function HistoryChart({ points, purity }: { points: HistorySnapshot[]; purity: Purity }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartPoints = useMemo(() => {
    if (points.length !== 1) return points;
    const only = points[0];
    const midpoint = new Date(only.timestamp).getTime();
    return [
      { ...only, timestamp: new Date(midpoint - 30 * 60_000).toISOString() },
      only,
    ];
  }, [points]);

  const chart = useMemo(() => {
    const values = chartPoints.map((p) => getValue(p, purity));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.08 || max * 0.01;
    const yMin = min - padding;
    const yMax = max + padding;
    const yRange = yMax - yMin || 1;

    const width = 360;
    const height = 200;
    const padLeft = 44;
    const padRight = 12;
    const padTop = 16;
    const padBottom = 28;
    const plotW = width - padLeft - padRight;
    const plotH = height - padTop - padBottom;

    const coords = chartPoints.map((p, i) => ({
      x: padLeft + (i / (chartPoints.length - 1)) * plotW,
      y: padTop + (1 - (getValue(p, purity) - yMin) / yRange) * plotH,
      value: getValue(p, purity),
      timestamp: p.timestamp,
    }));

    const linePath = buildSmoothPath(coords);
    const areaPath = `${linePath} L ${coords[coords.length - 1].x},${padTop + plotH} L ${coords[0].x},${padTop + plotH} Z`;

    const gridCount = 3;
    const gridLines = Array.from({ length: gridCount }, (_, i) => {
      const t = i / (gridCount - 1);
      const value = yMax - t * yRange;
      const y = padTop + t * plotH;
      return { y, label: formatAxisLkr(value) };
    });

    const spanMs =
      new Date(chartPoints[chartPoints.length - 1].timestamp).getTime() -
      new Date(chartPoints[0].timestamp).getTime();

    const first = values[0];
    const last = values[values.length - 1];
    const change = last - first;
    const changePct = first !== 0 ? (change / first) * 100 : 0;
    const trendUp = change >= 0;

    return {
      width,
      height,
      padLeft,
      padTop,
      plotH,
      coords,
      linePath,
      areaPath,
      gridLines,
      spanMs,
      change,
      changePct,
      trendUp,
      last,
    };
  }, [chartPoints, purity]);

  const handlePointer = useCallback(
    (clientX: number) => {
      const svg = svgRef.current;
      if (!svg || chart.coords.length === 0) return;

      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * chart.width;
      let nearest = 0;
      let nearestDist = Infinity;

      chart.coords.forEach((c, i) => {
        const dist = Math.abs(c.x - x);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = i;
        }
      });

      setActiveIndex(nearest);
    },
    [chart.coords, chart.width],
  );

  if (points.length < 1) return null;

  const active = activeIndex !== null ? chart.coords[activeIndex] : null;
  const strokeColor = chart.trendUp ? "var(--positive)" : "var(--negative)";
  const gradientId = `chart-gradient-${purity}`;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
            Period change
          </p>
          <p
            className="tabular-nums text-sm font-medium"
            style={{ color: strokeColor }}
          >
            {chart.change >= 0 ? "+" : ""}
            {formatLkr(chart.change)}{" "}
            <span className="text-xs">
              ({chart.changePct >= 0 ? "+" : ""}
              {chart.changePct.toFixed(2)}%)
            </span>
          </p>
        </div>
        {active && (
          <div className="text-right">
            <p className="text-xs" style={{ color: "var(--ink-secondary)" }}>
              {formatChartDate(active.timestamp, chart.spanMs)}
            </p>
            <p className="tabular-nums text-sm font-medium" style={{ color: "var(--accent-gold)" }}>
              {formatLkr(active.value)}
            </p>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        width="100%"
        height={chart.height}
        role="img"
        aria-label={`${purity} gold price history chart`}
        className="touch-none select-none"
        onPointerMove={(e) => handlePointer(e.clientX)}
        onPointerDown={(e) => handlePointer(e.clientX)}
        onPointerLeave={() => setActiveIndex(null)}
        onPointerUp={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {chart.gridLines.map((line) => (
          <g key={line.y}>
            <line
              x1={chart.padLeft}
              y1={line.y}
              x2={chart.width - 12}
              y2={line.y}
              stroke="var(--border-hairline)"
              strokeWidth={1}
              strokeDasharray="4 4"
              opacity={0.7}
            />
            <text
              x={chart.padLeft - 6}
              y={line.y + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--ink-secondary)"
            >
              {line.label}
            </text>
          </g>
        ))}

        <path d={chart.areaPath} fill={`url(#${gradientId})`} />
        <path
          d={chart.linePath}
          fill="none"
          stroke={strokeColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {active && (
          <>
            <line
              x1={active.x}
              y1={chart.padTop}
              x2={active.x}
              y2={chart.padTop + chart.plotH}
              stroke="var(--ink-disabled)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={active.x}
              cy={active.y}
              r={5}
              fill="var(--surface-raised)"
              stroke={strokeColor}
              strokeWidth={2.5}
            />
          </>
        )}

        {!active && chart.coords.length > 0 && (
          <circle
            cx={chart.coords[chart.coords.length - 1].x}
            cy={chart.coords[chart.coords.length - 1].y}
            r={4}
            fill={strokeColor}
          />
        )}

        <text
          x={chart.padLeft}
          y={chart.height - 6}
          fontSize={10}
          fill="var(--ink-secondary)"
        >
          {formatChartDate(chartPoints[0].timestamp, chart.spanMs)}
        </text>
        <text
          x={chart.width - 12}
          y={chart.height - 6}
          textAnchor="end"
          fontSize={10}
          fill="var(--ink-secondary)"
        >
          {formatChartDate(chartPoints[chartPoints.length - 1].timestamp, chart.spanMs)}
        </text>
      </svg>
    </div>
  );
}
