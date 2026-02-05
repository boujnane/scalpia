"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ExternalLink, BarChart3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";

import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { computeISPFromItems } from "@/lib/analyse/finance/ispIndex";
import { cn } from "@/lib/utils";

function formatPercent(value: number | null) {
  if (value === null) return "N/A";
  const formatted = (value * 100).toFixed(1);
  return value >= 0 ? `+${formatted}%` : `${formatted}%`;
}

/**
 * Mini widget ISP-FR pour le hero de la page investir-pokemon
 */
export function ISPHeroWidget() {
  const { items, loading } = useAnalyseItems();

  const ispSummary = useMemo(() => {
    if (!items || items.length === 0) return null;
    return computeISPFromItems(items);
  }, [items]);

  const sparkValues = useMemo(() => {
    if (!ispSummary?.history || ispSummary.history.length === 0) return [];
    return ispSummary.history.slice(-60).map((p) => p.value);
  }, [ispSummary]);

  if (loading) {
    return <Skeleton className="h-24 w-full max-w-sm rounded-xl" />;
  }

  if (!ispSummary) {
    return null;
  }

  return (
    <div className="w-full max-w-sm sm:w-fit flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4">
        <div>
          <p className="text-xs text-muted-foreground font-medium">ISP-FR aujourd'hui</p>
          <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
            {ispSummary.current.toFixed(2)}
          </p>
          <p
            className={cn(
              "text-sm font-semibold tabular-nums",
              (ispSummary.change7d ?? 0) >= 0 ? "text-success" : "text-destructive"
            )}
          >
            {formatPercent(ispSummary.change7d)} (7j)
          </p>
        </div>
        <div className="w-20 sm:w-24 h-14 sm:h-16">
          <Sparkline
            values={sparkValues}
            strokeClassName={
              (ispSummary.change7d ?? 0) >= 0 ? "text-success" : "text-destructive"
            }
            withFill
            height={56}
          />
        </div>
      </div>
      <Link
        href="/analyse"
        className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
      >
        Voir l’analyse
        <ExternalLink className="w-3 h-3" />
      </Link>
    </div>
  );
}

/**
 * Card ISP-FR avec graphique pour la section performances historiques
 */
export function ISPChartCard() {
  const { items, loading } = useAnalyseItems();

  const ispSummary = useMemo(() => {
    if (!items || items.length === 0) return null;
    return computeISPFromItems(items);
  }, [items]);

  if (loading) {
    return <Skeleton className="h-64 w-full max-w-3xl mx-auto rounded-xl" />;
  }

  if (!ispSummary) {
    return null;
  }

  return (
    <Card className="overflow-hidden max-w-3xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5 pb-3 sm:pb-6">
        <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Évolution de l'ISP-FR
          </span>
          <Badge
            variant={(ispSummary.change30d ?? 0) >= 0 ? "success" : "destructive"}
            className="w-fit"
          >
            {formatPercent(ispSummary.change30d)} (30j)
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 sm:pt-6">
        <div className="h-40 sm:h-48">
          <Sparkline
            values={ispSummary.history.map((p) => p.value)}
            strokeClassName="text-blue-500"
            withFill
            height={160}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">7 jours</p>
            <p
              className={cn(
                "font-semibold tabular-nums",
                (ispSummary.change7d ?? 0) >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatPercent(ispSummary.change7d)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">30 jours</p>
            <p
              className={cn(
                "font-semibold tabular-nums",
                (ispSummary.change30d ?? 0) >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatPercent(ispSummary.change30d)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">90 jours</p>
            <p
              className={cn(
                "font-semibold tabular-nums",
                (ispSummary.change90d ?? 0) >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatPercent(ispSummary.change90d)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">YTD</p>
            <p
              className={cn(
                "font-semibold tabular-nums",
                (ispSummary.changeYTD ?? 0) >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {formatPercent(ispSummary.changeYTD)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
