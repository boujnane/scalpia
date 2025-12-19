import { PricePoint, WindowedSeries } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(dateStr: string): Date | null {
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDayKey(d: Date): string {
  // UTC day key
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function normalizeDailySeries(raw: PricePoint[]): WindowedSeries {
  // 1) parse & filter invalid
  const parsed = raw
    .map(p => {
      const date = parseDate(p.date);
      const price = Number(p.price);
      if (!date || !Number.isFinite(price) || price <= 0) return null;
      return { date, price };
    })
    .filter(Boolean) as { date: Date; price: number }[];

  if (parsed.length === 0) return { points: [], last: null };

  // 2) group by day (keep last observation of the day)
  const byDay = new Map<string, { date: Date; price: number }>();
  for (const p of parsed) {
    const k = toDayKey(p.date);
    const existing = byDay.get(k);
    // keep the most recent timestamp within that day
    if (!existing || p.date.getTime() > existing.date.getTime()) {
      byDay.set(k, p);
    }
  }

  // 3) sort asc
  const pointsAsc = Array.from(byDay.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(p => ({
      date: p.date,
      t: Math.floor(p.date.getTime() / DAY_MS), // day index
      price: p.price,
    }));

  const last = pointsAsc[pointsAsc.length - 1] ?? null;
  return { points: pointsAsc, last };
}

export function sliceLastNDays(series: WindowedSeries, days: number): WindowedSeries {
  if (!series.last) return { points: [], last: null };
  const cutoffT = series.last.t - (days - 1);
  const points = series.points.filter(p => p.t >= cutoffT);
  return { points, last: points[points.length - 1] ?? null };
}

export function daysBetween(a: Date, b: Date): number {
  const ua = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const ub = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((ub - ua) / DAY_MS);
}

export function expectedDaysInWindow(series: WindowedSeries, days: number): number {
  if (!series.last) return 0;
  return Math.max(1, days);
}
