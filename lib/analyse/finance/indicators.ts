import { WindowedSeries } from "./types";
import { logReturns } from "./returns";
import { stdev } from "./risk";

/**
 * Indicateurs adaptés au marché scellé Pokémon
 *
 * CONTEXTE IMPORTANT:
 * - Pas de volume de transactions disponible
 * - Données = prix le plus bas journalier par item
 * - Données souvent clairsemées (pas un point par jour)
 * - Pas de notion de "taux sans risque" pertinente
 *
 * Les indicateurs sont simplifiés et adaptés à ce contexte.
 */

// ============================================================================
// CONSTANTES ADAPTÉES AU MARCHÉ SCELLÉ
// ============================================================================

/** Jours par an pour annualisation (on utilise 365 car marché non-boursier) */
const DAYS_PER_YEAR = 365;

/** Nombre minimum de points pour calculer un indicateur fiable */
const MIN_POINTS_FOR_INDICATOR = 5;

/** Nombre minimum de points pour le RSI adapté */
const MIN_POINTS_FOR_RSI = 5;

// ============================================================================
// UTILITAIRES STATISTIQUES
// ============================================================================

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function percentileRank(value: number, distribution: number[]): number {
  if (distribution.length === 0) return 0.5;
  const below = distribution.filter(v => v < value).length;
  const equal = distribution.filter(v => v === value).length;
  return (below + 0.5 * equal) / distribution.length;
}

export function quantile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

/**
 * Calcule l'asymétrie (skewness) de la distribution
 * - Positif : plus de hausses extrêmes que de baisses
 * - Négatif : plus de baisses extrêmes que de hausses
 */
export function skewness(values: number[]): number | null {
  if (values.length < 3) return null;
  const m = mean(values);
  const s = stdev(values);
  if (m == null || s == null || s === 0) return null;

  const n = values.length;
  const sum = values.reduce((acc, v) => acc + Math.pow((v - m) / s, 3), 0);
  return (n / ((n - 1) * (n - 2))) * sum;
}

// ============================================================================
// INDICATEURS DE PERFORMANCE (ADAPTÉS AU SCELLÉ)
// ============================================================================

export type RiskAdjustedMetrics = {
  /** Ratio Rendement/Volatilité (simplifié, sans taux sans risque) */
  returnToVolRatio: number | null;
  /** Ratio Rendement/Volatilité négative */
  returnToDownsideRatio: number | null;
  /** Ratio Rendement/Max Drawdown */
  returnToDrawdownRatio: number | null;
  /** Volatilité annualisée */
  volatilityAnnualized: number | null;
  /** Déviation négative (volatilité des baisses uniquement) */
  downsideDeviation: number | null;
};

/**
 * Annualise la volatilité quotidienne
 * Pour le marché scellé, on utilise 365 jours (pas de week-ends fermés)
 */
export function annualizeVolatility(dailyVol: number | null): number | null {
  if (dailyVol == null) return null;
  return dailyVol * Math.sqrt(DAYS_PER_YEAR);
}

/**
 * Calcule la déviation négative (downside deviation)
 * Ne considère que les baisses de prix
 */
export function downsideDeviation(series: WindowedSeries): number | null {
  const returns = logReturns(series);
  if (returns.length < MIN_POINTS_FOR_INDICATOR) return null;

  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return 0;

  const sumSq = negativeReturns.reduce((acc, r) => acc + r * r, 0);
  return Math.sqrt(sumSq / returns.length);
}

/**
 * Ratio Rendement / Volatilité
 *
 * Version simplifiée du Sharpe Ratio sans taux sans risque
 * (le concept de taux sans risque n'a pas de sens pour les collectibles)
 *
 * Interprétation:
 * - < 0 : Rendement négatif
 * - 0-0.5 : Performance faible
 * - 0.5-1 : Performance correcte
 * - > 1 : Bonne performance ajustée au risque
 */
export function returnToVolRatio(
  returnPeriod: number | null,
  volatility: number | null,
  days: number = 30
): number | null {
  if (returnPeriod == null || volatility == null || volatility === 0) return null;

  // Annualiser pour comparabilité
  const annualizedReturn = returnPeriod * (DAYS_PER_YEAR / days);
  const annualizedVol = volatility * Math.sqrt(DAYS_PER_YEAR);

  return annualizedReturn / annualizedVol;
}

/**
 * Ratio Rendement / Volatilité négative
 *
 * Plus pertinent car ne pénalise pas les hausses volatiles
 */
export function returnToDownsideRatio(
  returnPeriod: number | null,
  downsideDev: number | null,
  days: number = 30
): number | null {
  if (returnPeriod == null || downsideDev == null || downsideDev === 0) return null;

  const annualizedReturn = returnPeriod * (DAYS_PER_YEAR / days);
  const annualizedDownside = downsideDev * Math.sqrt(DAYS_PER_YEAR);

  return annualizedReturn / annualizedDownside;
}

