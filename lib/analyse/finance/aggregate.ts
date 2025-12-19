import { PricePoint } from "./types";
import { normalizeDailySeries, toDayKey, parseDate } from "./timeseries";

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const a = [...values].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

export function medianRetail(retails: Array<number | null | undefined>): number | null {
  const vals = retails.filter((x): x is number => typeof x === "number" && Number.isFinite(x) && x > 0);
  return median(vals);
}

/**
 * Construit une série journalière agrégée (médiane) à partir de N items.
 * - chaque item: PricePoint[]
 * - output: PricePoint[] (unique par jour, triée)
 */
export function buildSeriesIndexDailyMedian(itemsPrices: PricePoint[][]): PricePoint[] {
  // map day -> list of prices
  const map = new Map<string, number[]>();

  for (const prices of itemsPrices) {
    // normalise chaque item en daily unique
    const daily = normalizeDailySeries(prices).points;
    for (const p of daily) {
      const day = toDayKey(p.date);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(p.price);
    }
  }

  // reduce to median per day
  const out: PricePoint[] = [];
  for (const [day, vals] of map.entries()) {
    const m = median(vals);
    if (m == null) continue;
    // day -> Date
    const d = parseDate(day);
    if (!d) continue;
    out.push({ date: day, price: m });
  }

  out.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return out;
}
