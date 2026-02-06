import { useMemo } from "react";
import type { Item } from "@/lib/analyse/types";
import { normalizeSeriesName } from "@/lib/analyse/finance/normalize";
import { buildSeriesIndexDailyMedian, medianRetail } from "@/lib/analyse/finance/aggregate";
import { computeFinanceMetrics } from "@/lib/analyse/finance/metrics";
import type { PricePoint } from "@/lib/analyse/finance/types";
import { SeriesFinanceSummary, computeSeriesKPIs, trendFromReturn } from "@/lib/analyse/finance/series";
import { isKnownSeriesName } from "@/lib/utils";

function getLastItemPrice(
  prices: Array<{ date: string; price: number }> | undefined
): number | null {
  if (!prices?.length) return null;

  // safe: garde seulement les prix valides puis trie par date
  const last = [...prices]
    .filter(p => Number.isFinite(p.price))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .at(-1);

  return last?.price ?? null;
}

function parseReleaseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function yearsSince(date: Date, now: Date): number {
  const diffMs = now.getTime() - date.getTime();
  const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, years);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Ajustement simple du régime "hype globalisée" observé sur 2020-2021.
 * 1.0 = pas d'ajustement ; <1 = on neutralise une part du boost de hype.
 */
function hypeAdjustmentFactor(releaseDate: Date): number {
  const year = releaseDate.getUTCFullYear();
  if (year === 2020) return 0.72;
  if (year === 2021) return 0.78;
  if (year === 2022) return 0.88;
  if (year >= 2023) return 0.93;
  return 1;
}

function computeLongTermProxy(group: Item[], now: Date) {
  const annualLinearReturns: number[] = [];
  const ref5yReturns: number[] = [];
  const ref10yReturns: number[] = [];
  const ageYears: number[] = [];
  const hypeRatios: number[] = [];
  let aboveRetailCount = 0;
  let validCount = 0;

  for (const item of group) {
    const retail = typeof item.retailPrice === "number" && item.retailPrice > 0 ? item.retailPrice : null;
    const lastPrice = getLastItemPrice(item.prices);
    const releaseDate = parseReleaseDate(item.releaseDate);
    if (retail == null || lastPrice == null || releaseDate == null) continue;

    const rawAgeYears = yearsSince(releaseDate, now);
    if (!Number.isFinite(rawAgeYears) || rawAgeYears <= 0) continue;

    const effectiveAgeYears = clamp(rawAgeYears, 0.25, 20);
    const cumulativeReturn = lastPrice / retail - 1;
    const baseAnnualLinear = cumulativeReturn / effectiveAgeYears;

    const hypeFactor = hypeAdjustmentFactor(releaseDate);
    const adjustedAnnualLinear = clamp(baseAnnualLinear * hypeFactor, -0.35, 0.9);

    const ref5y = clamp(adjustedAnnualLinear * 5, -0.8, 3.5);
    const ref10y = clamp(adjustedAnnualLinear * 10, -1, 6);

    annualLinearReturns.push(adjustedAnnualLinear);
    ref5yReturns.push(ref5y);
    ref10yReturns.push(ref10y);
    ageYears.push(rawAgeYears);
    hypeRatios.push(hypeFactor);

    if (cumulativeReturn > 0) aboveRetailCount += 1;
    validCount += 1;
  }

  const aboveRetailRatio = validCount > 0 ? aboveRetailCount / validCount : null;

  return {
    longTermAnnualLinear: median(annualLinearReturns),
    longTermRefReturn5y: median(ref5yReturns),
    longTermRefReturn10y: median(ref10yReturns),
    aboveRetailRatio,
    medianItemAgeYears: median(ageYears),
    hypeAdjustedRatio: median(hypeRatios),
  };
}

