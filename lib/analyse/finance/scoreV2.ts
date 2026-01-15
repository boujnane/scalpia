/**
 * Score V2 - Système de scoring amélioré basé sur des percentiles dynamiques
 *
 * Problèmes du Score V1:
 * - Plages fixes arbitraires (vol 0-0.08, dd 0-0.5)
 * - Ne s'adapte pas aux conditions de marché
 * - Pénalise de manière linéaire alors que la relation n'est pas linéaire
 *
 * Améliorations V2:
 * - Utilise des percentiles calculés sur l'ensemble du marché
 * - Score relatif à la distribution réelle des données
 * - Pondérations ajustables et documentées
 * - Prise en compte du Sharpe/Sortino pour la performance ajustée au risque
 */

import { FinanceMetrics } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export type ScoreBreakdown = {
  total: number;                 // Score final 0-100

  // Composantes détaillées (chacune sur 100)
  performanceScore: number;      // Performance vs retail + tendance
  riskAdjustedScore: number;     // Sharpe/Sortino
  stabilityScore: number;        // Volatilité + Drawdown
  dataQualityScore: number;      // Coverage + fraîcheur

  // Grades pour communication utilisateur
  grade: "A" | "B" | "C" | "D" | "F";
  gradeLabel: string;
};

export type MarketDistribution = {
  // Distributions pour calculer les percentiles
  premiums: number[];
  slopes: number[];
  volatilities: number[];
  drawdowns: number[];
  sharpes: number[];
  sortinos: number[];
};

// ============================================================================
// UTILITAIRES
// ============================================================================

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x));
}

/**
 * Calcule le rang percentile d'une valeur dans une distribution (0-1)
 */
function percentileRank(value: number, distribution: number[]): number {
  if (distribution.length === 0) return 0.5;
  const below = distribution.filter(v => v < value).length;
  const equal = distribution.filter(v => v === value).length;
  return (below + 0.5 * equal) / distribution.length;
}

/**
 * Convertit un percentile en score (plus le percentile est haut, meilleur est le score)
 * Optionnel: inverser si une valeur basse est préférable (ex: volatilité)
 */
function percentileToScore(
  value: number | null,
  distribution: number[],
  invert: boolean = false
): number {
  if (value == null || distribution.length === 0) return 50; // Neutre si pas de données

  const rank = percentileRank(value, distribution);
  const score = invert ? (1 - rank) * 100 : rank * 100;
  return clamp(score, 0, 100);
}

// ============================================================================
// SCORING DÉTAILLÉ
// ============================================================================

/**
 * Score de performance (40% du total)
 *
 * Évalue:
 * - Premium vs retail (valorisation)
 * - Slope/tendance sur 30j
 * - Return 7j et 30j
 */
function computePerformanceScore(
  metrics: FinanceMetrics,
  distribution: MarketDistribution
): number {
  const { premiumNow, slope30d, return7d, return30d } = metrics;

  // Premium: position dans la distribution du marché
  // Un premium élevé = meilleure valorisation vs retail
  const premiumScore = percentileToScore(premiumNow, distribution.premiums);

  // Slope: tendance sur 30j (pente positive = hausse)
  const slopeScore = percentileToScore(slope30d, distribution.slopes);

  // Returns: performance court terme
  const return7dScore = return7d != null
    ? clamp((return7d + 0.1) / 0.2 * 100, 0, 100)  // -10% à +10% → 0-100
    : 50;

  const return30dScore = return30d != null
    ? clamp((return30d + 0.2) / 0.4 * 100, 0, 100) // -20% à +20% → 0-100
    : 50;

  // Pondération: premium et slope plus importants car plus stables
  return (
    0.35 * premiumScore +
    0.30 * slopeScore +
    0.15 * return7dScore +
    0.20 * return30dScore
  );
}

/**
 * Score de performance ajustée au risque (25% du total)
 *
 * Utilise le Sharpe et Sortino ratio pour évaluer
 * si les rendements compensent les risques pris.
 */
function computeRiskAdjustedScore(
  metrics: FinanceMetrics,
  distribution: MarketDistribution
): number {
  const { sharpeRatio, sortinoRatio, calmarRatio } = metrics;

  // Sharpe: rendement ajusté au risque total
  // Sharpe > 1 = bon, > 2 = excellent
  const sharpeScore = sharpeRatio != null
    ? clamp((sharpeRatio + 1) / 3 * 100, 0, 100) // -1 à 2 → 0-100
    : 50;

  // Sortino: rendement ajusté au risque négatif (plus pertinent)
  // Meilleur que Sharpe car ne pénalise pas la volatilité positive
  const sortinoScore = sortinoRatio != null
    ? clamp((sortinoRatio + 1) / 4 * 100, 0, 100) // -1 à 3 → 0-100
    : 50;

  // Calmar: rendement / max drawdown
  const calmarScore = calmarRatio != null
    ? clamp((calmarRatio + 2) / 6 * 100, 0, 100) // -2 à 4 → 0-100
    : 50;

  // Sortino plus important car plus pertinent pour les investisseurs
  return (
    0.30 * sharpeScore +
    0.45 * sortinoScore +
    0.25 * calmarScore
  );
}

/**
 * Score de stabilité (20% du total)
 *
 * Évalue le risque de perte:
 * - Volatilité (plus basse = mieux)
 * - Max Drawdown (plus bas = mieux)
 * - VaR et distribution des rendements
 */
