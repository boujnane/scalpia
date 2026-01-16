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

export function useSeriesFinance(items: Item[], selectedBloc: string) {
  return useMemo(() => {
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
      });
    }

    // 4) KPIs globaux
    const kpis = computeSeriesKPIs(summaries);

    // 5) blocs list
    const blocs = Array.from(new Set(items.map(i => i.bloc).filter(Boolean) as string[])).sort();

    return { blocs, series: summaries, kpis };
  }, [items, selectedBloc]);
}
