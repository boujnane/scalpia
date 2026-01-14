import type { SeriesFinanceSummary } from "./finance/series";
import type { LucideIcon } from "lucide-react";
import { Flame, Gem, Rocket, AlertTriangle, CheckCircle, Minus } from "lucide-react";

/**
 * Signaux visuels pour aider l'utilisateur à comprendre rapidement
 * l'état d'une série et les opportunités
 */

export type SignalType = "hot" | "opportunity" | "warning" | "stable" | "momentum" | "none";

export type Signal = {
  type: SignalType;
  label: string;
  description: string;
  icon: LucideIcon;
  color: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "gray";
  priority: number; // Plus le nombre est élevé, plus c'est prioritaire
};

export const SIGNAL_DEFINITIONS: Record<SignalType, Omit<Signal, "description">> = {
  hot: {
    type: "hot",
    label: "HOT",
    icon: Flame,
    color: "red",
    priority: 5,
  },
  opportunity: {
    type: "opportunity",
    label: "OPPORTUNITÉ",
    icon: Gem,
    color: "blue",
    priority: 4,
  },
  momentum: {
    type: "momentum",
    label: "TENDANCE",
    icon: Rocket,
    color: "purple",
    priority: 3,
  },
  warning: {
    type: "warning",
    label: "ATTENTION",
    icon: AlertTriangle,
    color: "orange",
    priority: 2,
  },
  stable: {
    type: "stable",
    label: "STABLE",
    icon: CheckCircle,
    color: "green",
    priority: 1,
  },
  none: {
    type: "none",
    label: "—",
    icon: Minus,
    color: "gray",
    priority: 0,
  },
};

/**
 * Détecte le signal principal pour une série donnée
 */
export function detectSeriesSignal(series: SeriesFinanceSummary, marketMedian?: number): Signal {
  const { metrics, trend7d, trend30d } = series;

  // HOT : Forte hausse récente + bon score
  if (
    metrics.return7d != null &&
    metrics.return7d > 0.05 &&
    metrics.score != null &&
    metrics.score >= 70
  ) {
    return {
      ...SIGNAL_DEFINITIONS.hot,
      description: `En forte hausse (+${(metrics.return7d * 100).toFixed(1)}% / 7j) avec un bon score (${metrics.score.toFixed(0)}/100)`,
    };
  }

  // OPPORTUNITÉ : Sous-évalué par rapport au marché ou surcote faible avec tendance positive
  if (
    metrics.premiumNow != null &&
    metrics.premiumNow < 0.15 &&
    trend30d === "up" &&
    metrics.score != null &&
    metrics.score >= 60
  ) {
    return {
      ...SIGNAL_DEFINITIONS.opportunity,
      description: `Surcote modérée (+${(metrics.premiumNow * 100).toFixed(1)}%) avec tendance haussière récente`,
    };
  }

  // Si on a une médiane de marché, vérifier si sous-évalué
  if (marketMedian != null && metrics.premiumNow != null && metrics.premiumNow < marketMedian - 0.1) {
    return {
      ...SIGNAL_DEFINITIONS.opportunity,
      description: `Prix en dessous de la moyenne du marché (opportunité d'achat potentielle)`,
    };
  }

  // MOMENTUM : Accélération positive sur 30j
  if (
    metrics.return30d != null &&
    metrics.return30d > 0.1 &&
    trend7d === "up" &&
    trend30d === "up"
  ) {
    return {
      ...SIGNAL_DEFINITIONS.momentum,
      description: `Momentum positif avec +${(metrics.return30d * 100).toFixed(1)}% sur 30 jours`,
    };
  }

  // ATTENTION : Baisse continue ou forte volatilité
  if (
    (metrics.return7d != null && metrics.return7d < -0.03 && trend30d === "down") ||
    (metrics.vol30d != null && metrics.vol30d > 0.15)
  ) {
    const reason =
      metrics.return7d != null && metrics.return7d < -0.03
        ? `Baisse continue (${(metrics.return7d * 100).toFixed(1)}% / 7j)`
        : `Forte volatilité (${(metrics.vol30d! * 100).toFixed(1)}%)`;

    return {
      ...SIGNAL_DEFINITIONS.warning,
      description: reason,
    };
  }

  // ✅ STABLE : Faible volatilité et bon score
  if (
    metrics.vol30d != null &&
    metrics.vol30d < 0.05 &&
    metrics.score != null &&
    metrics.score >= 65
  ) {
    return {
      ...SIGNAL_DEFINITIONS.stable,
      description: `Investissement stable avec faible volatilité (${(metrics.vol30d * 100).toFixed(1)}%)`,
    };
  }

  // Aucun signal particulier
  return {
    ...SIGNAL_DEFINITIONS.none,
    description: "Aucun signal particulier",
  };
}

