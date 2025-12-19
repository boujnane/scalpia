import { PricePoint, FinanceMetrics } from "./types";
import { normalizeDailySeries, sliceLastNDays, daysBetween, expectedDaysInWindow } from "./timeseries";
import { returnOverDays } from "./returns";
import { volatilityFromLogReturns, maxDrawdown } from "./risk";
import { slopeLogPricePerDay } from "./trend";
import { lastPrice, premiumVsRetail } from "./retail";
import { scoreComposite } from "./score";

export function computeFinanceMetrics(input: {
  prices: PricePoint[];
  retailPrice?: number | null;
  now?: Date; // for tests
}): FinanceMetrics {
  const now = input.now ?? new Date();
  const retail = input.retailPrice ?? null;

  const base = normalizeDailySeries(input.prices);
  const last = base.last;

  const lastP = lastPrice(base);

  const w30 = sliceLastNDays(base, 30);
  const w90 = sliceLastNDays(base, 90);

  // coverage 30d = number of days with data / expected days in window
  const expected30 = expectedDaysInWindow(base, 30);
  const coverage30d = expected30 > 0 ? Math.min(1, w30.points.length / expected30) : 0;

  const freshnessDays =
    last ? Math.max(0, daysBetween(last.date, now)) : null;

  const premiumNow = premiumVsRetail(lastP, retail);
  const premium30d = premiumVsRetail(w30.last ? w30.last.price : null, retail);

  const return7d = returnOverDays(base, 7);
  const return30d = returnOverDays(base, 30);

  const vol30d = volatilityFromLogReturns(w30);
  const maxDrawdown90d = maxDrawdown(w90);

  const slope30d = slopeLogPricePerDay(w30);

  const score = scoreComposite({
    premium30d,
    slope30d,
    vol30d,
    maxDrawdown90d,
    coverage30d,
    freshnessDays,
  });

  return {
    lastPrice: lastP,
    retail,

    premiumNow,
    premium30d,

    return7d,
    return30d,

    vol30d,
    maxDrawdown90d,

    slope30d,
    coverage30d,
    freshnessDays,

    score,
  };
}
