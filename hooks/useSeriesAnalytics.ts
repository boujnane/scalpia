import { useMemo } from "react";
import { Item, PricePoint } from "@/lib/analyse/types";
import { aggregatePricesByDay } from "@/lib/utils";

// On reprend l'interface définie dans ton chart pour la cohérence
export interface SeriesSummary {
  seriesName: string;
  averageVariation: number;
  minPrice: number;
  maxPrice: number;
  longTermTrend: "up" | "down" | "stable";
  shortTermTrend?: "up" | "down" | "stable";
  coverageIndex: number;
  shortTermVariation?: number;
  hasRecentData?: boolean;
}

// Utilitaires internes au hook
function normalizeSeriesName(name: string): string {
  let normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ignoreWords = ["rugit", "garde", "lucario", "gardevoir", "sylveroy", "du froid", "effroi"];
  ignoreWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    normalized = normalized.replace(regex, "");
  });
  normalized = normalized.replace(/\s+/g, " ").trim();
  const fusionMap: Record<string, string> = {
    "koraidon ev": "ecarlate et violet",
    "miraidon ev": "ecarlate et violet",
    "mega evolution 1": "mega evolution",
    "vert forces temporelles": "forces temporelles",
    "serpente forces temporelles": "forces temporelles"
  };
  return fusionMap[normalized] ?? normalized;
}

function calculateTrend(prices: PricePoint[], daysBack?: number): { trend: "up" | "down" | "stable"; variation: number } {
  if (prices.length < 2) return { trend: "stable", variation: 0 };

  let filteredPrices = prices;
  if (daysBack !== undefined) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    filteredPrices = prices.filter(p => new Date(p.date) >= cutoffDate);
  }

  if (filteredPrices.length < 2) return { trend: "stable", variation: 0 };

  const firstPrice = filteredPrices[0].price;
  const lastPrice = filteredPrices[filteredPrices.length - 1].price;
  const variation = (lastPrice - firstPrice) / firstPrice;

  let trend: "up" | "down" | "stable" = "stable";
  if (variation > 0.05) trend = "up";
  else if (variation < -0.05) trend = "down";

  return { trend, variation };
}

export const useSeriesAnalytics = (items: Item[], selectedBloc: string) => {
  // Poids des produits
  const typeWeights: Record<string, number> = {
    ETB: 0.40, "Tri-Pack": 0.15, Display: 0.20, Bundle: 0.15, Artset: 0.07, "Demi-Display": 0.03
  };
  const MAX_POSSIBLE_WEIGHT = Object.values(typeWeights).reduce((a, b) => a + b, 0);

  // 1. Récupération des blocs uniques
  const blocs = useMemo(() => {
    const unique = new Set<string>();
    items.forEach(i => i.bloc && unique.add(i.bloc));
    return Array.from(unique).sort();
  }, [items]);

  // 2. Calcul principal
  const seriesStats = useMemo(() => {
    // Filtrage initial
    const filteredItems = items.filter(item => {
      if (item.type === "UPC") return false;
      if (selectedBloc === "all") return true;
      return item.bloc === selectedBloc;
    });

    // Groupement par série
    const seriesMap = new Map<string, Item[]>();
    filteredItems.forEach(item => {
      const seriesName = normalizeSeriesName(item.name);
      if (!seriesMap.has(seriesName)) seriesMap.set(seriesName, []);
      seriesMap.get(seriesName)!.push(item);
    });

    // Création des résumés (Data Crunching)
    const summaries: SeriesSummary[] = Array.from(seriesMap.entries()).map(([seriesName, itemsInSeries]) => {
      const itemsByType = new Map<string, Item[]>();
      itemsInSeries.forEach(item => {
        if (!itemsByType.has(item.type)) itemsByType.set(item.type, []);
        itemsByType.get(item.type)!.push(item);
      });

      let weightedSum = 0;
      let totalWeightUsed = 0;

      itemsByType.forEach((itemsOfSameType, itemType) => {
        const weight = typeWeights[itemType] ?? 0;
        if (weight === 0 || itemsOfSameType.length === 0) return;

        const variations = itemsOfSameType.flatMap(i => {
          if (!i.retailPrice || i.retailPrice === 0 || (i.prices ?? []).length === 0) return [];
          // On prend le prix le plus récent
          const sortedPrices = [...(i.prices!)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const lastPrice = sortedPrices[0].price;
          return (lastPrice - i.retailPrice) / i.retailPrice;
        });

        if (variations.length === 0) return;
        const typeAvgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
        weightedSum += typeAvgVariation * weight;
        totalWeightUsed += weight;
      });

      const averageVariation = totalWeightUsed > 0 ? weightedSum / totalWeightUsed : 0;
      const coverageIndex = parseFloat((totalWeightUsed / MAX_POSSIBLE_WEIGHT).toFixed(2));

      // Stats de prix
      const allPricesFlat = itemsInSeries.flatMap(item => (item.prices ?? []).map(p => p.price));
      const minPrice = allPricesFlat.length > 0 ? Math.min(...allPricesFlat) : 0;
      const maxPrice = allPricesFlat.length > 0 ? Math.max(...allPricesFlat) : 0;

      // Calcul des trends sur historique agrégé
      const allPriceHistory = itemsInSeries.flatMap(item => item.prices || []);
      // Tri ascendant pour l'aggrégation
      allPriceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const aggregatedPrices = aggregatePricesByDay(allPriceHistory);

      const longTermTrend = averageVariation > 0.05 ? "up" : averageVariation < -0.05 ? "down" : "stable";
      
      const shortTermResult = calculateTrend(aggregatedPrices, 7);
      const hasRecentData = aggregatedPrices.some(p => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        return new Date(p.date) >= cutoff;
      });

      return {
        seriesName,
        averageVariation,
        minPrice,
        maxPrice,
        longTermTrend,
        shortTermTrend: hasRecentData ? shortTermResult.trend : undefined,
        shortTermVariation: hasRecentData ? shortTermResult.variation : undefined,
        coverageIndex,
        hasRecentData
      };
    });

    // KPIs Globaux
    const totalSeries = summaries.length;
    const upCount = summaries.filter(s => s.longTermTrend === 'up').length;
    const downCount = summaries.filter(s => s.longTermTrend === 'down').length;
    const avgVar = totalSeries > 0 ? summaries.reduce((acc, s) => acc + s.averageVariation, 0) / totalSeries : 0;

    return {
      data: summaries,
      kpis: { totalSeries, upCount, downCount, avgVar }
    };
  }, [items, selectedBloc]);

  return { blocs, ...seriesStats };
};