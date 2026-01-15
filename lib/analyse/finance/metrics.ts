import { PricePoint, FinanceMetrics } from "./types";
import { normalizeDailySeries, sliceLastNDays, daysBetween, expectedDaysInWindow } from "./timeseries";
import { returnOverDays } from "./returns";
import { volatilityFromLogReturns, maxDrawdown } from "./risk";
import { slopeLogPricePerDay } from "./trend";
import { lastPrice, premiumVsRetail } from "./retail";
import { scoreComposite } from "./score";
import {
  computeRiskAdjustedMetrics,
  computeMomentumIndicators,
  computeAdvancedRiskMetrics,
} from "./indicators";

export function computeFinanceMetrics(input: {
  prices: PricePoint[];
  retailPrice?: number | null;
  marketReturns?: number[]; // Pour calculer le beta
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

  // Indicateurs avancés de performance ajustée au risque
  const riskAdjusted = computeRiskAdjustedMetrics(w30, return30d, vol30d, maxDrawdown90d, 30);

  // Indicateurs de momentum - utiliser la série COMPLÈTE pour avoir plus de données
  // Le RSI adapté fonctionne avec tous les points disponibles, pas juste 30 jours
  const momentum = computeMomentumIndicators(base);

  // Indicateurs de risque avancés
  const advancedRisk = computeAdvancedRiskMetrics(base, input.marketReturns);

  // Score V1 (pour compatibilité)
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

    // Indicateurs avancés (adaptés au marché scellé)
    sharpeRatio: riskAdjusted.returnToVolRatio,
    sortinoRatio: riskAdjusted.returnToDownsideRatio,
    calmarRatio: riskAdjusted.returnToDrawdownRatio,
    volAnnualized: riskAdjusted.volatilityAnnualized,
    downsideVol: riskAdjusted.downsideDeviation,

    // Momentum
    rsi14: momentum.rsi,
    rsiSignal: momentum.rsiSignal,

    // Risque avancé (simplifié)
    var95: advancedRisk.var95,
    cvar95: advancedRisk.cvar95,
    skewness: advancedRisk.skewness,
    kurtosis: advancedRisk.kurtosis,
    beta: advancedRisk.beta,
  };
}
