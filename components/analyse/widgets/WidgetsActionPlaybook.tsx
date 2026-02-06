"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ChevronUp,
  Clipboard,
  Compass,
  Eye,
  Flame,
  Gamepad2,
  Radar,
  Shield,
  Sparkles,
  Square,
  Target,
  Timer,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface WidgetsActionPlaybookProps {
  series: SeriesFinanceSummary[];
  className?: string;
}

type AnalysisMode = "prudent" | "equilibre" | "exploration";
type StrategicHorizon = "court_terme" | "moyen_terme" | "long_terme_5_10_ans";
type AnalysisDirection = "momentum" | "resilience" | "valorisation" | "rotation";

type MissionId =
  | "regime"
  | "vigilance"
  | "direction"
  | "univers"
  | "ifthen"
  | "bonus";

interface SessionStats {
  xp: number;
  streak: number;
  lastValidatedDate: string | null;
  validatedSessions: number;
  horizonsSeen: StrategicHorizon[];
  directionsSeen: AnalysisDirection[];
  badges: string[];
}

interface SignalScore {
  oversoldStrong: number;
  overboughtStrong: number;
  breakoutUpStrong: number;
  breakoutDownStrong: number;
  momentumUpStrong: number;
  momentumDownStrong: number;
}

interface DirectionProfile {
  score: number;
  thesis: string;
  guardrail: string;
  focus: string;
  robust: SeriesFinanceSummary[];
  fragile: SeriesFinanceSummary[];
}

interface BadgeRule {
  id: string;
  label: string;
  description: string;
  unlocks: (stats: SessionStats) => boolean;
}

const SESSION_STORAGE_KEY = "pokeindex_playbook_session_v3";

const DEFAULT_SESSION_STATS: SessionStats = {
  xp: 0,
  streak: 0,
  lastValidatedDate: null,
  validatedSessions: 0,
  horizonsSeen: [],
  directionsSeen: [],
  badges: [],
};

const MODE_CONFIG: Record<
  AnalysisMode,
  { label: string; vigilanceShift: number; note: string }
> = {
  prudent: {
    label: "Prudent",
    vigilanceShift: -12,
    note: "Filtre les signaux faibles et privilégie la robustesse statistique.",
  },
  equilibre: {
    label: "Équilibré",
    vigilanceShift: 0,
    note: "Compromis entre réactivité opérationnelle et stabilité d'analyse.",
  },
  exploration: {
    label: "Exploration",
    vigilanceShift: 12,
    note: "Accélère la détection de changements de régime et d'anomalies.",
  },
};

const HORIZON_CONFIG: Record<
  StrategicHorizon,
  { label: string; note: string; vigilanceShift: number; cadenceHint: string }
> = {
  court_terme: {
    label: "Court terme",
    note: "Lecture orientée micro-variations et confirmation rapide des signaux.",
    vigilanceShift: 10,
    cadenceHint: "quotidienne",
  },
  moyen_terme: {
    label: "Moyen terme",
    note: "Lecture de continuité de tendance avec bruit modéré.",
    vigilanceShift: 0,
    cadenceHint: "2-3x par semaine",
  },
  long_terme_5_10_ans: {
    label: "Long terme (5-10 ans)",
    note: "Lecture structurelle: stabilité, drawdown et résilience (proxy historique court).",
    vigilanceShift: -12,
    cadenceHint: "hebdomadaire",
  },
};

const DIRECTION_CONFIG: Record<
  AnalysisDirection,
  { label: string; note: string; icon: typeof Compass }
> = {
  momentum: {
    label: "Momentum",
    note: "Suit les accélérations validées par rendement et Sharpe.",
    icon: Radar,
  },
  resilience: {
    label: "Résilience",
    note: "Priorise stabilité, faible drawdown et régularité.",
    icon: Shield,
  },
  valorisation: {
    label: "Valorisation",
    note: "Observe les écarts de premium et la cohérence de reprise.",
    icon: Target,
  },
  rotation: {
    label: "Rotation",
    note: "Détecte les bascules de leadership entre séries.",
    icon: Compass,
  },
};

const BADGE_RULES: BadgeRule[] = [
  {
    id: "streak_3",
    label: "Cadence 3",
    description: "Valider 3 sessions consécutives.",
    unlocks: (stats) => stats.streak >= 3,
  },
  {
    id: "horizons_master",
    label: "Maître Horizons",
    description: "Explorer les 3 horizons d'analyse.",
    unlocks: (stats) => stats.horizonsSeen.length >= 3,
  },
  {
    id: "directions_master",
    label: "Cartographe",
    description: "Explorer les 4 directions d'analyse.",
    unlocks: (stats) => stats.directionsSeen.length >= 4,
  },
  {
    id: "sessions_10",
    label: "Rituel 10",
    description: "Valider 10 sessions.",
    unlocks: (stats) => stats.validatedSessions >= 10,
  },
  {
    id: "xp_500",
    label: "Quant 500",
    description: "Atteindre 500 XP validés.",
    unlocks: (stats) => stats.xp >= 500,
  },
];

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isYesterday(lastDate: string | null, todayIso: string) {
  if (!lastDate) return false;
  const today = new Date(`${todayIso}T00:00:00Z`);
  const last = new Date(`${lastDate}T00:00:00Z`);
  const diffMs = today.getTime() - last.getTime();
  return diffMs === 24 * 60 * 60 * 1000;
}