/**
 * Détecte plusieurs signaux pour une série (tous ceux qui s'appliquent)
 */
export function detectAllSeriesSignals(
  series: SeriesFinanceSummary,
  marketMedian?: number
): Signal[] {
  const signals: Signal[] = [];
  const { metrics, trend7d, trend30d } = series;

  // HOT
  if (
    metrics.return7d != null &&
    metrics.return7d > 0.05 &&
    metrics.score != null &&
    metrics.score >= 70
  ) {
    signals.push({
      ...SIGNAL_DEFINITIONS.hot,
      description: `Forte hausse (+${(metrics.return7d * 100).toFixed(1)}% / 7j)`,
    });
  }

  // OPPORTUNITÉ
  if (
    metrics.premiumNow != null &&
    metrics.premiumNow < 0.15 &&
    trend30d === "up" &&
    metrics.score != null &&
    metrics.score >= 60
  ) {
    signals.push({
      ...SIGNAL_DEFINITIONS.opportunity,
      description: `Surcote modérée avec tendance haussière`,
    });
  }

  if (marketMedian != null && metrics.premiumNow != null && metrics.premiumNow < marketMedian - 0.1) {
    signals.push({
      ...SIGNAL_DEFINITIONS.opportunity,
      description: `Sous la moyenne du marché`,
    });
  }

  // MOMENTUM
  if (
    metrics.return30d != null &&
    metrics.return30d > 0.1 &&
    trend7d === "up" &&
    trend30d === "up"
  ) {
    signals.push({
      ...SIGNAL_DEFINITIONS.momentum,
      description: `Momentum positif (+${(metrics.return30d * 100).toFixed(1)}% / 30j)`,
    });
  }

  // WARNING
  if (metrics.return7d != null && metrics.return7d < -0.03 && trend30d === "down") {
    signals.push({
      ...SIGNAL_DEFINITIONS.warning,
      description: `Baisse continue`,
    });
  }

  if (metrics.vol30d != null && metrics.vol30d > 0.15) {
    signals.push({
      ...SIGNAL_DEFINITIONS.warning,
      description: `Forte volatilité`,
    });
  }

  // STABLE
  if (
    metrics.vol30d != null &&
    metrics.vol30d < 0.05 &&
    metrics.score != null &&
    metrics.score >= 65
  ) {
    signals.push({
      ...SIGNAL_DEFINITIONS.stable,
      description: `Investissement stable`,
    });
  }

  // Trier par priorité
  signals.sort((a, b) => b.priority - a.priority);

  return signals.length > 0 ? signals : [{ ...SIGNAL_DEFINITIONS.none, description: "—" }];
}

/**
 * Obtenir la couleur Tailwind CSS pour un signal
 */
export function getSignalColorClasses(color: Signal["color"]): {
  bg: string;
  text: string;
  border: string;
} {
  const colorMap: Record<Signal["color"], { bg: string; text: string; border: string }> = {
    red: {
      bg: "bg-red-500/10",
      text: "text-red-600 dark:text-red-400",
      border: "border-red-500/30",
    },
    orange: {
      bg: "bg-orange-500/10",
      text: "text-orange-600 dark:text-orange-400",
      border: "border-orange-500/30",
    },
    yellow: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-600 dark:text-yellow-400",
      border: "border-yellow-500/30",
    },
    green: {
      bg: "bg-green-500/10",
      text: "text-green-600 dark:text-green-400",
      border: "border-green-500/30",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/30",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/30",
    },
    gray: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
    },
  };

  return colorMap[color];
}
