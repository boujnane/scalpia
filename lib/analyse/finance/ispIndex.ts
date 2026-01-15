import { PricePoint } from "./types";
import { normalizeDailySeries, toDayKey, parseDate } from "./timeseries";

/**
 * ISP-FR : Index du Scellé Pokémon FR
 *
 * Représente l'évolution globale de la VALORISATION du marché des produits scellés Pokémon français.
 * Base 100 = valeur initiale au premier jour de données
 *
 * Méthodologie INDEX CHAÎNÉ :
 * - Calcule les variations jour par jour uniquement avec les items présents les deux jours
 * - Chaîne ces variations à partir d'une base 100
 * - L'ajout d'un nouvel item n'affecte pas l'historique passé
 * - ISP-FR = 130 signifie "le marché a gagné 30% depuis le début"
 * - ISP-FR = 80 signifie "le marché a perdu 20% depuis le début"
 *
 * Avantages :
 * - Stable dans le temps (l'ajout d'items n'affecte pas le passé)
 * - Comparable dans le temps
 * - Méthodologie identique aux grands indices (CAC40, S&P500)
 */

export type ISPIndexPoint = {
  date: string; // YYYY-MM-DD
  value: number; // Index value (100 = base initiale)
  itemCount: number; // Nombre d'items utilisés pour calculer la variation du jour
  dailyChange: number; // Variation du jour (0.02 = +2%)
};

export type ISPIndexSummary = {
  current: number; // Valeur actuelle (100 = retail)
  change7d: number | null; // Variation sur 7 jours (en %)
  change30d: number | null; // Variation sur 30 jours (en %)
  change90d: number | null; // Variation sur 90 jours (en %)
  changeYTD: number | null; // Variation depuis début d'année (en %)
  changeSinceBase: number; // Variation depuis la base 100 (en %)
  lastUpdate: string | null; // Date de dernière mise à jour
  trend: "up" | "down" | "stable"; // Tendance actuelle
  history: ISPIndexPoint[]; // Historique complet
  marketStatus: "overvalued" | "fairly_valued" | "undervalued"; // Statut du marché
};

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Construit l'historique journalier de l'ISP-FR avec la méthode de l'index chaîné
 *
 * Méthodologie :
 * 1. Pour chaque item, on stocke ses prix par jour
 * 2. On calcule les variations jour par jour uniquement avec les items présents les deux jours
 * 3. On chaîne ces variations à partir d'une base 100
 *
 * @param itemsData - Tableau d'items avec prix et retail
 * @returns Historique de l'index
 */
export function buildISPIndex(
  itemsData: Array<{
    prices: PricePoint[];
    retailPrice?: number;
  }>
): ISPIndexPoint[] {
  // Étape 1 : Construire une map item -> (jour -> prix)
  // On utilise un identifiant unique pour chaque item (son index dans le tableau)
  const itemPricesByDay: Map<number, Map<string, number>> = new Map();

  for (let itemIdx = 0; itemIdx < itemsData.length; itemIdx++) {
    const item = itemsData[itemIdx];
    if (!item.prices || item.prices.length === 0) continue;
    if (!item.retailPrice || item.retailPrice <= 0) continue;

    const normalized = normalizeDailySeries(item.prices).points;
    const dayPrices = new Map<string, number>();

    for (const point of normalized) {
      if (point.price <= 0) continue;
      const day = toDayKey(point.date);
      dayPrices.set(day, point.price);
    }

    if (dayPrices.size > 0) {
      itemPricesByDay.set(itemIdx, dayPrices);
    }
  }

  if (itemPricesByDay.size === 0) return [];

  // Étape 2 : Collecter tous les jours uniques et les trier
  const allDays = new Set<string>();
  for (const dayPrices of itemPricesByDay.values()) {
    for (const day of dayPrices.keys()) {
      allDays.add(day);
    }
  }

  const sortedDays = Array.from(allDays).sort((a, b) => a.localeCompare(b));

  if (sortedDays.length === 0) return [];

  // Étape 3 : Construire l'index chaîné
  const indexPoints: ISPIndexPoint[] = [];
  let currentIndex = 100; // Base 100

  for (let dayIdx = 0; dayIdx < sortedDays.length; dayIdx++) {
    const currentDay = sortedDays[dayIdx];
    const date = parseDate(currentDay);
    if (!date) continue;

    if (dayIdx === 0) {
      // Premier jour : base 100, pas de variation
      const itemsWithData = Array.from(itemPricesByDay.values()).filter(
        (dayPrices) => dayPrices.has(currentDay)
      ).length;

      indexPoints.push({
        date: currentDay,
        value: currentIndex,
        itemCount: itemsWithData,
        dailyChange: 0,
      });
      continue;
    }

    // Jours suivants : calculer la variation avec les items présents les deux jours
    const previousDay = sortedDays[dayIdx - 1];
    const dailyChanges: number[] = [];

    for (const [itemIdx, dayPrices] of itemPricesByDay.entries()) {
      const pricePrevious = dayPrices.get(previousDay);
      const priceCurrent = dayPrices.get(currentDay);

      // L'item doit avoir un prix les deux jours
      if (pricePrevious != null && priceCurrent != null && pricePrevious > 0) {
        const change = (priceCurrent - pricePrevious) / pricePrevious;
        dailyChanges.push(change);
      }
    }

    // Si aucun item n'est présent les deux jours, on garde la même valeur
    let avgDailyChange = 0;
    if (dailyChanges.length > 0) {
      avgDailyChange = mean(dailyChanges) ?? 0;
    }

    // Appliquer la variation à l'index
    currentIndex = currentIndex * (1 + avgDailyChange);

    indexPoints.push({
      date: currentDay,
      value: currentIndex,
      itemCount: dailyChanges.length,
      dailyChange: avgDailyChange,
    });
  }

  return indexPoints;
}