function computeSignalScore(series: SeriesFinanceSummary[]): SignalScore {
  let oversoldStrong = 0;
  let overboughtStrong = 0;
  let breakoutUpStrong = 0;
  let breakoutDownStrong = 0;
  let momentumUpStrong = 0;
  let momentumDownStrong = 0;

  for (const s of series) {
    const { rsi14, rsiSignal, return7d, return30d, slope30d, vol30d, sharpeRatio } = s.metrics;

    if (rsiSignal === "oversold" && rsi14 != null && rsi14 < 25) oversoldStrong += 1;
    if (rsiSignal === "overbought" && rsi14 != null && rsi14 > 75) overboughtStrong += 1;
    if (return7d != null && return7d > 0.15 && slope30d != null && slope30d > 0.002) {
      breakoutUpStrong += 1;
    }
    if (return7d != null && return7d < -0.15 && slope30d != null && slope30d < -0.002) {
      breakoutDownStrong += 1;
    }
    if (
      sharpeRatio != null &&
      sharpeRatio > 1.5 &&
      return30d != null &&
      return30d > 0.05 &&
      vol30d != null &&
      vol30d < 0.06
    ) {
      momentumUpStrong += 1;
    }
    if (sharpeRatio != null && sharpeRatio < -1 && return30d != null && return30d < -0.05) {
      momentumDownStrong += 1;
    }
  }

  return {
    oversoldStrong,
    overboughtStrong,
    breakoutUpStrong,
    breakoutDownStrong,
    momentumUpStrong,
    momentumDownStrong,
  };
}

function unionEnumValues<T extends string>(base: T[], value: T): T[] {
  if (base.includes(value)) return base;
  return [...base, value];
}

function getLevelFromXp(xp: number): {
  label: string;
  color: string;
  nextMilestone: number;
} {
  if (xp < 120) return { label: "Observateur", color: "text-slate-400", nextMilestone: 120 };
  if (xp < 260) return { label: "Analyste", color: "text-emerald-500", nextMilestone: 260 };
  if (xp < 450) return { label: "Stratège", color: "text-blue-500", nextMilestone: 450 };
  return { label: "Architecte Quant", color: "text-primary", nextMilestone: xp + 150 };
}

function normalizeSessionStats(raw: unknown): SessionStats {
  if (!raw || typeof raw !== "object") return DEFAULT_SESSION_STATS;
  const data = raw as Partial<SessionStats>;

  const horizonsSeen = (data.horizonsSeen ?? []).filter((h): h is StrategicHorizon =>
    h === "court_terme" || h === "moyen_terme" || h === "long_terme_5_10_ans"
  );
  const directionsSeen = (data.directionsSeen ?? []).filter((d): d is AnalysisDirection =>
    d === "momentum" || d === "resilience" || d === "valorisation" || d === "rotation"
  );
  const badges = Array.isArray(data.badges)
    ? data.badges.filter((b): b is string => typeof b === "string")
    : [];

  return {
    xp: typeof data.xp === "number" ? data.xp : 0,
    streak: typeof data.streak === "number" ? data.streak : 0,
    lastValidatedDate:
      typeof data.lastValidatedDate === "string" || data.lastValidatedDate === null
        ? data.lastValidatedDate
        : null,
    validatedSessions: typeof data.validatedSessions === "number" ? data.validatedSessions : 0,
    horizonsSeen,
    directionsSeen,
    badges,
  };
}

function computeUnlockedBadges(stats: SessionStats): string[] {
  return BADGE_RULES.filter((rule) => rule.unlocks(stats)).map((rule) => rule.id);
}

