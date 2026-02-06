"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Check,
  ChevronRight,
  Flame,
  Gift,
  Lightbulb,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface GamifiedHubWidgetProps {
  series: SeriesFinanceSummary[];
  className?: string;
  onSeriesClick?: (series: SeriesFinanceSummary) => void;
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type ThemeId =
  | "sentiment"
  | "volatility"
  | "signals"
  | "risk_return"
  | "opportunity";

interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  icon: typeof TrendingUp;
  color: string;
  bgColor: string;
}

const THEMES: ThemeDefinition[] = [
  {
    id: "sentiment",
    name: "Sentiment",
    description: "Moral du marché",
    icon: Activity,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 hover:bg-blue-500/20",
  },
  {
    id: "volatility",
    name: "Volatilité",
    description: "Stabilité des prix",
    icon: BarChart3,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 hover:bg-amber-500/20",
  },
  {
    id: "signals",
    name: "Signaux",
    description: "Alertes actives",
    icon: Zap,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10 hover:bg-violet-500/20",
  },
  {
    id: "risk_return",
    name: "Risque/Rend.",
    description: "Ratio performance",
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 hover:bg-emerald-500/20",
  },
  {
    id: "opportunity",
    name: "Opportunité",
    description: "Séries sous-évaluées",
    icon: TrendingUp,
    color: "text-primary",
    bgColor: "bg-primary/10 hover:bg-primary/20",
  },
];

type ChallengeType =
  | "find_opportunity" // Série mature proche du retail = opportunité
  | "spot_correction" // Série récente en correction = normal, pas négatif
  | "find_stable" // Série la plus stable
  | "long_term_potential" // Meilleur potentiel long terme
  | "compare_premium"; // Comparer les premiums par rapport au retail

interface Challenge {
  id: string;
  type: ChallengeType;
  question: string;
  options: { id: string; label: string; isCorrect: boolean }[];
  xpReward: number;
  hint?: string;
}

interface UserProgress {
  xp: number;
  streak: number;
  lastActivityDate: string | null;
  completedChallenges: string[];
  unlockedBadges: string[];
  totalChallengesCompleted: number;
}

interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  condition: (progress: UserProgress) => boolean;
  tier: "bronze" | "silver" | "gold" | "platinum";
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const STORAGE_KEY = "pokeindex_gamified_hub_v1";

const DEFAULT_PROGRESS: UserProgress = {
  xp: 0,
  streak: 0,
  lastActivityDate: null,
  completedChallenges: [],
  unlockedBadges: [],
  totalChallengesCompleted: 0,
};

const LEVELS = [
  { name: "Débutant", minXp: 0, icon: "🌱" },
  { name: "Apprenti", minXp: 100, icon: "📊" },
  { name: "Analyste", minXp: 300, icon: "🔍" },
  { name: "Expert", minXp: 600, icon: "⭐" },
  { name: "Maître", minXp: 1000, icon: "🏆" },
  { name: "Légende", minXp: 2000, icon: "👑" },
];

const BADGES: BadgeDefinition[] = [
  {
    id: "first_challenge",
    name: "Premier Pas",
    description: "Compléter son premier défi",
    icon: Star,
    condition: (p) => p.totalChallengesCompleted >= 1,
    tier: "bronze",
  },
  {
    id: "streak_3",
    name: "Régulier",
    description: "3 jours consécutifs d'activité",
    icon: Flame,
    condition: (p) => p.streak >= 3,
    tier: "bronze",
  },
  {
    id: "streak_7",
    name: "Dévoué",
    description: "7 jours consécutifs d'activité",
    icon: Flame,
    condition: (p) => p.streak >= 7,
    tier: "silver",
  },
  {
    id: "challenges_10",
    name: "Curieux",
    description: "10 défis complétés",
    icon: Target,
    condition: (p) => p.totalChallengesCompleted >= 10,
    tier: "silver",
  },
  {
    id: "challenges_50",
    name: "Analyste Confirmé",
    description: "50 défis complétés",
    icon: Award,
    condition: (p) => p.totalChallengesCompleted >= 50,
    tier: "gold",
  },
  {
    id: "xp_500",
    name: "Demi-Millénaire",
    description: "Atteindre 500 XP",
    icon: Zap,
    condition: (p) => p.xp >= 500,
    tier: "gold",
  },
  {
    id: "xp_1000",
    name: "Millénaire",
    description: "Atteindre 1000 XP",
    icon: Trophy,
    condition: (p) => p.xp >= 1000,
    tier: "platinum",
  },
];