/**
 * Calcule un résumé de l'ISP-FR avec les variations clés
 */
export function computeISPSummary(
  indexHistory: ISPIndexPoint[],
  now: Date = new Date()
): ISPIndexSummary {
  if (indexHistory.length === 0) {
    return {
      current: 100,
      change7d: null,
      change30d: null,
      change90d: null,
      changeYTD: null,
      changeSinceBase: 0,
      lastUpdate: null,
      trend: "stable",
      history: [],
      marketStatus: "fairly_valued",
    };
  }

  const sorted = [...indexHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const lastPoint = sorted[sorted.length - 1];
  const current = lastPoint.value;
  const lastUpdate = lastPoint.date;

  // Fonction helper pour trouver un point à N jours avant
  const findPointNDaysAgo = (days: number): number | null => {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - days);
    const targetMs = targetDate.getTime();

    // Trouver le point le plus proche avant targetDate
    let closestPoint: ISPIndexPoint | null = null;
    let minDiff = Infinity;

    for (const p of sorted) {
      const pMs = new Date(p.date).getTime();
      if (pMs > targetMs) break;

      const diff = targetMs - pMs;
      if (diff < minDiff) {
        minDiff = diff;
        closestPoint = p;
      }
    }

    return closestPoint ? closestPoint.value : null;
  };

  // Calcul des variations
  const value7d = findPointNDaysAgo(7);
  const value30d = findPointNDaysAgo(30);
  const value90d = findPointNDaysAgo(90);

  const change7d = value7d ? ((current - value7d) / value7d) : null;
  const change30d = value30d ? ((current - value30d) / value30d) : null;
  const change90d = value90d ? ((current - value90d) / value90d) : null;

  // Variation depuis début d'année
  const ytdDate = new Date(now.getFullYear(), 0, 1);
  const ytdPoint = sorted.find(p => new Date(p.date) >= ytdDate);
  const changeYTD = ytdPoint ? ((current - ytdPoint.value) / ytdPoint.value) : null;

  // Variation depuis la base (100 = retail)
  const changeSinceBase = (current - 100) / 100;

  // Déterminer la tendance
  let trend: "up" | "down" | "stable" = "stable";
  if (change7d != null) {
    if (change7d > 0.02) trend = "up";
    else if (change7d < -0.02) trend = "down";
  }

  // Déterminer le statut du marché basé sur la valeur actuelle
  let marketStatus: "overvalued" | "fairly_valued" | "undervalued" = "fairly_valued";
  if (current >= 150) {
    marketStatus = "overvalued"; // +50% ou plus vs retail
  } else if (current <= 80) {
    marketStatus = "undervalued"; // -20% ou moins vs retail
  }

  return {
    current,
    change7d,
    change30d,
    change90d,
    changeYTD,
    changeSinceBase,
    lastUpdate,
    trend,
    history: sorted,
    marketStatus,
  };
}

/**
 * Calcule l'ISP-FR à partir des items avec leurs prix retail
 */
export function computeISPFromItems(
  items: Array<{
    prices?: Array<{ date: string; price: number }>;
    retailPrice?: number;
  }>
): ISPIndexSummary {
  // Filtrer les items qui ont des prix ET un prix retail
  const validItems = items.filter(
    (item) => item.prices && item.prices.length > 0 && item.retailPrice && item.retailPrice > 0
  );

  if (validItems.length === 0) {
    return computeISPSummary([]);
  }

  // Construire l'index basé sur les ratios prix/retail
  const itemsData = validItems.map((item) => ({
    prices: item.prices!.map((p) => ({ date: p.date, price: p.price })),
    retailPrice: item.retailPrice!,
  }));

  const indexHistory = buildISPIndex(itemsData);
  return computeISPSummary(indexHistory);
}

/**
 * DEBUG: Analyse les items responsables d'une variation entre deux dates
 * Retourne les items triés par impact sur la variation
 */
export type ItemVariationDebug = {
  name: string;
  priceBefore: number;
  priceAfter: number;
  change: number; // en %
  impact: "hausse" | "baisse" | "stable";
};

export function debugVariationBetweenDates(
  items: Array<{
    name: string;
    prices?: Array<{ date: string; price: number }>;
    retailPrice?: number;
  }>,
  dateBefore: string, // YYYY-MM-DD
  dateAfter: string   // YYYY-MM-DD
): ItemVariationDebug[] {
  const results: ItemVariationDebug[] = [];

  for (const item of items) {
    if (!item.prices || item.prices.length === 0) continue;
    if (!item.retailPrice || item.retailPrice <= 0) continue;

    // Normaliser les prix par jour
    const normalized = normalizeDailySeries(item.prices).points;
    const priceMap = new Map<string, number>();

    for (const p of normalized) {
      const day = toDayKey(p.date);
      priceMap.set(day, p.price);
    }

    const priceBefore = priceMap.get(dateBefore);
    const priceAfter = priceMap.get(dateAfter);

    // L'item doit avoir des prix les deux jours
    if (priceBefore == null || priceAfter == null) continue;

    const change = (priceAfter - priceBefore) / priceBefore;

    results.push({
      name: item.name,
      priceBefore,
      priceAfter,
      change,
      impact: change > 0.01 ? "hausse" : change < -0.01 ? "baisse" : "stable",
    });
  }

  // Trier par variation absolue décroissante
  results.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

  return results;
}