/**
 * Ratio Rendement / Max Drawdown
 *
 * Mesure la capacité à générer des gains par rapport aux pertes subies
 */
export function returnToDrawdownRatio(
  returnPeriod: number | null,
  maxDrawdown: number | null,
  days: number = 30
): number | null {
  if (returnPeriod == null || maxDrawdown == null || maxDrawdown === 0) return null;

  const annualizedReturn = returnPeriod * (DAYS_PER_YEAR / days);
  return annualizedReturn / maxDrawdown;
}

export function computeRiskAdjustedMetrics(
  series: WindowedSeries,
  returnPeriod: number | null,
  volatility: number | null,
  maxDD: number | null,
  days: number = 30
): RiskAdjustedMetrics {
  const downDev = downsideDeviation(series);
  const volAnn = annualizeVolatility(volatility);

  return {
    returnToVolRatio: returnToVolRatio(returnPeriod, volatility, days),
    returnToDownsideRatio: returnToDownsideRatio(returnPeriod, downDev, days),
    returnToDrawdownRatio: returnToDrawdownRatio(returnPeriod, maxDD, days),
    volatilityAnnualized: volAnn,
    downsideDeviation: downDev,
  };
}

// ============================================================================
// INDICATEURS DE MOMENTUM (ADAPTÉS AU SCELLÉ)
// ============================================================================

export type MomentumIndicators = {
  /** RSI adapté (période variable selon données disponibles) */
  rsi: number | null;
  /** Signal RSI */
  rsiSignal: "oversold" | "neutral" | "overbought" | null;
  /** Nombre de points utilisés pour le RSI */
  rsiDataPoints: number;
  /** Variation sur 7 jours en % */
  momentum7d: number | null;
  /** Variation sur 30 jours en % */
  momentum30d: number | null;
  /** Force de la tendance (amplitude des mouvements récents) */
  trendStrength: number | null;
};

/**
 * RSI adapté au marché scellé Pokémon
 *
 * Modifications par rapport au RSI standard:
 * - Période dynamique selon les données disponibles (min 5 points)
 * - Utilise TOUS les points disponibles (pas juste les derniers N jours)
 * - Seuils adaptés au marché moins liquide
 *
 * Interprétation (seuils adaptés):
 * - RSI < 35 : Survendu (opportunité potentielle)
 * - RSI 35-65 : Zone neutre
 * - RSI > 65 : Suracheté (prudence)
 */
export function rsiAdapted(series: WindowedSeries): { value: number | null; dataPoints: number } {
  const pts = series.points;

  if (pts.length < MIN_POINTS_FOR_RSI) {
    return { value: null, dataPoints: pts.length };
  }

  let gains = 0;
  let losses = 0;

  // Calculer les gains et pertes sur TOUS les points disponibles
  for (let i = 1; i < pts.length; i++) {
    const change = pts[i].price - pts[i - 1].price;
    if (change > 0) {
      gains += change;
    } else if (change < 0) {
      losses += Math.abs(change);
    }
  }

  const periods = pts.length - 1;
  const avgGain = gains / periods;
  const avgLoss = losses / periods;

  if (avgLoss === 0 && avgGain === 0) return { value: 50, dataPoints: pts.length };
  if (avgLoss === 0) return { value: 100, dataPoints: pts.length };
  if (avgGain === 0) return { value: 0, dataPoints: pts.length };

  const rs = avgGain / avgLoss;
  const rsiValue = 100 - (100 / (1 + rs));

  return { value: rsiValue, dataPoints: pts.length };
}

/**
 * Signal RSI avec seuils adaptés au marché scellé
 * (marché moins liquide = seuils moins extrêmes)
 */
export function rsiSignal(rsiValue: number | null): "oversold" | "neutral" | "overbought" | null {
  if (rsiValue == null) return null;
  if (rsiValue < 35) return "oversold";
  if (rsiValue > 65) return "overbought";
  return "neutral";
}

/**
 * Momentum simple: variation en % sur une période
 */
export function momentum(series: WindowedSeries, days: number): number | null {
  const pts = series.points;
  if (!series.last || pts.length < 2) return null;

  const targetT = series.last.t - days;

  // Trouver le point le plus proche de la date cible
  let anchor = null;
  for (let i = pts.length - 1; i >= 0; i--) {
    if (pts[i].t <= targetT) {
      anchor = pts[i];
      break;
    }
  }

  if (!anchor || anchor.price <= 0) return null;
  return ((series.last.price - anchor.price) / anchor.price) * 100;
}

/**
 * Force de la tendance
 *
 * Mesure l'amplitude moyenne des mouvements récents
 * Plus la valeur est élevée, plus les mouvements sont significatifs
 */