export function useSeriesFinance(items: Item[], selectedBloc: string) {
  return useMemo(() => {
    const now = new Date();
    // 1) filter bloc + exclude items sans prix
    const filtered = items.filter(i => {
      if (selectedBloc !== "all" && i.bloc !== selectedBloc) return false;
      return (i.prices?.length ?? 0) > 0;
    });

    // 2) group by series  ✅ (tu l'avais sauté)
    const seriesMap = new Map<string, Item[]>();
    for (const it of filtered) {
      const s = normalizeSeriesName(it.name);
      if (!isKnownSeriesName(s)) continue;

      if (!seriesMap.has(s)) seriesMap.set(s, []);
      seriesMap.get(s)!.push(it);
    }

    // 3) build summaries
    const summaries: SeriesFinanceSummary[] = [];

    for (const [seriesName, group] of seriesMap.entries()) {
      const retail = medianRetail(
        group.map(g => (typeof g.retailPrice === "number" ? g.retailPrice : null))
      );

      // ✅ fourchette = min/max des derniers prix de chaque item
      const itemLastPrices = group
        .map(g => getLastItemPrice(g.prices))
        .filter((x): x is number => Number.isFinite(x));

      const minItemPrice = itemLastPrices.length ? Math.min(...itemLastPrices) : null;
      const maxItemPrice = itemLastPrices.length ? Math.max(...itemLastPrices) : null;

      // index agrégé (médiane journalière)
      const itemsPrices: PricePoint[][] = group.map(g =>
        (g.prices ?? []).map(p => ({ date: p.date, price: p.price }))
      );

      const indexDaily = buildSeriesIndexDailyMedian(itemsPrices);

      if (seriesName.includes("fable") || seriesName.includes("nebuleuse")) {
        const day = "2026-01-16";

        const contrib = group.map((it, idx) => {
          const raw = (it.prices ?? []).filter(p => p.date.slice(0, 10) === day);
          return {
            item: it.name,
            idx,
            rawPointsThatDay: raw.map(p => ({ date: p.date, price: p.price })),
            lastPoint: it.prices?.at(-1),
          };
        });

        console.log("[DEBUG] Contributors on 2026-01-16:", contrib);
      }


      const metrics = computeFinanceMetrics({
        prices: indexDaily,
        retailPrice: retail,
      });

      const longTermProxy = computeLongTermProxy(group, now);

      // Debug: log fable nebuleuse data
      if (seriesName.includes("fable") || seriesName.includes("nebuleuse")) {
        console.log(`[DEBUG] ${seriesName}:`, {
          itemsCount: group.length,
          indexPointsCount: indexDaily.length,
          lastPrice: metrics.lastPrice,
          return7d: metrics.return7d,
          return30d: metrics.return30d,
          prices: indexDaily.slice(-10), // last 10 price points
        });
      }

      const lastDate = indexDaily.length ? indexDaily[indexDaily.length - 1].date : null;

      summaries.push({
        seriesName,
        retail,
        indexPointsCount: indexDaily.length,
        lastDate,
        metrics,
        trend7d: trendFromReturn(metrics.return7d),
        trend30d: trendFromReturn(metrics.return30d),

        minItemPrice,
        maxItemPrice,
        itemsCount: group.length,
        longTermRefReturn5y: longTermProxy.longTermRefReturn5y,
        longTermRefReturn10y: longTermProxy.longTermRefReturn10y,
        longTermAnnualLinear: longTermProxy.longTermAnnualLinear,
        aboveRetailRatio: longTermProxy.aboveRetailRatio,
        medianItemAgeYears: longTermProxy.medianItemAgeYears,
        hypeAdjustedRatio: longTermProxy.hypeAdjustedRatio,
      });
    }

    // 4) KPIs globaux
    const kpis = computeSeriesKPIs(summaries);

    // 5) blocs list
    const blocs = Array.from(new Set(items.map(i => i.bloc).filter(Boolean) as string[])).sort();

    return { blocs, series: summaries, kpis };
  }, [items, selectedBloc]);
}
