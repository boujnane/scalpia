import { PricePoint } from "./types";
import { normalizeDailySeries, toDayKey, parseDate } from "./timeseries";

/**
 * ISP-FR : Index du Scellé Pokémon FR
 *
 * Représente l'évolution globale de la VALORISATION du marché des produits scellés Pokémon français.
 * Base 100 = prix retail (prix de sortie moyen)
 *
 * Méthodologie CORRIGÉE :
 * - Calcule le ratio (prix_actuel / prix_retail) pour chaque série
 * - Agrège ces ratios (moyenne pondérée) pour obtenir un indice global
 * - ISP-FR = 130 signifie "le marché vaut en moyenne 30% de plus que les prix retail"
 * - ISP-FR = 80 signifie "le marché vaut en moyenne 20% de moins que les prix retail"
 *
 * Avantages :
 * - Reflète la vraie valorisation du marché
 * - Indépendant de la composition (ETB vs Display)
 * - Comparable dans le temps
 * - Compréhensible pour le grand public
 */

export type ISPIndexPoint = {
  date: string; // YYYY-MM-DD
  value: number; // Index value (100 = prix retail moyen)
  seriesCount: number; // Nombre de séries ayant des données ce jour-là
  avgPremium: number; // Premium moyen (0.3 = +30% vs retail)
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
 * Construit l'historique journalier de l'ISP-FR basé sur les primes/ratios
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
  // Map: date -> [ratios des items ayant un prix ce jour-là]
  const dailyRatiosMap = new Map<string, number[]>();

  // Pour chaque item
  for (const item of itemsData) {
    if (!item.prices || item.prices.length === 0) continue;
    if (!item.retailPrice || item.retailPrice <= 0) continue; // Besoin du retail !

    const normalized = normalizeDailySeries(item.prices).points;

    // Pour chaque jour de cet item
    for (const point of normalized) {
      if (point.price <= 0) continue;

      const day = toDayKey(point.date);
      const ratio = point.price / item.retailPrice; // Ratio prix/retail

      if (!dailyRatiosMap.has(day)) {
        dailyRatiosMap.set(day, []);
      }
      dailyRatiosMap.get(day)!.push(ratio);
    }
  }

  // Calculer l'index pour chaque jour
  const indexPoints: ISPIndexPoint[] = [];

  for (const [day, ratios] of dailyRatiosMap.entries()) {
    if (ratios.length === 0) continue;

    // Moyenne des ratios (ou médiane, au choix)
    const avgRatio = mean(ratios); // Moyenne pour lisser les outliers
    // const avgRatio = median(ratios); // Médiane pour être plus robuste aux outliers

    if (avgRatio == null || avgRatio <= 0) continue;

    const date = parseDate(day);
    if (!date) continue;

    const premium = avgRatio - 1; // 1.3 -> 0.3 (+30%)

    indexPoints.push({
      date: day,
      value: avgRatio * 100, // 1.3 -> 130 (base 100)
      seriesCount: ratios.length,
      avgPremium: premium,
    });
  }

  // Trier par date
  indexPoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