const TIER_COLORS = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-slate-400 to-slate-600",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-violet-400 to-purple-600",
};

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return dateStr === yesterday.toISOString().slice(0, 10);
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === getTodayKey();
}

function getCurrentLevel(xp: number) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.minXp) current = level;
  }
  return current;
}

function getNextLevel(xp: number) {
  for (const level of LEVELS) {
    if (xp < level.minXp) return level;
  }
  return null;
}

function getLevelProgress(xp: number): number {
  const current = getCurrentLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXp - current.minXp;
  const progress = xp - current.minXp;
  return Math.min(100, Math.round((progress / range) * 100));
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ═══════════════════════════════════════════════════════════════
// CHALLENGE GENERATOR
// ═══════════════════════════════════════════════════════════════

function generateChallenge(
  series: SeriesFinanceSummary[],
  completedIds: string[]
): Challenge | null {
  if (series.length < 3) return null;

  const challengeTypes: ChallengeType[] = [
    "find_opportunity",
    "spot_correction",
    "find_stable",
    "long_term_potential",
    "compare_premium",
  ];

  const shuffledTypes = shuffleArray(challengeTypes);

  for (const type of shuffledTypes) {
    const challenge = createChallengeOfType(type, series, completedIds);
    if (challenge) return challenge;
  }

  return null;
}

function createChallengeOfType(
  type: ChallengeType,
  series: SeriesFinanceSummary[],
  completedIds: string[]
): Challenge | null {
  const today = getTodayKey();
  const randomSuffix = Math.floor(Math.random() * 10000);
  const challengeId = `${type}_${today}_${randomSuffix}`;

  // Limit challenges per type per day
  const todayChallengesOfType = completedIds.filter(
    (id) => id.startsWith(`${type}_${today}`)
  );
  if (todayChallengesOfType.length >= 3) return null;

  switch (type) {
    case "find_opportunity": {
      // Séries matures (>= 1.5 ans) proches du retail = opportunités
      const opportunities = series.filter(
        (s) =>
          s.medianItemAgeYears != null &&
          s.medianItemAgeYears >= 1.5 &&
          s.metrics.premiumNow != null &&
          s.metrics.premiumNow < 0.35 &&
          s.metrics.premiumNow > -0.20
      );
      if (opportunities.length < 2) return null;

      const shuffledOpportunities = shuffleArray(opportunities);
      const correct = shuffledOpportunities[0];

      const wrongCandidates = series.filter(
        (s) =>
          s.seriesName !== correct.seriesName &&
          ((s.medianItemAgeYears ?? 0) < 1 || (s.metrics.premiumNow ?? 0) > 0.5)
      );
      const others = shuffleArray(wrongCandidates).slice(0, 2);

      if (others.length < 2) return null;

      const options = shuffleArray([
        { id: correct.seriesName, label: correct.seriesName, isCorrect: true },
        { id: others[0].seriesName, label: others[0].seriesName, isCorrect: false },
        { id: others[1].seriesName, label: others[1].seriesName, isCorrect: false },
      ]);

      return {
        id: challengeId,
        type,
        question: "Parmi ces séries, laquelle est mature ET proche du retail ?",
        options,
        xpReward: 30,
        hint: `Cherchez une série de +1.5 ans avec un prix proche du retail`,
      };
    }

    case "spot_correction": {
      // Séries récentes (< 1 an) en baisse = correction normale
      const recentInCorrection = series.filter(
        (s) =>
          s.medianItemAgeYears != null &&
          s.medianItemAgeYears < 1 &&
          s.metrics.return30d != null &&
          s.metrics.return30d < -0.03
      );
      if (recentInCorrection.length < 1) return null;

      const correct = shuffleArray(recentInCorrection)[0];

      const wrongCandidates = series.filter(
        (s) =>
          s.seriesName !== correct.seriesName &&
          ((s.medianItemAgeYears ?? 2) >= 1.5 || (s.metrics.return30d ?? 0) > 0.02)
      );
      const others = shuffleArray(wrongCandidates).slice(0, 2);

      if (others.length < 2) return null;

      const options = shuffleArray([
        { id: correct.seriesName, label: correct.seriesName, isCorrect: true },
        { id: others[0].seriesName, label: others[0].seriesName, isCorrect: false },
        { id: others[1].seriesName, label: others[1].seriesName, isCorrect: false },
      ]);

      return {
        id: challengeId,
        type,
        question: "Quelle série récente est en phase de correction post-lancement ?",
        options,
        xpReward: 25,
        hint: "Une série de moins d'1 an qui baisse après son lancement",
      };
    }

    case "find_stable": {
      // Séries stables (faible vol + ancienneté)
      const stableSeries = series.filter(
        (s) =>
          s.metrics.vol30d != null &&
          s.metrics.vol30d < 0.07 &&
          s.medianItemAgeYears != null &&
          s.medianItemAgeYears >= 1
      );
      if (stableSeries.length < 2) return null;

      const correct = shuffleArray(stableSeries)[0];

      const wrongCandidates = series.filter(
        (s) =>
          s.seriesName !== correct.seriesName &&
          ((s.metrics.vol30d ?? 0.1) > 0.08 || (s.medianItemAgeYears ?? 0) < 0.8)
      );
      const others = shuffleArray(wrongCandidates).slice(0, 2);

      if (others.length < 2) return null;

      const options = shuffleArray([
        { id: correct.seriesName, label: correct.seriesName, isCorrect: true },
        { id: others[0].seriesName, label: others[0].seriesName, isCorrect: false },
        { id: others[1].seriesName, label: others[1].seriesName, isCorrect: false },
      ]);

      return {
        id: challengeId,
        type,
        question: "Parmi ces séries, laquelle est établie ET stable ?",
        options,
        xpReward: 20,
        hint: "Faible volatilité + ancienneté = stabilité",
      };
    }

    case "long_term_potential": {
      // Séries avec bon potentiel LT
      const withLongTermData = series.filter(
        (s) =>
          s.medianItemAgeYears != null &&
          s.medianItemAgeYears >= 1 &&
          s.longTermAnnualLinear != null &&
          s.longTermAnnualLinear > 0.03 &&
          s.metrics.premiumNow != null &&
          s.metrics.premiumNow < 0.5
      );
      if (withLongTermData.length < 2) return null;

      const correct = shuffleArray(withLongTermData)[0];

      const wrongCandidates = series.filter(
        (s) =>
          s.seriesName !== correct.seriesName &&
          ((s.longTermAnnualLinear ?? 0) < 0.01 || (s.metrics.premiumNow ?? 0) > 0.7)
      );
      const others = shuffleArray(wrongCandidates).slice(0, 2);

      if (others.length < 2) return null;

      const options = shuffleArray([
        { id: correct.seriesName, label: correct.seriesName, isCorrect: true },
        { id: others[0].seriesName, label: others[0].seriesName, isCorrect: false },
        { id: others[1].seriesName, label: others[1].seriesName, isCorrect: false },
      ]);

      return {
        id: challengeId,
        type,
        question: "Quelle série combine croissance historique ET prix raisonnable ?",
        options,
        xpReward: 35,
        hint: "Bonne croissance passée + premium modéré = potentiel LT",
      };
    }

    case "compare_premium": {
      // Diviser en 2 groupes: premium faible vs premium élevé
      const lowPremium = series.filter(
        (s) =>
          s.metrics.premiumNow != null &&
          s.metrics.premiumNow < 0.2 &&
          s.medianItemAgeYears != null &&
          s.medianItemAgeYears >= 1
      );
      const highPremium = series.filter(
        (s) =>
          s.metrics.premiumNow != null &&
          s.metrics.premiumNow > 0.5
      );

      if (lowPremium.length < 1 || highPremium.length < 2) return null;

      const correct = shuffleArray(lowPremium)[0];
      const others = shuffleArray(highPremium).slice(0, 2);

      const options = shuffleArray([
        { id: correct.seriesName, label: correct.seriesName, isCorrect: true },
        { id: others[0].seriesName, label: others[0].seriesName, isCorrect: false },
        { id: others[1].seriesName, label: others[1].seriesName, isCorrect: false },
      ]);

      return {
        id: challengeId,
        type,
        question: "Quelle série mature est la plus proche de son prix retail ?",
        options,
        xpReward: 25,
        hint: "Un faible premium = prix proche du retail d'origine",
      };
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// THEME BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════

function ThemeButton({
  theme,
  onClick,
}: {
  theme: ThemeDefinition;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/40",
        "transition-all duration-200 ease-out",
        "hover:scale-105 hover:shadow-md hover:border-transparent",
        "active:scale-95",
        theme.bgColor
      )}
    >
      <theme.icon
        className={cn(
          "w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110",
          theme.color
        )}
      />
      <span className="text-[11px] font-medium text-foreground">
        {theme.name}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function GamifiedHubWidget({
  series,
  className,
  onSeriesClick,
}: GamifiedHubWidgetProps) {
  const [progress, setProgress] = useState<UserProgress>(() => {
    if (typeof window === "undefined") return DEFAULT_PROGRESS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_PROGRESS;
      return { ...DEFAULT_PROGRESS, ...JSON.parse(stored) };
    } catch {
      return DEFAULT_PROGRESS;
    }
  });

  const [selectedTheme, setSelectedTheme] = useState<ThemeId | null>(null);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [xpAnimation, setXpAnimation] = useState<number | null>(null);
  const [newBadge, setNewBadge] = useState<BadgeDefinition | null>(null);
  const [opportunityIndex, setOpportunityIndex] = useState(0);

  // Save progress to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress]);

  // Update streak on mount
  useEffect(() => {
    if (isToday(progress.lastActivityDate)) return;

    setProgress((prev) => {
      const newStreak = isYesterday(prev.lastActivityDate) ? prev.streak : 0;
      return { ...prev, streak: newStreak };
    });
  }, [progress.lastActivityDate]);

  // Generate challenge when theme is selected
  useEffect(() => {
    if (selectedTheme && !currentChallenge) {
      const challenge = generateChallenge(series, progress.completedChallenges);
      setCurrentChallenge(challenge);
    }
  }, [series, progress.completedChallenges, currentChallenge, selectedTheme]);

  const handleThemeSelect = useCallback((themeId: ThemeId) => {
    setSelectedTheme(themeId);
    setCurrentChallenge(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
  }, []);

  const handleBackToThemes = useCallback(() => {
    setSelectedTheme(null);
    setCurrentChallenge(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
  }, []);

  // Find opportunities for insight
  const opportunities = series.filter(
    (s) =>
      s.medianItemAgeYears != null &&
      s.medianItemAgeYears >= 1.5 &&
      s.metrics.premiumNow != null &&
      s.metrics.premiumNow < 0.35 &&
      s.metrics.premiumNow > -0.2
  );

  // Rotate opportunity on mount
  useEffect(() => {
    if (opportunities.length > 1) {
      setOpportunityIndex(Math.floor(Math.random() * opportunities.length));
    }
  }, [opportunities.length]);

  const bestOpportunity = opportunities[opportunityIndex] ?? opportunities[0] ?? null;

  const checkNewBadges = useCallback(
    (newProgress: UserProgress) => {
      for (const badge of BADGES) {
        if (
          !newProgress.unlockedBadges.includes(badge.id) &&
          badge.condition(newProgress)
        ) {
          setNewBadge(badge);
          return badge.id;
        }
      }
      return null;
    },
    []
  );

  const handleAnswer = useCallback(
    (answerId: string) => {
      if (showResult || !currentChallenge) return;

      setSelectedAnswer(answerId);
      setShowResult(true);

      const isCorrect = currentChallenge.options.find(
        (o) => o.id === answerId
      )?.isCorrect;

      if (isCorrect) {
        const today = getTodayKey();
        const newStreak =
          isYesterday(progress.lastActivityDate) || isToday(progress.lastActivityDate)
            ? progress.streak + (isToday(progress.lastActivityDate) ? 0 : 1)
            : 1;

        const newProgress: UserProgress = {
          ...progress,
          xp: progress.xp + currentChallenge.xpReward,
          streak: newStreak,
          lastActivityDate: today,
          completedChallenges: [...progress.completedChallenges, currentChallenge.id],
          totalChallengesCompleted: progress.totalChallengesCompleted + 1,
        };

        const newBadgeId = checkNewBadges(newProgress);
        if (newBadgeId) {
          newProgress.unlockedBadges = [...newProgress.unlockedBadges, newBadgeId];
        }

        setProgress(newProgress);
        setXpAnimation(currentChallenge.xpReward);
        setTimeout(() => setXpAnimation(null), 1500);
      }
    },
    [currentChallenge, progress, showResult, checkNewBadges]
  );

  const handleNextChallenge = useCallback(() => {
    setCurrentChallenge(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowHint(false);
    setTimeout(() => {
      const challenge = generateChallenge(series, progress.completedChallenges);
      setCurrentChallenge(challenge);
    }, 100);
  }, [series, progress.completedChallenges]);

  const dismissNewBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  // Computed values
  const currentLevel = getCurrentLevel(progress.xp);
  const nextLevel = getNextLevel(progress.xp);
  const levelProgress = getLevelProgress(progress.xp);
  const unlockedBadgesCount = BADGES.filter((b) =>
    progress.unlockedBadges.includes(b.id)
  ).length;

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-primary/20",
        "bg-gradient-to-br from-primary/5 via-background to-background",
        className
      )}
    >
      {/* Subtle animated background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />

      {/* XP Animation */}
      {xpAnimation && (
        <div className="absolute top-4 right-4 z-20 animate-bounce">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-success text-success-foreground text-sm font-bold shadow-lg">
            <Sparkles className="w-4 h-4" />
            +{xpAnimation} XP
          </div>
        </div>
      )}

      {/* New Badge Modal */}
      {newBadge && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-2xl text-center max-w-[280px] animate-in zoom-in-95 duration-300">
            <div
              className={cn(
                "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                "bg-gradient-to-br shadow-lg",
                TIER_COLORS[newBadge.tier]
              )}
            >
              <newBadge.icon className="w-8 h-8 text-white" />
            </div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Nouveau badge débloqué
            </p>
            <p className="text-lg font-bold text-foreground mb-2">{newBadge.name}</p>
            <p className="text-sm text-muted-foreground mb-4">{newBadge.description}</p>
            <button
              onClick={dismissNewBadge}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Super !
            </button>
          </div>
        </div>
      )}

      <CardHeader className="relative pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          Hub Analyste
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {currentLevel.icon} {currentLevel.name}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative pt-0 space-y-3">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2">
          {/* XP */}
          <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] text-muted-foreground font-medium">XP</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {progress.xp}
            </p>
          </div>

          {/* Streak */}
          <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame
                className={cn(
                  "w-3.5 h-3.5",
                  progress.streak > 0 ? "text-orange-500" : "text-muted-foreground"
                )}
              />
              <span className="text-[10px] text-muted-foreground font-medium">Streak</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {progress.streak}
              <span className="text-xs text-muted-foreground ml-0.5">j</span>
            </p>
          </div>

          {/* Badges */}
          <div className="p-2.5 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 mb-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] text-muted-foreground font-medium">Badges</span>
            </div>
            <p className="text-lg font-bold tabular-nums text-foreground">
              {unlockedBadgesCount}
              <span className="text-xs text-muted-foreground ml-0.5">/{BADGES.length}</span>
            </p>
          </div>
        </div>

        {/* Level Progress */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">
              {currentLevel.icon} {currentLevel.name}
            </span>
            {nextLevel && (
              <span className="text-muted-foreground">
                {nextLevel.icon} {nextLevel.name}
              </span>
            )}
          </div>
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
          {nextLevel && (
            <p className="text-[10px] text-muted-foreground text-center">
              {nextLevel.minXp - progress.xp} XP jusqu&apos;au niveau suivant
            </p>
          )}
        </div>

        {/* Theme Selection or Quiz */}
        {!selectedTheme ? (
          /* Theme Selection Panel */
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground text-center font-medium uppercase tracking-wider">
              Choisissez un thème
            </p>

            <div className="space-y-1.5">
              {/* Row 1: 1 centered (top) */}
              <div className="flex justify-center">
                <ThemeButton theme={THEMES[0]} onClick={() => handleThemeSelect(THEMES[0].id)} />
              </div>
              {/* Row 2: 2 items */}
              <div className="flex justify-center gap-2">
                <ThemeButton theme={THEMES[1]} onClick={() => handleThemeSelect(THEMES[1].id)} />
                <ThemeButton theme={THEMES[2]} onClick={() => handleThemeSelect(THEMES[2].id)} />
              </div>
              {/* Row 3: 2 items */}
              <div className="flex justify-center gap-2">
                <ThemeButton theme={THEMES[3]} onClick={() => handleThemeSelect(THEMES[3].id)} />
                <ThemeButton theme={THEMES[4]} onClick={() => handleThemeSelect(THEMES[4].id)} />
              </div>
            </div>
          </div>
        ) : (
          /* Quiz Section */
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={handleBackToThemes}
                className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </button>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {THEMES.find((t) => t.id === selectedTheme)?.name}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Défi du jour
                </p>
              </div>
              {currentChallenge && (
                <Badge variant="outline" className="text-[10px] bg-background/50">
                  +{currentChallenge.xpReward} XP
                </Badge>
              )}
            </div>

            {currentChallenge ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  {currentChallenge.question}
                </p>

                <div className="space-y-2">
                  {currentChallenge.options.map((option) => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrect = option.isCorrect;
                    const showCorrect = showResult && isCorrect;
                    const showWrong = showResult && isSelected && !isCorrect;

                    return (
                      <button
                        key={option.id}
                        onClick={() => handleAnswer(option.id)}
                        disabled={showResult}
                        className={cn(
                          "w-full p-3 rounded-lg border text-left text-sm font-medium transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          !showResult && "cursor-pointer",
                          showResult && "cursor-default",
                          showCorrect && "border-success bg-success/10 text-success",
                          showWrong && "border-destructive bg-destructive/10 text-destructive",
                          !showResult && isSelected && "border-primary bg-primary/10",
                          !showResult && !isSelected && "border-border bg-background/60"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="capitalize">{option.label}</span>
                          {showCorrect && <Check className="w-4 h-4 text-success" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Hint */}
                {!showResult && currentChallenge.hint && (
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    {showHint ? currentChallenge.hint : "Afficher l'indice"}
                  </button>
                )}

                {/* Result */}
                {showResult && (
                  <div className="pt-2 space-y-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        currentChallenge.options.find((o) => o.id === selectedAnswer)
                          ?.isCorrect
                          ? "text-success"
                          : "text-destructive"
                      )}
                    >
                      {currentChallenge.options.find((o) => o.id === selectedAnswer)
                        ?.isCorrect
                        ? "Bonne réponse !"
                        : "Pas tout à fait..."}
                    </p>
                    <button
                      onClick={handleNextChallenge}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      Défi suivant
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Gift className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  Tous les défis du jour sont complétés !
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Revenez demain pour de nouveaux défis
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Insight - Opportunity */}
        {bestOpportunity && (
          <button
            onClick={() => onSeriesClick?.(bestOpportunity)}
            className="w-full p-3 rounded-xl bg-primary/5 border border-primary/20 text-left hover:bg-primary/10 transition-colors group"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-primary font-medium uppercase tracking-wider">
                  Opportunité long terme
                </p>
                <p className="text-sm font-semibold text-foreground capitalize truncate">
                  {bestOpportunity.seriesName}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-muted-foreground">
                  {(bestOpportunity.medianItemAgeYears ?? 0).toFixed(1)} ans
                </span>
                <p className="text-[10px] text-muted-foreground">
                  {(bestOpportunity.metrics.premiumNow ?? 0) > 0 ? "+" : ""}
                  {((bestOpportunity.metrics.premiumNow ?? 0) * 100).toFixed(0)}% du retail
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </button>
        )}

        {/* Badges Preview */}
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            Badges récents
          </p>
          <div className="flex flex-wrap gap-1.5">
            {BADGES.slice(0, 5).map((badge) => {
              const isUnlocked = progress.unlockedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={cn(
                    "relative group w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    isUnlocked
                      ? cn("bg-gradient-to-br shadow-sm", TIER_COLORS[badge.tier])
                      : "bg-muted/50 border border-border/50"
                  )}
                  title={isUnlocked ? badge.name : `${badge.name} - ${badge.description}`}
                >
                  <badge.icon
                    className={cn(
                      "w-4 h-4",
                      isUnlocked ? "text-white" : "text-muted-foreground/50"
                    )}
                  />
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-background/50">
                      <span className="text-[8px] text-muted-foreground">?</span>
                    </div>
                  )}
                </div>
              );
            })}
            {BADGES.length > 5 && (
              <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted/30 border border-border/30 text-[10px] text-muted-foreground">
                +{BADGES.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[9px] text-muted-foreground/70 text-center pt-1 border-t border-border/30">
          Les défis sont pédagogiques et n&apos;impliquent aucune prise de risque
        </p>
      </CardContent>
    </Card>
  );
}