function computeStabilityScore(
  metrics: FinanceMetrics,
  distribution: MarketDistribution
): number {
  const { vol30d, maxDrawdown90d, var95, skewness, kurtosis } = metrics;

  // Volatilité: inversé (faible = mieux)
  const volScore = percentileToScore(vol30d, distribution.volatilities, true);

  // Max Drawdown: inversé (faible = mieux)
  const ddScore = percentileToScore(maxDrawdown90d, distribution.drawdowns, true);

  // VaR 95%: perte maximale probable
  // VaR proche de 0 = peu de risque de perte
  const varScore = var95 != null
    ? clamp((var95 + 0.1) / 0.1 * 100, 0, 100) // -10% à 0% → 0-100
    : 50;

  // Skewness: asymétrie positive = plus de gains extrêmes (bonus)
  // Skewness négative = plus de pertes extrêmes (malus)
  const skewBonus = skewness != null
    ? clamp((skewness + 1) / 2 * 20, -10, 10) // -1 à 1 → -10 à +10 points
    : 0;

  // Kurtosis élevé = queues épaisses = plus de surprises (malus)
  const kurtPenalty = kurtosis != null && kurtosis > 0
    ? clamp(kurtosis * 5, 0, 15) // 0 à 3 → 0 à 15 points de pénalité
    : 0;

  const baseScore = 0.40 * volScore + 0.40 * ddScore + 0.20 * varScore;
  return clamp(baseScore + skewBonus - kurtPenalty, 0, 100);
}

/**
 * Score de qualité des données (15% du total)
 *
 * Pénalise les séries avec peu de données ou des données anciennes.
 * Important car les autres métriques sont moins fiables avec peu de données.
 */
function computeDataQualityScore(metrics: FinanceMetrics): number {
  const { coverage30d, freshnessDays } = metrics;

  // Coverage: proportion de jours avec données sur les 30 derniers jours
  // 100% = parfait, <60% = insuffisant
  const coverageScore = clamp(coverage30d * 100, 0, 100);

  // Fraîcheur: jours depuis la dernière donnée
  // 0 jour = parfait, >14 jours = données obsolètes
  const freshnessScore = freshnessDays != null
    ? clamp((14 - freshnessDays) / 14 * 100, 0, 100)
    : 50;

  // Coverage plus important que fraîcheur
  return 0.65 * coverageScore + 0.35 * freshnessScore;
}

// ============================================================================
// SCORE PRINCIPAL
// ============================================================================

/**
 * Calcule le score composite V2 avec breakdown détaillé
 */
export function scoreCompositeV2(
  metrics: FinanceMetrics,
  distribution: MarketDistribution
): ScoreBreakdown {
  // Calculer chaque composante
  const performanceScore = computePerformanceScore(metrics, distribution);
  const riskAdjustedScore = computeRiskAdjustedScore(metrics, distribution);
  const stabilityScore = computeStabilityScore(metrics, distribution);
  const dataQualityScore = computeDataQualityScore(metrics);

  // Score total pondéré
  // Performance: 40%, Risk-Adjusted: 25%, Stability: 20%, Data Quality: 15%
  const total = Math.round(
    0.40 * performanceScore +
    0.25 * riskAdjustedScore +
    0.20 * stabilityScore +
    0.15 * dataQualityScore
  );

  // Attribuer un grade
  let grade: "A" | "B" | "C" | "D" | "F";
  let gradeLabel: string;

  if (total >= 80) {
    grade = "A";
    gradeLabel = "Excellent";
  } else if (total >= 65) {
    grade = "B";
    gradeLabel = "Bon";
  } else if (total >= 50) {
    grade = "C";
    gradeLabel = "Moyen";
  } else if (total >= 35) {
    grade = "D";
    gradeLabel = "Faible";
  } else {
    grade = "F";
    gradeLabel = "Critique";
  }

  return {
    total,
    performanceScore: Math.round(performanceScore),
    riskAdjustedScore: Math.round(riskAdjustedScore),
    stabilityScore: Math.round(stabilityScore),
    dataQualityScore: Math.round(dataQualityScore),
    grade,
    gradeLabel,
  };
}

/**
 * Calcule le score simplifié (compatibilité avec V1)
 * Retourne juste le score total 0-100
 */
export function scoreSimplified(
  metrics: FinanceMetrics,
  distribution: MarketDistribution
): number | null {
  // Vérifier si on a assez de données
  if (metrics.premiumNow == null && metrics.slope30d == null) {
    return null;
  }

  return scoreCompositeV2(metrics, distribution).total;
}

/**
 * Crée une distribution vide (fallback)
 */
export function emptyDistribution(): MarketDistribution {
  return {
    premiums: [],
    slopes: [],
    volatilities: [],
    drawdowns: [],
    sharpes: [],
    sortinos: [],
  };
}

/**
 * Construit la distribution du marché à partir des métriques de toutes les séries
 */
export function buildMarketDistribution(
  allMetrics: FinanceMetrics[]
): MarketDistribution {
  return {
    premiums: allMetrics
      .map(m => m.premiumNow)
      .filter((x): x is number => x != null),
    slopes: allMetrics
      .map(m => m.slope30d)
      .filter((x): x is number => x != null),
    volatilities: allMetrics
      .map(m => m.vol30d)
      .filter((x): x is number => x != null),
    drawdowns: allMetrics
      .map(m => m.maxDrawdown90d)
      .filter((x): x is number => x != null),
    sharpes: allMetrics
      .map(m => m.sharpeRatio)
      .filter((x): x is number => x != null),
    sortinos: allMetrics
      .map(m => m.sortinoRatio)
      .filter((x): x is number => x != null),
  };
}