function evaluateDirection(
  direction: AnalysisDirection,
  series: SeriesFinanceSummary[],
  marketMedianPremium: number
): DirectionProfile {
  let rawScore = 0;
  const robust: SeriesFinanceSummary[] = [];
  const fragile: SeriesFinanceSummary[] = [];

  for (const s of series) {
    const ret7 = s.metrics.return7d ?? 0;
    const ret30 = s.metrics.return30d ?? 0;
    const vol = s.metrics.vol30d ?? 0.08;
    const sharpe = s.metrics.sharpeRatio ?? 0;
    const drawdown = s.metrics.maxDrawdown90d ?? 0.2;
    const premium = s.metrics.premiumNow ?? marketMedianPremium;
    const slope = s.metrics.slope30d ?? 0;
    const rsiSignal = s.metrics.rsiSignal;

    if (direction === "momentum") {
      rawScore += ret7 * 260 + ret30 * 80 + sharpe * 12 - vol * 220;
      if (ret7 > 0.025 && sharpe > 0 && slope > 0) robust.push(s);
      if (ret7 < -0.03 && sharpe < 0) fragile.push(s);
      continue;
    }

    if (direction === "resilience") {
      rawScore += sharpe * 18 - vol * 260 - drawdown * 120 + ret30 * 40;
      if (vol < 0.05 && drawdown < 0.18 && sharpe > 0) robust.push(s);
      if (vol > 0.09 || drawdown > 0.3) fragile.push(s);
      continue;
    }

    if (direction === "valorisation") {
      rawScore += (marketMedianPremium - premium) * 180 + slope * 12000 + sharpe * 8 - drawdown * 40;
      if (premium < marketMedianPremium - 0.05 && slope >= 0 && drawdown < 0.25) robust.push(s);
      if (premium > marketMedianPremium + 0.15 && drawdown > 0.2) fragile.push(s);
      continue;
    }

    rawScore +=
      (rsiSignal === "oversold" ? 18 : 0) +
      (rsiSignal === "overbought" ? -14 : 0) +
      ret7 * -70 +
      ret30 * 20 -
      vol * 100;
    if (rsiSignal === "oversold" && vol < 0.08) robust.push(s);
    if (rsiSignal === "overbought" && vol > 0.07) fragile.push(s);
  }

  const score = clamp(50 + rawScore / Math.max(series.length, 1), 0, 100);

  if (direction === "momentum") {
    return {
      score,
      focus: "Rendements 7j/30j + Sharpe + pente",
      thesis: "Les séries qui accélèrent avec un couple rendement/risque propre dominent.",
      guardrail: "Invalidation si perte de pente et retour 7j négatif simultané.",
      robust,
      fragile,
    };
  }

  if (direction === "resilience") {
    return {
      score,
      focus: "Volatilité + drawdown + Sharpe",
      thesis: "La priorité est la tenue des prix pendant les phases de stress.",
      guardrail: "Invalidation si vol > 9% ou drawdown > 30% sur les séries suivies.",
      robust,
      fragile,
    };
  }

  if (direction === "valorisation") {
    return {
      score,
      focus: "Premium relatif + tendance de fond",
      thesis: "Les écarts de valorisation cohérents avec la tendance sont privilégiés.",
      guardrail: "Invalidation si premium se tend sans amélioration de pente.",
      robust,
      fragile,
    };
  }

  return {
    score,
    focus: "RSI extrêmes + asymétrie de flux",
    thesis: "Les bascules de leadership (rotation) sont au centre de la lecture.",
    guardrail: "Invalidation si les extrêmes RSI se normalisent sans relais de rendement.",
    robust,
    fragile,
  };
}

function getSimplifiedInsight(playbook: {
  regimeScore: number;
  regimeLabel: string;
  avgVol30d: number;
  avgReturn7d: number;
  avgReturn30d: number;
  tacticalScore: number;
  topDirection: AnalysisDirection;
  selectedDirection: DirectionProfile;
  vigilanceIndex: number;
  cadence: string;
}): {
  headline: string;
  tone: "positive" | "neutral" | "caution";
  insights: string[];
  watchlist: string[];
  warnings: string[];
} {
  const insights: string[] = [];
  const watchlist: string[] = [];
  const warnings: string[] = [];
  let tone: "positive" | "neutral" | "caution" = "neutral";
  let headline = "Le marché est dans une phase d'observation.";

  // Determine headline and tone based on regime
  if (playbook.regimeScore >= 70) {
    headline = "Le marché est dynamique, les prix montent.";
    tone = "positive";
    if (playbook.regimeScore >= 82) {
      headline = "Forte activité sur le marché, attention aux excès.";
      tone = "caution";
    }
  } else if (playbook.regimeScore < 35) {
    headline = "Le marché est sous pression, prudence recommandée.";
    tone = "caution";
  }

  // Add volatility insight
  if (playbook.avgVol30d < 0.04) {
    insights.push("Les prix sont très stables en ce moment.");
  } else if (playbook.avgVol30d > 0.08) {
    insights.push("Les prix bougent beaucoup, le marché est nerveux.");
    warnings.push("Volatilité élevée : évitez les décisions impulsives.");
  } else {
    insights.push("La volatilité est normale, pas de stress particulier.");
  }

  // Add return insight
  if (playbook.avgReturn30d > 0.05) {
    insights.push(`En moyenne +${(playbook.avgReturn30d * 100).toFixed(1)}% sur 30 jours.`);
  } else if (playbook.avgReturn30d < -0.05) {
    insights.push(`En moyenne ${(playbook.avgReturn30d * 100).toFixed(1)}% sur 30 jours.`);
    warnings.push("Tendance baissière : bon moment pour observer, pas pour se précipiter.");
  }

  // Add tactical insight
  if (playbook.tacticalScore >= 65) {
    insights.push("Les signaux techniques sont plutôt favorables.");
  } else if (playbook.tacticalScore < 40) {
    warnings.push("Les signaux techniques invitent à la prudence.");
  }

  // Add watchlist from robust series
  playbook.selectedDirection.robust.slice(0, 3).forEach((s) => {
    watchlist.push(s.seriesName);
  });

  // Add fragile series warnings
  if (playbook.selectedDirection.fragile.length > 0) {
    const fragileNames = playbook.selectedDirection.fragile.slice(0, 2).map((s) => s.seriesName);
    if (fragileNames.length > 0) {
      warnings.push(`Séries fragiles à surveiller : ${fragileNames.join(", ")}.`);
    }
  }

  return { headline, tone, insights, watchlist, warnings };
}

