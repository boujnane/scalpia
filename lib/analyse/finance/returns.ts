import { WindowedSeries } from "./types";

export function simpleReturn(a: number, b: number): number {
  // b/a - 1
  return b / a - 1;
}

export function logReturns(series: WindowedSeries): number[] {
  const pts = series.points;
  if (pts.length < 2) return [];
  const out: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1].price;
    const curr = pts[i].price;
    if (prev > 0 && curr > 0) out.push(Math.log(curr / prev));
  }
  return out;
}

export function returnOverDays(series: WindowedSeries, days: number): number | null {
  if (!series.last) return null;
  const last = series.last;
  const targetT = last.t - days;
  // find closest point at or before targetT
  const pts = series.points;
  let anchor: typeof pts[number] | null = null;
  for (let i = pts.length - 1; i >= 0; i--) {
    if (pts[i].t <= targetT) { anchor = pts[i]; break; }
  }
  if (!anchor) return null;
  if (anchor.price <= 0) return null;
  return last.price / anchor.price - 1;
}
