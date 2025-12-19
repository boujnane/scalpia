import { WindowedSeries } from "./types";

type RegressionResult = { slope: number | null };

export function linearRegressionSlope(xs: number[], ys: number[]): RegressionResult {
  if (xs.length !== ys.length || xs.length < 2) return { slope: null };

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    num += dx * (ys[i] - meanY);
    den += dx * dx;
  }

  if (den === 0) return { slope: null };
  return { slope: num / den };
}

export function slopeLogPricePerDay(series: WindowedSeries): number | null {
  const pts = series.points;
  if (pts.length < 2) return null;

  const xs = pts.map(p => p.t);
  const ys = pts.map(p => Math.log(p.price));

  return linearRegressionSlope(xs, ys).slope; // per day
}