export function WidgetsActionPlaybook({ series, className }: WidgetsActionPlaybookProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>("equilibre");
  const [horizon, setHorizon] = useState<StrategicHorizon>("moyen_terme");
  const [direction, setDirection] = useState<AnalysisDirection>("resilience");
  const [checked, setChecked] = useState<Record<MissionId, boolean>>({
    regime: false,
    vigilance: false,
    direction: false,
    univers: false,
    ifthen: false,
    bonus: false,
  });
  const [sessionStats, setSessionStats] = useState<SessionStats>(() => {
    if (typeof window === "undefined") return DEFAULT_SESSION_STATS;
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return DEFAULT_SESSION_STATS;
      return normalizeSessionStats(JSON.parse(raw));
    } catch {
      return DEFAULT_SESSION_STATS;
    }
  });
  const [sessionFeedback, setSessionFeedback] = useState<string | null>(null);
  const [copiedPlan, setCopiedPlan] = useState(false);
  const validationGuardRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionStats));
    } catch {
      // ignore write errors
    }
  }, [sessionStats]);

  const playbook = useMemo(() => {
    if (series.length === 0) return null;

    const upCount = series.filter((s) => s.trend7d === "up").length;
    const downCount = series.filter((s) => s.trend7d === "down").length;
    const upRatio = upCount / series.length;
    const downRatio = downCount / series.length;

    const returns7d = series
      .map((s) => s.metrics.return7d)
      .filter((x): x is number => x != null);
    const returns30d = series
      .map((s) => s.metrics.return30d)
      .filter((x): x is number => x != null);
    const vols30d = series
      .map((s) => s.metrics.vol30d)
      .filter((x): x is number => x != null);
    const sharpes = series
      .map((s) => s.metrics.sharpeRatio)
      .filter((x): x is number => x != null);
    const vars95 = series
      .map((s) => s.metrics.var95)
      .filter((x): x is number => x != null);
    const drawdowns = series
      .map((s) => s.metrics.maxDrawdown90d)
      .filter((x): x is number => x != null);
    const slopes30d = series
      .map((s) => s.metrics.slope30d)
      .filter((x): x is number => x != null);
    const premiums = series
      .map((s) => s.metrics.premiumNow)
      .filter((x): x is number => x != null);
    const scores = series
      .map((s) => s.metrics.score)
      .filter((x): x is number => x != null);
    const longTermRef5y = series
      .map((s) => s.longTermRefReturn5y)
      .filter((x): x is number => x != null);
    const longTermRef10y = series
      .map((s) => s.longTermRefReturn10y)
      .filter((x): x is number => x != null);
    const longTermAnnual = series
      .map((s) => s.longTermAnnualLinear)
      .filter((x): x is number => x != null);
    const aboveRetailRatios = series
      .map((s) => s.aboveRetailRatio)
      .filter((x): x is number => x != null);
    const itemAgesYears = series
      .map((s) => s.medianItemAgeYears)
      .filter((x): x is number => x != null);
    const hypeAdjustedRatios = series
      .map((s) => s.hypeAdjustedRatio)
      .filter((x): x is number => x != null);

    const freshSeries = series.filter(
      (s) => s.metrics.freshnessDays != null && s.metrics.freshnessDays <= 7
    ).length;
    const dataFreshness = (freshSeries / series.length) * 100;

    const avgReturn7d = average(returns7d) ?? 0;
    const avgReturn30d = average(returns30d) ?? 0;
    const avgVol30d = average(vols30d) ?? 0.07;
    const avgSharpe = average(sharpes) ?? 0;
    const avgVaR95 = average(vars95) ?? 0;
    const avgDrawdown = average(drawdowns) ?? 0;
    const avgSlope30d = average(slopes30d) ?? 0;
    const avgScore = average(scores) ?? 50;
    const avgLongTermRef5y = average(longTermRef5y) ?? 0;
    const avgLongTermRef10y = average(longTermRef10y) ?? 0;
    const avgLongTermAnnual = average(longTermAnnual) ?? 0;
    const avgItemAgeYears = average(itemAgesYears) ?? 0;
    const avgHypeAdjustedRatio = average(hypeAdjustedRatios) ?? 1;
    const longTermProxyCoverage = series.length > 0 ? longTermAnnual.length / series.length : 0;
    const marketMedianPremium = median(premiums) ?? 0.3;
    const medianVol30d = median(vols30d) ?? avgVol30d;
    const premiumPositiveRatio =
      aboveRetailRatios.length > 0
        ? average(aboveRetailRatios) ?? 0.5
        : premiums.length > 0
          ? premiums.filter((p) => p > 0).length / premiums.length
          : 0.5;
    const medianPremiumNow = median(premiums) ?? 0;
    const premiumStrength = clamp((medianPremiumNow / 0.6) * 100, 0, 100);

    const longTermStructuralScore = clamp(
      30 +
        premiumPositiveRatio * 35 +
        premiumStrength * 0.25 +
        (avgScore - 50) * 0.2 +
        avgLongTermRef5y * 12 +
        avgLongTermRef10y * 6 +
        avgLongTermAnnual * 20 +
        avgSlope30d * 6000 +
        avgSharpe * 6 -
        avgDrawdown * 60 -
        (1 - avgHypeAdjustedRatio) * 25,
      0,
      100
    );

    const horizonScore =
      horizon === "court_terme"
        ? clamp(50 + avgReturn7d * 220 - avgVol30d * 180 + (dataFreshness - 60) * 0.6, 0, 100)
        : horizon === "moyen_terme"
          ? clamp(50 + avgReturn30d * 180 + avgSharpe * 10 - avgVol30d * 140, 0, 100)
          : longTermStructuralScore;

    const directionProfiles: Record<AnalysisDirection, DirectionProfile> = {
      momentum: evaluateDirection("momentum", series, marketMedianPremium),
      resilience: evaluateDirection("resilience", series, marketMedianPremium),
      valorisation: evaluateDirection("valorisation", series, marketMedianPremium),
      rotation: evaluateDirection("rotation", series, marketMedianPremium),
    };

    const selectedDirection = directionProfiles[direction];

    const baseRegime = clamp(
      50 +
        (upRatio - downRatio) * 38 +
        avgReturn30d * 130 +
        avgSharpe * 10 -
        avgVol30d * 150,
      0,
      100
    );

    const longTermRegimeBoost =
      horizon === "long_terme_5_10_ans"
        ? (premiumPositiveRatio - 0.5) * 16 + (premiumStrength - 50) * 0.12
        : 0;

    const regimeScore = clamp(
      baseRegime + (horizonScore - 50) * 0.25 + longTermRegimeBoost,
      0,
      100
    );

    let regimeLabel = "Neutre";
    let regimeTone = "text-slate-500";
    let regimeLecture = "L'équilibre entre pression haussière et baissière reste serré.";
    let regimeSwitchCondition =
      "Reclasser si score < 45 ou si les séries en baisse dépassent 45%.";

    if (regimeScore < 35) {
      regimeLabel = "Défensif";
      regimeTone = "text-red-500";
      regimeLecture = "Le régime est stressé: priorité à la robustesse des métriques.";
      regimeSwitchCondition =
        "Sortie du mode défensif si score > 45 avec amélioration durable des retours 30j.";
    } else if (regimeScore >= 70) {
      regimeLabel = regimeScore >= 82 ? "Surchauffe" : "Constructif";
      regimeTone = regimeScore >= 82 ? "text-green-500" : "text-emerald-500";
      regimeLecture =
        regimeScore >= 82
          ? "Momentum élevé mais risque de rotation rapide."
          : "Contexte favorable pour confirmer les hypothèses de continuité.";
      regimeSwitchCondition = "Revoir le classement si retour moyen 30j repasse sous 0%.";
    }

    let vigilanceBase = 55;
    if (medianVol30d > 0.09 || avgVaR95 > 0.08 || avgDrawdown > 0.25) vigilanceBase = 78;
    else if (medianVol30d < 0.05 && avgVaR95 < 0.05 && avgDrawdown < 0.15) vigilanceBase = 38;

    const horizonShift = HORIZON_CONFIG[horizon].vigilanceShift;
    const modeShift = MODE_CONFIG[mode].vigilanceShift;
    const vigilanceIndex = clamp(vigilanceBase + horizonShift + modeShift, 20, 90);

    let cadence = "Hebdomadaire";
    if (vigilanceIndex >= 78) cadence = "Quotidienne";
    else if (vigilanceIndex >= 62) cadence = "3-4x par semaine";
    else if (vigilanceIndex >= 45) cadence = "2x par semaine";

    const signalScore = computeSignalScore(series);
    const tacticalScore = clamp(
      50 +
        (signalScore.breakoutUpStrong + signalScore.momentumUpStrong + signalScore.oversoldStrong) * 6 -
        (signalScore.breakoutDownStrong + signalScore.momentumDownStrong + signalScore.overboughtStrong) * 6,
      0,
      100
    );

    const sortedDirections = (
      Object.entries(directionProfiles) as Array<[AnalysisDirection, DirectionProfile]>
    ).sort((a, b) => b[1].score - a[1].score);

    const topDirection = sortedDirections[0]?.[0] ?? direction;
    const topDirectionScore = sortedDirections[0]?.[1].score ?? selectedDirection.score;

    const ifThenPlan = `SI score régime < 45 OU vigilance > ${Math.max(
      vigilanceIndex - 5,
      40
    )}, ALORS reclassifier robuste/fragile en mode ${DIRECTION_CONFIG[direction].label.toLowerCase()} (${HORIZON_CONFIG[horizon].label.toLowerCase()}).`;

    return {
      avgReturn7d,
      avgReturn30d,
      avgVol30d,
      avgSharpe,
      avgVaR95,
      avgDrawdown,
      avgSlope30d,
      marketMedianPremium,
      premiumPositiveRatio,
      medianPremiumNow,
      avgLongTermRef5y,
      avgLongTermRef10y,
      avgLongTermAnnual,
      avgItemAgeYears,
      avgHypeAdjustedRatio,
      longTermProxyCoverage,
      dataFreshness,
      horizonScore,
      regimeScore,
      regimeLabel,
      regimeTone,
      regimeLecture,
      regimeSwitchCondition,
      vigilanceIndex,
      cadence,
      signalScore,
      tacticalScore,
      directionProfiles,
      selectedDirection,
      topDirection,
      topDirectionScore,
      ifThenPlan,
    };
  }, [series, horizon, direction, mode]);

  if (!playbook) return null;

  const missions = [
    {
      id: "regime",
      title: "Qualifier le régime",
      detail: `Tag de session: ${playbook.regimeLabel}.`,
      points: 25,
      done: checked.regime,
      auto: false,
    },
    {
      id: "vigilance",
      title: "Fixer la cadence",
      detail: `Cadence actuelle: ${playbook.cadence.toLowerCase()}.`,
      points: 20,
      done: checked.vigilance,
      auto: false,
    },
    {
      id: "direction",
      title: "Valider la direction",
      detail: `Direction active: ${DIRECTION_CONFIG[direction].label}.`,
      points: 20,
      done: checked.direction,
      auto: false,
    },
    {
      id: "univers",
      title: "Cartographier l'univers",
      detail: "Identifier 2 robustes + 1 fragile.",
      points: 35,
      done: checked.univers,
      auto: false,
    },
    {
      id: "ifthen",
      title: "Formaliser le SI-ALORS",
      detail: "Écrire la règle de reclassification.",
      points: 30,
      done: checked.ifthen,
      auto: false,
    },
    {
      id: "bonus",
      title: "Défi bonus",
      detail:
        horizon === "long_terme_5_10_ans"
          ? "Comparer résilience vs valorisation."
          : "Comparer momentum vs rotation.",
      points: 25,
      done: checked.bonus,
      auto: false,
    },
    {
      id: "quality",
      title: "Qualité des données",
      detail: `${playbook.dataFreshness.toFixed(0)}% des séries sont fraîches (<= 7j).`,
      points: 20,
      done: playbook.dataFreshness >= 60,
      auto: true,
    },
  ] as const;

  const completedMissions = missions.filter((m) => m.done).length;
  const completionPct = Math.round((completedMissions / missions.length) * 100);
  const sessionPotentialXp = missions.reduce((sum, m) => sum + (m.done ? m.points : 0), 0);

  const committedXp = sessionStats.xp;
  const level = getLevelFromXp(committedXp);
  const levelProgress = Math.min(
    100,
    Math.round((committedXp / level.nextMilestone) * 100)
  );

  const unlockedBadgeCount = BADGE_RULES.filter((rule) => rule.unlocks(sessionStats)).length;
  const ActiveDirectionIcon = DIRECTION_CONFIG[direction].icon;

  const toggleMission = (id: MissionId) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const validateSession = () => {
    const today = getTodayIsoDate();

    if (completionPct < 60) {
      setSessionFeedback("Complétez au moins 60% des missions pour valider la session.");
      return;
    }

    if (validationGuardRef.current === today || sessionStats.lastValidatedDate === today) {
      setSessionFeedback("Session déjà validée aujourd'hui.");
      validationGuardRef.current = today;
      return;
    }

    const newHorizonExplored = !sessionStats.horizonsSeen.includes(horizon);
    const newDirectionExplored = !sessionStats.directionsSeen.includes(direction);
    const fullCompletionBonus = completionPct === 100 ? 25 : 0;
    const explorationBonus = (newHorizonExplored ? 10 : 0) + (newDirectionExplored ? 10 : 0);
    const xpGain = sessionPotentialXp + fullCompletionBonus + explorationBonus;

    const nextStatsBase: SessionStats = {
      xp: sessionStats.xp + xpGain,
      streak: isYesterday(sessionStats.lastValidatedDate, today) ? sessionStats.streak + 1 : 1,
      lastValidatedDate: today,
      validatedSessions: sessionStats.validatedSessions + 1,
      horizonsSeen: unionEnumValues(sessionStats.horizonsSeen, horizon),
      directionsSeen: unionEnumValues(sessionStats.directionsSeen, direction),
      badges: sessionStats.badges,
    };

    const nextStats: SessionStats = {
      ...nextStatsBase,
      badges: computeUnlockedBadges(nextStatsBase),
    };

    setSessionStats(nextStats);
    validationGuardRef.current = today;
    setChecked({
      regime: false,
      vigilance: false,
      direction: false,
      univers: false,
      ifthen: false,
      bonus: false,
    });
    setSessionFeedback(
      `Session validée: +${xpGain} XP (${sessionPotentialXp} base, ${fullCompletionBonus} bonus, ${explorationBonus} exploration).`
    );
  };

  const copyIfThenPlan = async () => {
    try {
      await navigator.clipboard.writeText(playbook.ifThenPlan);
      setCopiedPlan(true);
      setTimeout(() => setCopiedPlan(false), 1500);
    } catch {
      setCopiedPlan(false);
    }
  };

  const simplifiedInsight = getSimplifiedInsight(playbook);

  return (
    <Card
      className={cn(
        "border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background",
        className
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            {isExpanded ? "Playbook Quantitatif" : "Analyse du marché"}
            <Badge variant="secondary" className="text-[10px]">
              Outil d&apos;analyse
            </Badge>
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-xs font-medium hover:border-primary/40 transition-colors"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                Simplifier
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                Mode expert
              </>
            )}
          </button>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Vue simplifiée - toujours visible */}
        <div
          className={cn(
            "p-4 rounded-lg border",
            simplifiedInsight.tone === "positive" && "border-emerald-500/30 bg-emerald-500/5",
            simplifiedInsight.tone === "neutral" && "border-border bg-background/70",
            simplifiedInsight.tone === "caution" && "border-amber-500/30 bg-amber-500/5"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                simplifiedInsight.tone === "positive" && "bg-emerald-500/20",
                simplifiedInsight.tone === "neutral" && "bg-muted",
                simplifiedInsight.tone === "caution" && "bg-amber-500/20"
              )}
            >
              {simplifiedInsight.tone === "positive" && (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              )}
              {simplifiedInsight.tone === "neutral" && (
                <Compass className="w-5 h-5 text-muted-foreground" />
              )}
              {simplifiedInsight.tone === "caution" && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
            </div>
            <div className="space-y-2 flex-1">
              <p className="text-sm font-semibold text-foreground">{simplifiedInsight.headline}</p>
              <div className="space-y-1">
                {simplifiedInsight.insights.map((insight, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {insight}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {simplifiedInsight.watchlist.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-foreground mb-1.5">
                <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                Séries à surveiller
              </p>
              <div className="flex flex-wrap gap-1.5">
                {simplifiedInsight.watchlist.map((name) => (
                  <Badge key={name} variant="secondary" className="text-[11px]">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {simplifiedInsight.warnings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1.5" />
                Points d&apos;attention
              </p>
              <div className="space-y-1">
                {simplifiedInsight.warnings.map((warning, i) => (
                  <p key={i} className="text-[11px] text-muted-foreground">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/30">
            Cadence suggérée : {playbook.cadence.toLowerCase()}. Ces observations ne constituent pas un conseil d&apos;investissement.
          </p>
        </div>

        {/* Vue détaillée - seulement si expanded */}
        {isExpanded && (
          <>
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">Cadre légal et usage</p>
                  <p className="text-[11px] text-muted-foreground">
                    Ce module fournit une lecture quantitative. Il ne constitue ni un conseil en
                    investissement, ni une recommandation personnalisée.
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    La gamification valorise la discipline d&apos;analyse (mission, validation, cohérence),
                    jamais la prise de risque.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-background/70">
            <div className="flex items-center gap-2 mb-2">
              <Gamepad2 className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mode d&apos;analyse
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(MODE_CONFIG) as AnalysisMode[]).map((candidateMode) => (
                <button
                  key={candidateMode}
                  type="button"
                  onClick={() => setMode(candidateMode)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    mode === candidateMode
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  {MODE_CONFIG[candidateMode].label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">{MODE_CONFIG[mode].note}</p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-background/70">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Horizon stratégique
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(HORIZON_CONFIG) as StrategicHorizon[]).map((candidateHorizon) => (
                <button
                  key={candidateHorizon}
                  type="button"
                  onClick={() => setHorizon(candidateHorizon)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    horizon === candidateHorizon
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  {HORIZON_CONFIG[candidateHorizon].label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {HORIZON_CONFIG[horizon].note}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-background/70">
            <div className="flex items-center gap-2 mb-2">
              <Radar className="w-3.5 h-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Direction d&apos;analyse
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(DIRECTION_CONFIG) as AnalysisDirection[]).map((candidateDirection) => (
                <button
                  key={candidateDirection}
                  type="button"
                  onClick={() => setDirection(candidateDirection)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors",
                    direction === candidateDirection
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:border-primary/40"
                  )}
                >
                  {DIRECTION_CONFIG[candidateDirection].label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {DIRECTION_CONFIG[direction].note}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-background/70">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Progression analyste
              </p>
              <Badge variant="secondary" className="text-[10px]">
                {completedMissions}/{missions.length}
              </Badge>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <p className={cn("text-sm font-semibold", level.color)}>{level.label}</p>
              <p className="text-xs text-muted-foreground">{committedXp} XP</p>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Flame className="w-3 h-3 text-orange-500" />
                Streak: {sessionStats.streak}
              </span>
              <span>+{sessionPotentialXp} XP potentiels</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.entries(playbook.directionProfiles) as Array<
            [AnalysisDirection, DirectionProfile]
          >).map(([key, profile]) => {
            const isSelected = key === direction;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDirection(key)}
                className={cn(
                  "p-2 rounded-md border text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/40"
                )}
              >
                <p className="text-xs font-medium">{DIRECTION_CONFIG[key].label}</p>
                <p className="text-xs text-muted-foreground">Score {profile.score.toFixed(0)}/100</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                1. Régime
              </p>
              <Compass className={cn("w-3.5 h-3.5", playbook.regimeTone)} />
            </div>
            <p className={cn("text-sm font-semibold", playbook.regimeTone)}>
              {playbook.regimeLabel} ({playbook.regimeScore.toFixed(0)}/100)
            </p>
            <p className="text-xs text-muted-foreground">{playbook.regimeLecture}</p>
            <p className="text-[11px] text-muted-foreground">
              Bascule: {playbook.regimeSwitchCondition}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                2. Vigilance
              </p>
              <Shield className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              Indice {playbook.vigilanceIndex}/100
            </p>
            <p className="text-xs text-muted-foreground">
              Cadence: {playbook.cadence.toLowerCase()} ({HORIZON_CONFIG[horizon].cadenceHint}).
            </p>
            <p className="text-[11px] text-muted-foreground">
              Vol {(playbook.avgVol30d * 100).toFixed(1)}%, VaR95 {(playbook.avgVaR95 * 100).toFixed(1)}%, Drawdown{" "}
              {(playbook.avgDrawdown * 100).toFixed(1)}%.
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                3. Direction active
              </p>
              <ActiveDirectionIcon className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {DIRECTION_CONFIG[direction].label} ({playbook.selectedDirection.score.toFixed(0)}/100)
            </p>
            <p className="text-xs text-muted-foreground">{playbook.selectedDirection.thesis}</p>
            <p className="text-[11px] text-muted-foreground">
              Focus: {playbook.selectedDirection.focus}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                4. Horizon
              </p>
              <Timer className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {HORIZON_CONFIG[horizon].label} ({playbook.horizonScore.toFixed(0)}/100)
            </p>
            <p className="text-xs text-muted-foreground">
              {horizon === "court_terme" && (
                <>
                  Réf retours: {playbook.avgReturn7d * 100 >= 0 ? "+" : ""}
                  {(playbook.avgReturn7d * 100).toFixed(1)}% (7j)
                </>
              )}
              {horizon === "moyen_terme" && (
                <>
                  Réf retours: {playbook.avgReturn30d * 100 >= 0 ? "+" : ""}
                  {(playbook.avgReturn30d * 100).toFixed(1)}% (30j)
                </>
              )}
              {horizon === "long_terme_5_10_ans" && (
                <>
                  Réf 5-10 ans (proxy): {playbook.avgLongTermRef5y * 100 >= 0 ? "+" : ""}
                  {(playbook.avgLongTermRef5y * 100).toFixed(1)}% /{" "}
                  {playbook.avgLongTermRef10y * 100 >= 0 ? "+" : ""}
                  {(playbook.avgLongTermRef10y * 100).toFixed(1)}%{" "}
                  (couverture {(playbook.longTermProxyCoverage * 100).toFixed(0)}%)
                </>
              )}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {horizon === "long_terme_5_10_ans"
                ? `Méthode: croissance linéaire annualisée retail→prix actuel, ajustée hype 2020-2021 (facteur moyen ${playbook.avgHypeAdjustedRatio.toFixed(2)}), âge médian ${playbook.avgItemAgeYears.toFixed(1)} an(s).`
                : "Long terme: lecture proxy basée sur stabilité et pente 30j."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Cartographie Univers
            </p>
            <p className="text-xs text-muted-foreground">
              Robustes: {playbook.selectedDirection.robust.length} | Fragiles: {playbook.selectedDirection.fragile.length}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Robustes:{" "}
              {playbook.selectedDirection.robust.slice(0, 3).map((s) => s.seriesName).join(" • ") || "aucune"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              Fragiles:{" "}
              {playbook.selectedDirection.fragile.slice(0, 2).map((s) => s.seriesName).join(" • ") || "aucune"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Guardrail: {playbook.selectedDirection.guardrail}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Lecture comparative
            </p>
            <p className="text-xs text-muted-foreground">
              Meilleure direction actuelle: {DIRECTION_CONFIG[playbook.topDirection].label} ({playbook.topDirectionScore.toFixed(0)}/100)
            </p>
            <p className="text-[11px] text-muted-foreground">
              Score tactique global: {playbook.tacticalScore.toFixed(0)}/100
            </p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                +
                {playbook.signalScore.breakoutUpStrong +
                  playbook.signalScore.momentumUpStrong +
                  playbook.signalScore.oversoldStrong}
              </span>
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-red-500" />
                -
                {playbook.signalScore.breakoutDownStrong +
                  playbook.signalScore.momentumDownStrong +
                  playbook.signalScore.overboughtStrong}
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/60 bg-background/70">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Plan SI-ALORS
            </p>
            <button
              type="button"
              onClick={copyIfThenPlan}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[11px] hover:border-primary/40"
            >
              <Clipboard className="w-3 h-3" />
              {copiedPlan ? "Copié" : "Copier"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{playbook.ifThenPlan}</p>
        </div>

        <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Missions d&apos;analyse
            </p>
            <Badge variant="outline" className="text-[10px]">
              Gamification avancée
            </Badge>
          </div>

          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${completionPct}%` }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
            {missions.map((mission) => (
              <button
                key={mission.id}
                type="button"
                disabled={mission.auto}
                onClick={() => {
                  if (!mission.auto) toggleMission(mission.id as MissionId);
                }}
                className={cn(
                  "text-left p-2.5 rounded-md border transition-colors",
                  mission.done
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-border bg-background hover:border-primary/40",
                  mission.auto && "cursor-default"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">{mission.title}</p>
                  {mission.done ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{mission.detail}</p>
                <p className="text-[10px] text-primary mt-1 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {mission.points} XP
                </p>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={validateSession}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Valider la session
            </button>
            {sessionFeedback && <p className="text-[11px] text-muted-foreground">{sessionFeedback}</p>}
          </div>
        </div>

        <div className="p-3 rounded-lg border border-border/60 bg-background/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Badges
            </p>
            <Badge variant="secondary" className="text-[10px]">
              {unlockedBadgeCount}/{BADGE_RULES.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
            {BADGE_RULES.map((rule) => {
              const unlocked = rule.unlocks(sessionStats);
              return (
                <div
                  key={rule.id}
                  className={cn(
                    "p-2 rounded-md border",
                    unlocked
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : "border-border bg-background"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium">{rule.label}</p>
                    <Trophy className={cn("w-3.5 h-3.5", unlocked ? "text-emerald-500" : "text-muted-foreground")} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{rule.description}</p>
                </div>
              );
            })}
          </div>
        </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
