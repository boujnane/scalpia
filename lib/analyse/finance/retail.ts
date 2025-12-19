import { WindowedSeries } from "./types";

export function premiumVsRetail(price: number | null, retail: number | null): number | null {
  if (price == null || retail == null) return null;
  if (!Number.isFinite(price) || !Number.isFinite(retail) || retail <= 0) return null;
  return price / retail - 1;
}

export function lastPrice(series: WindowedSeries): number | null {
  return series.last ? series.last.price : null;
}
