import { useMemo } from "react";
import type { Item } from "@/lib/analyse/types";
import { normalizeSeriesName } from "@/lib/analyse/finance/normalize";
import { buildSeriesIndexDailyMedian, medianRetail } from "@/lib/analyse/finance/aggregate";
import { computeFinanceMetrics } from "@/lib/analyse/finance/metrics";
import { SeriesFinanceSummary, computeSeriesKPIs, trendFromReturn } from "@/lib/analyse/finance/series";
import type { PricePoint } from "@/lib/analyse/finance/types";
import { isKnownSeriesName } from "@/lib/utils";

export function useSeriesFinance(items: Item[], selectedBloc: string) {
  return useMemo(() => {
    // 1) filter bloc + exclude items sans prix
    const filtered = items.filter(i => {
      if (selectedBloc !== "all" && i.bloc !== selectedBloc) return false;
      return (i.prices?.length ?? 0) > 0;
    });

    // 2) group by series
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
      const retail = medianRetail(group.map(g => (typeof g.retailPrice === "number" ? g.retailPrice : null)));

      const itemsPrices: PricePoint[][] = group.map(g =>
        (g.prices ?? []).map(p => ({ date: p.date, price: p.price }))
      );

      const indexDaily = buildSeriesIndexDailyMedian(itemsPrices);

      const metrics = computeFinanceMetrics({
        prices: indexDaily,
        retailPrice: retail,
      });

      const lastDate = indexDaily.length ? indexDaily[indexDaily.length - 1].date : null;

      summaries.push({
        seriesName,
        retail,
        indexPointsCount: indexDaily.length,
        lastDate,
        metrics,
        trend7d: trendFromReturn(metrics.return7d),
        trend30d: trendFromReturn(metrics.return30d),
      });
    }

    // 4) KPIs globaux
    const kpis = computeSeriesKPIs(summaries);

    // 5) blocs list (si tu veux garder ton select)
    const blocs = Array.from(new Set(items.map(i => i.bloc).filter(Boolean) as string[])).sort();

    return { blocs, series: summaries, kpis };
  }, [items, selectedBloc]);
}
