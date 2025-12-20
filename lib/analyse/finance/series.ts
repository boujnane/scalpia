import { FinanceMetrics } from "./types";

export type SeriesFinanceSummary = {
  seriesName: string;

  // retail (agrégé)
  retail: number | null;

  // index journalier (agrégé)
  indexPointsCount: number;
  lastDate: string | null;

  // metrics finance
  metrics: FinanceMetrics;

  // tags UI rapides
  trend7d: "up" | "down" | "stable" | "na";
  trend30d: "up" | "down" | "stable" | "na";

  minItemPrice: number | null;
  maxItemPrice: number | null;
  itemsCount: number;

};

export type SeriesFinanceKPIs = {
  totalSeries: number;
  up7d: number;
  down7d: number;
  avgScore: number | null;

  // “market health”
  medianPremiumNow: number | null;
  medianVol30d: number | null;
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export function trendFromReturn(r: number | null): "up" | "down" | "stable" | "na" {
  if (r == null) return "na";
  if (r > 0.02) return "up";
  if (r < -0.02) return "down";
  return "stable";
}

export function computeSeriesKPIs(series: SeriesFinanceSummary[]): SeriesFinanceKPIs {
  const scores = series.map(s => s.metrics.score).filter((x): x is number => x != null);
  const premiumNow = series.map(s => s.metrics.premiumNow).filter((x): x is number => x != null);
  const vol30d = series.map(s => s.metrics.vol30d).filter((x): x is number => x != null);

  const up7d = series.filter(s => s.trend7d === "up").length;
  const down7d = series.filter(s => s.trend7d === "down").length;

  return {
    totalSeries: series.length,
    up7d,
    down7d,
    avgScore: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    medianPremiumNow: median(premiumNow),
    medianVol30d: median(vol30d),
  };
}