export function trendStrength(series: WindowedSeries): number | null {
  const pts = series.points;
  if (pts.length < 3) return null;

  // Calculer la moyenne des variations absolues en %
  let totalChange = 0;
  for (let i = 1; i < pts.length; i++) {
    const change = Math.abs((pts[i].price - pts[i - 1].price) / pts[i - 1].price);
    totalChange += change;
  }

  return (totalChange / (pts.length - 1)) * 100;
}

export function computeMomentumIndicators(series: WindowedSeries): MomentumIndicators {
  const rsiResult = rsiAdapted(series);

  return {
    rsi: rsiResult.value,
    rsiSignal: rsiSignal(rsiResult.value),
    rsiDataPoints: rsiResult.dataPoints,
    momentum7d: momentum(series, 7),
    momentum30d: momentum(series, 30),
    trendStrength: trendStrength(series),
  };
}

// ============================================================================
// INDICATEURS DE RISQUE (SIMPLIFIÉS)
// ============================================================================

export type SimpleRiskMetrics = {
  /** Asymétrie des rendements */
  skewness: number | null;
  /** Pire variation quotidienne observée */
  worstDailyChange: number | null;
  /** Meilleure variation quotidienne observée */
  bestDailyChange: number | null;
  /** Amplitude (écart entre min et max sur la période) */
  priceRange: number | null;
  /** Position actuelle dans la fourchette de prix (0-100) */
  pricePosition: number | null;
};

/**
 * Calcule des métriques de risque simples et compréhensibles
 *
 * On évite les concepts trop financiers (VaR, kurtosis) qui:
 * - Nécessitent beaucoup de données
 * - Sont difficiles à interpréter
 * - Ne sont pas vraiment pertinents pour les collectibles
 */
export function computeSimpleRiskMetrics(series: WindowedSeries): SimpleRiskMetrics {
  const pts = series.points;
  const returns = logReturns(series);

  let worstDailyChange: number | null = null;
  let bestDailyChange: number | null = null;

  if (returns.length > 0) {
    worstDailyChange = Math.min(...returns) * 100;
    bestDailyChange = Math.max(...returns) * 100;
  }

  let priceRange: number | null = null;
  let pricePosition: number | null = null;

  if (pts.length >= 2) {
    const prices = pts.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    priceRange = maxPrice > 0 ? ((maxPrice - minPrice) / minPrice) * 100 : null;

    // Position actuelle: 0 = au plus bas, 100 = au plus haut
    if (series.last && maxPrice > minPrice) {
      pricePosition = ((series.last.price - minPrice) / (maxPrice - minPrice)) * 100;
    }
  }

  return {
    skewness: skewness(returns),
    worstDailyChange,
    bestDailyChange,
    priceRange,
    pricePosition,
  };
}

// ============================================================================
// AGRÉGATION
// ============================================================================

export type AdvancedFinanceIndicators = {
  riskAdjusted: RiskAdjustedMetrics;
  momentum: MomentumIndicators;
  simpleRisk: SimpleRiskMetrics;
};

export function computeAllAdvancedIndicators(
  series: WindowedSeries,
  returnPeriod: number | null,
  volatility: number | null,
  maxDD: number | null,
  days: number = 30
): AdvancedFinanceIndicators {
  return {
    riskAdjusted: computeRiskAdjustedMetrics(series, returnPeriod, volatility, maxDD, days),
    momentum: computeMomentumIndicators(series),
    simpleRisk: computeSimpleRiskMetrics(series),
  };
}

// ============================================================================
// ANCIENNES FONCTIONS (POUR COMPATIBILITÉ)
// ============================================================================

// Alias pour compatibilité avec l'ancien code
export const sharpeRatio = returnToVolRatio;
export const sortinoRatio = returnToDownsideRatio;
export const calmarRatio = returnToDrawdownRatio;

// RSI avec l'ancienne signature (pour compatibilité)
export function rsi(series: WindowedSeries, _period: number = 14): number | null {
  return rsiAdapted(series).value;
}

// Anciennes métriques de risque (retournent null ou valeurs simplifiées)
export type AdvancedRiskMetrics = {
  var95: number | null;
  var99: number | null;
  cvar95: number | null;
  skewness: number | null;
  kurtosis: number | null;
  beta: number | null;
};

export function computeAdvancedRiskMetrics(
  series: WindowedSeries,
  _marketReturns?: number[]
): AdvancedRiskMetrics {
  const returns = logReturns(series);
  const simpleRisk = computeSimpleRiskMetrics(series);

  return {
    // On garde la skewness car elle est utile
    skewness: simpleRisk.skewness,
    // Les autres sont null car pas pertinents/pas assez de données
    var95: null,
    var99: null,
    cvar95: null,
    kurtosis: null,
    beta: null,
  };
}
