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

const RECENT_WINDOW_DAYS = 21;
const DAMPING_PER_WEEK = 0.72;

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

function recentWindow(points: DailyPoint[]): DailyPoint[] {
  if (points.length <= RECENT_WINDOW_DAYS) return points;
  const start = points.length - RECENT_WINDOW_DAYS;
  return points.slice(start).map((p, i) => ({ ...p, x: i }));
}

function weightedLinearRegression(points: DailyPoint[]) {
  const n = points.length;
  if (n < 7) return null;

  let sumW = 0;
  let sumWX = 0;
  let sumWY = 0;
  let sumWXY = 0;
  let sumWXX = 0;

  for (let i = 0; i < n; i++) {
    const weight = 0.65 + (i / Math.max(n - 1, 1)) * 0.35;
    const x = points[i].x;
    const y = points[i].y;
    sumW += weight;
    sumWX += weight * x;
    sumWY += weight * y;
    sumWXY += weight * x * y;
    sumWXX += weight * x * x;
  }

  const denom = sumW * sumWXX - sumWX * sumWX;
  if (denom === 0) return null;

  const slope = (sumW * sumWXY - sumWX * sumWY) / denom;
  const intercept = (sumWY - slope * sumWX) / sumW;

  const residuals = points.map((p) => p.y - (intercept + slope * p.x));
  const variance = residuals.reduce((s, r) => s + r * r, 0) / Math.max(1, n - 2);
  const residualStd = Math.sqrt(variance);

  const last = points[n - 1];
  const weekReturn = last.y > 0 ? (slope * 7) / last.y : 0;

  return {
    slope,
    intercept,
    residualStd,
    lastX: last.x,
    lastY: last.y,
    lastDate: last.date,
    weekReturn,
  };
}

function projectWeek(
  model: NonNullable<ReturnType<typeof weightedLinearRegression>>,
  week: number
): { midpoint: number; low: number; high: number } {
  const dampedSlope = model.slope * DAMPING_PER_WEEK ** (week - 1);
  const daysAhead = week * 7;
  const linearTarget = model.intercept + dampedSlope * (model.lastX + daysAhead);
  const momentumTarget = model.lastY * (1 + model.weekReturn * week * DAMPING_PER_WEEK ** (week - 1));
  const midpoint = model.lastY * 0.35 + linearTarget * 0.35 + momentumTarget * 0.3;

  const horizonScale = Math.sqrt(1 + daysAhead / 14);
  const band = model.residualStd * 1.35 * horizonScale;

  return {
    midpoint: Math.max(0, midpoint),
    low: Math.max(0, midpoint - band),
    high: Math.max(0, midpoint + band),
  };
}

function trendFromPct(pct: number): ForecastTrend {
  if (pct > 0.5) return "up";
  if (pct < -0.5) return "down";
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
  const series22 = recentWindow(toDailySeries(snapshots, (s) => s.lkrPerPavan22k));
  const series24 = recentWindow(toDailySeries(snapshots, (s) => s.lkrPerPavan24k));

  if (series22.length < 14 || series24.length < 14) return null;

  const model22 = weightedLinearRegression(series22);
  const model24 = weightedLinearRegression(series24);
  if (!model22 || !model24) return null;

  const lastDate = series22[series22.length - 1].date;
  const weeks: ForecastWeek[] = [];

  for (let week = 1; week <= horizonWeeks; week++) {
    const p22 = projectWeek(model22, week);
    const p24 = projectWeek(model24, week);

    weeks.push({
      week,
      label: `Week ${week}`,
      date: addDays(lastDate, week * 7),
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
