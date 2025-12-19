import { WindowedSeries } from "./types";
import { logReturns } from "./returns";

export function stdev(values: number[]): number | null {
  if (values.length < 2) return null;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const varSum = values.reduce((acc, v) => acc + (v - mean) ** 2, 0);
  return Math.sqrt(varSum / (values.length - 1));
}

export function volatilityFromLogReturns(series: WindowedSeries): number | null {
  const lr = logReturns(series);
  return stdev(lr);
}

export function maxDrawdown(series: WindowedSeries): number | null {
  const pts = series.points;
  if (pts.length < 2) return null;

  let peak = pts[0].price;
  let mdd = 0;

  for (const p of pts) {
    if (p.price > peak) peak = p.price;
    const dd = peak > 0 ? (peak - p.price) / peak : 0;
    if (dd > mdd) mdd = dd;
  }

  return mdd; // 0..1
}
