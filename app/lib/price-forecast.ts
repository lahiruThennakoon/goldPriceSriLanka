import type { HistorySnapshot } from "@/lib/storage";

export type ForecastTrend = "up" | "down" | "flat";

export interface ForecastWeek {
  week: number;
  label: string;
  date: string;
  lkrPerPavan22k: number;
  lkrPerPavan24k: number;
  low22k: number;
  high22k: number;
  low24k: number;
  high24k: number;
}

export interface PriceForecast {
  method: "trend-projection";
  horizonWeeks: number;
  trend: ForecastTrend;
  trendPct22k: number;
  trendPct24k: number;
  residualVolatilityPct: number;
  asOf: string;
  weeks: ForecastWeek[];
}

type DailyPoint = { x: number; y: number; date: string };

function toDailySeries(
  snapshots: HistorySnapshot[],
  pick: (s: HistorySnapshot) => number
): DailyPoint[] {
  const byDay = new Map<string, number>();
  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const snap of sorted) {
    byDay.set(snap.timestamp.slice(0, 10), pick(snap));
  }

  return Array.from(byDay.entries()).map(([date, y], x) => ({ x, y, date }));
}

function linearRegression(points: DailyPoint[]) {
  const n = points.length;
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  const residuals = points.map((p) => p.y - (intercept + slope * p.x));
  const meanResidual = residuals.reduce((s, r) => s + r, 0) / n;
  const variance =
    residuals.reduce((s, r) => s + (r - meanResidual) ** 2, 0) / Math.max(1, n - 2);
  const residualStd = Math.sqrt(variance);

  return { slope, intercept, residualStd, lastX: points[n - 1].x, lastY: points[n - 1].y };
}

function project(
  model: NonNullable<ReturnType<typeof linearRegression>>,
  daysAhead: number
): { midpoint: number; low: number; high: number } {
  const x = model.lastX + daysAhead;
  const midpoint = model.intercept + model.slope * x;
  const horizonScale = Math.sqrt(1 + daysAhead / Math.max(model.lastX + 1, 7));
  const band = model.residualStd * 1.65 * horizonScale;
  return {
    midpoint: Math.max(0, midpoint),
    low: Math.max(0, midpoint - band),
    high: Math.max(0, midpoint + band),
  };
}

function trendFromPct(pct: number): ForecastTrend {
  if (pct > 0.75) return "up";
  if (pct < -0.75) return "down";
  return "flat";
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function buildPriceForecast(
  snapshots: HistorySnapshot[],
  horizonWeeks = 4
): PriceForecast | null {
  const series22 = toDailySeries(snapshots, (s) => s.lkrPerPavan22k);
  const series24 = toDailySeries(snapshots, (s) => s.lkrPerPavan24k);

  if (series22.length < 14 || series24.length < 14) return null;

  const model22 = linearRegression(series22);
  const model24 = linearRegression(series24);
  if (!model22 || !model24) return null;

  const lastDate = series22[series22.length - 1].date;
  const weeks: ForecastWeek[] = [];

  for (let week = 1; week <= horizonWeeks; week++) {
    const daysAhead = week * 7;
    const p22 = project(model22, daysAhead);
    const p24 = project(model24, daysAhead);

    weeks.push({
      week,
      label: `Week ${week}`,
      date: addDays(lastDate, daysAhead),
      lkrPerPavan22k: p22.midpoint,
      lkrPerPavan24k: p24.midpoint,
      low22k: p22.low,
      high22k: p22.high,
      low24k: p24.low,
      high24k: p24.high,
    });
  }

  const trendPct22k = ((weeks[weeks.length - 1].lkrPerPavan22k - model22.lastY) / model22.lastY) * 100;
  const trendPct24k = ((weeks[weeks.length - 1].lkrPerPavan24k - model24.lastY) / model24.lastY) * 100;
  const residualVolatilityPct = (model22.residualStd / model22.lastY) * 100;

  return {
    method: "trend-projection",
    horizonWeeks,
    trend: trendFromPct((trendPct22k + trendPct24k) / 2),
    trendPct22k,
    trendPct24k,
    residualVolatilityPct,
    asOf: new Date(`${lastDate}T00:00:00.000Z`).toISOString(),
    weeks,
  };
}
