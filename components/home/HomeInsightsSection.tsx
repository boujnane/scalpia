"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { ProWidget } from "@/components/analyse/ProWidget";
import { MarketSentimentWidget, VolatilityGaugeWidget } from "@/components/analyse/widgets";
import { MarketSentimentWidgetPreview, VolatilityGaugeWidgetPreview } from "@/components/analyse/widgets/ProPreviews";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkline } from "@/components/ui/sparkline";
import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { useSeriesFinance } from "@/hooks/useSeriesFinance";
import { cn } from "@/lib/utils";
import { computeISPFromItems } from "@/lib/analyse/finance/ispIndex";

export default function HomeInsightsSection() {
  const prefersReducedMotion = useReducedMotion();
  const [showWidgets, setShowWidgets] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setShowWidgets(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  const { items, loading: itemsLoading, error: itemsError } = useAnalyseItems();
  const seriesFinance = useSeriesFinance(items ?? [], "all");
  const series = seriesFinance.series ?? [];

  const snapshot = useMemo(() => {
    const total = series.length;

    const up = series.filter((s) => s.trend7d === "up").length;
    const down = series.filter((s) => s.trend7d === "down").length;
    const stable = Math.max(0, total - up - down);

    const validReturns7d = series
      .map((s) => s.metrics?.return7d)
      .filter((x): x is number => typeof x === "number" && Number.isFinite(x));

    const avgReturn7d =
      validReturns7d.length > 0
        ? validReturns7d.reduce((sum, r) => sum + r, 0) / validReturns7d.length
        : null;

    const signal = up > down ? "Haussier" : down > up ? "Baissier" : "Stable";

    const sortedByReturn7d = [...series]
      .filter((s) => typeof s.metrics?.return7d === "number")
      .sort((a, b) => (b.metrics.return7d ?? 0) - (a.metrics.return7d ?? 0));

    const top = sortedByReturn7d[0] ?? null;
    const worst = sortedByReturn7d[sortedByReturn7d.length - 1] ?? null;

    return { total, up, down, stable, avgReturn7d, signal, top, worst };
  }, [series]);

  const ispSummary = useMemo(() => computeISPFromItems(items ?? []), [items]);

  const sparkValues = useMemo(() => {
    const history = ispSummary.history ?? [];
    if (history.length === 0) return [0, 0];
    return history.slice(-40).map((point) => point.value);
  }, [ispSummary.history]);

  return (
    <section className="py-16 sm:py-20 border-t border-border/50 bg-muted/10">
      <div className="container mx-auto px-4 sm:px-6 md:px-8">
        <div className="space-y-6">
          {/* Header section + CTA */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">
                Insights{" "}
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Marché
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Vue gratuite + indicateurs Pro pour anticiper les mouvements (sentiment, volatilité, risque).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-background/60 backdrop-blur px-3 py-2 text-xs font-semibold hover:bg-muted/40 transition-colors"
              >
                Comparer les plans
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
              >
                Débloquer Pro
              </Link>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            {/* Snapshot gratuit + Sparkline */}
            <div className="lg:col-span-1 rounded-2xl border border-border/50 bg-background/60 backdrop-blur p-5 relative overflow-hidden h-full flex flex-col">
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
              <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl" aria-hidden="true" />

              <div className="relative flex flex-col h-full">
                <div className="relative flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">Snapshot</p>

                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                        Gratuit
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Vue rapide du marché : breadth 7j + performance moyenne.
                    </p>
                  </div>

                  <span className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-muted/60 border border-border/50 text-muted-foreground">
                    Maj quotidienne
                  </span>
                </div>

                {itemsLoading ? (
                  <div className="mt-4 space-y-3 relative">
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-[72px] rounded-xl" />
                      <Skeleton className="h-[72px] rounded-xl" />
                    </div>
                    <Skeleton className="h-[68px] rounded-xl" />
                    <Skeleton className="h-[92px] rounded-xl" />
                  </div>
                ) : itemsError ? (
                  <div className="mt-4 text-xs text-destructive relative">
                    Impossible de charger les données.
                  </div>
                ) : (
                  <>
                    {/* ISP-FR Index */}
                    <div className="mt-4 rounded-xl bg-gradient-to-br from-primary/15 to-purple-500/10 p-3 border border-primary/20 relative">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-muted-foreground font-medium">ISP-FR</p>
                          <div className="mt-0.5 flex items-baseline gap-2">
                            <p className="text-2xl font-bold tabular-nums text-primary">
                              {ispSummary.current.toFixed(2)}
                            </p>
                            <span
                              className={cn(
                                "text-xs font-semibold tabular-nums",
                                ispSummary.change7d == null
                                  ? "text-muted-foreground"
                                  : ispSummary.change7d >= 0
                                    ? "text-success"
                                    : "text-destructive"
                              )}
                            >
                              {ispSummary.change7d == null
                                ? "N/A"
                                : `${ispSummary.change7d >= 0 ? "+" : ""}${(ispSummary.change7d * 100).toFixed(2)}%`}
                            </span>
                            <span className="text-[10px] text-muted-foreground">7j</span>
                          </div>
                        </div>
                        <Link
                          href="/analyse"
                          className="text-[10px] font-medium text-primary hover:underline"
                        >
                          Voir détails →
                        </Link>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 relative">
                      <div className="rounded-xl bg-muted/35 p-3 border border-border/30">
                        <p className="text-[11px] text-muted-foreground">Séries analysées</p>
                        <div className="mt-1 flex items-end justify-between gap-2">
                          <p className="text-xl font-bold tabular-nums">{snapshot.total}</p>
                          <span className="text-[10px] text-muted-foreground">sur 30j</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-muted/35 p-3 border border-border/30">
                        <p className="text-[11px] text-muted-foreground">Signal du jour</p>
                        <div className="mt-1 flex items-end justify-between gap-2">
                          <p className="text-xl font-bold">{snapshot.signal}</p>
                          <span className="text-[10px] text-muted-foreground">tendance</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-xl border border-border/30 bg-muted/20 p-3 relative">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          Breadth 7 jours
                        </p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                          {snapshot.total > 0
                            ? `${Math.round((snapshot.up / snapshot.total) * 100)}% ↑ · ${Math.round((snapshot.down / snapshot.total) * 100)}% ↓`
                            : "N/A"}
                        </p>
                      </div>

                      <div className="mt-2 h-2.5 w-full rounded-full overflow-hidden bg-muted">
                        <div className="h-full flex">
                          <div
                            className="h-full bg-success/70"
                            style={{ width: `${(snapshot.up / Math.max(1, snapshot.total)) * 100}%` }}
                            aria-hidden="true"
                          />
                          <div
                            className="h-full bg-foreground/15"
                            style={{ width: `${(snapshot.stable / Math.max(1, snapshot.total)) * 100}%` }}
                            aria-hidden="true"
                          />
                          <div
                            className="h-full bg-destructive/70"
                            style={{ width: `${(snapshot.down / Math.max(1, snapshot.total)) * 100}%` }}
                            aria-hidden="true"
                          />
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-success/70" aria-hidden="true" />
                          ↑ <span className="font-semibold text-foreground tabular-nums">{snapshot.up}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-foreground/20" aria-hidden="true" />
                          = <span className="font-semibold text-foreground tabular-nums">{snapshot.stable}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive/70" aria-hidden="true" />
                          ↓ <span className="font-semibold text-foreground tabular-nums">{snapshot.down}</span>
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-border/30 bg-gradient-to-br from-primary/10 to-purple-500/10 p-3 relative overflow-hidden">
                      {!prefersReducedMotion && showWidgets && (
                        <motion.div
                          className="absolute inset-y-0 -left-1/3 w-1/3 bg-primary/10"
                          animate={{ x: ["0%", "420%"] }}
                          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                          aria-hidden="true"
                        />
                      )}

                      <div className="relative">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Sparkline marché
                          </p>

                          <span
                            className={cn(
                              "text-[11px] tabular-nums px-2 py-0.5 rounded-full border",
                              snapshot.avgReturn7d == null
                                ? "text-muted-foreground bg-muted/40 border-border/40"
                                : snapshot.avgReturn7d >= 0
                                  ? "text-success bg-success/10 border-success/20"
                                  : "text-destructive bg-destructive/10 border-destructive/20"
                            )}
                          >
                            {snapshot.avgReturn7d == null
                              ? "Perf 7j: N/A"
                              : `Perf 7j: ${snapshot.avgReturn7d >= 0 ? "+" : ""}${(snapshot.avgReturn7d * 100).toFixed(1)}%`}
                          </span>
                        </div>

                        <Sparkline
                          values={sparkValues}
                          strokeClassName="text-primary"
                          withFill
                          height={160}
                          animated={showWidgets && !prefersReducedMotion}
                          drawDurationMs={1200}
                          loopDelayMs={1800}
                          showEndDot={false}
                        />

                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>Mix breadth + perf</span>
                          <span>signal visuel</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-border/30 bg-background/40 p-3">
                      <p className="text-[11px] text-muted-foreground">
                        Pour aller plus loin :{" "}
                        <span className="font-semibold text-foreground">sentiment</span>,{" "}
                        <span className="font-semibold text-foreground">volatilité</span>,{" "}
                        <span className="font-semibold text-foreground">risque</span>.
                      </p>
                      <Link href="/analyse" className="text-[11px] font-semibold text-primary hover:underline shrink-0">
                        Analyse →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="lg:col-span-1 space-y-3">
              <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur p-5 relative overflow-hidden h-full flex flex-col">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                          PRO
                        </span>
                        <p className="text-sm font-semibold">Sentiment du marché</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Détecte rapidement si le marché est en{" "}
                        <span className="font-semibold text-foreground">peur</span> ou{" "}
                        <span className="font-semibold text-foreground">euphorie</span>.
                      </p>
                    </div>
                    <Link href="/pricing" className="shrink-0 text-[11px] font-semibold text-primary hover:underline">
                      Débloquer
                    </Link>
                  </div>

                  <ProWidget
                    title="Sentiment du marché (Pro)"
                    className="rounded-lg flex-1 h-full mt-4"
                    preview={<MarketSentimentWidgetPreview className="border-0 bg-transparent shadow-none" />}
                  >
                    {showWidgets ? (
                      <MarketSentimentWidget series={series} className="border-0 bg-transparent shadow-none" />
                    ) : null}
                  </ProWidget>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-3">
              <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur p-5 relative overflow-hidden h-full flex flex-col">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary">
                          PRO
                        </span>
                        <p className="text-sm font-semibold">Volatilité & Risque</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Repère les séries{" "}
                        <span className="font-semibold text-foreground">instables</span> avant les corrections.
                      </p>
                    </div>
                    <Link href="/pricing" className="shrink-0 text-[11px] font-semibold text-primary hover:underline">
                      Débloquer
                    </Link>
                  </div>

                  <ProWidget
                    title="Volatilité & Risque (Pro)"
                    className="rounded-lg flex-1 h-full mt-4"
                    preview={<VolatilityGaugeWidgetPreview className="border-0 bg-transparent shadow-none" />}
                  >
                    {showWidgets ? (
                      <VolatilityGaugeWidget series={series} className="border-0 bg-transparent shadow-none" />
                    ) : null}
                  </ProWidget>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-semibold">
                Passez en Pro pour anticiper les mouvements
              </p>
              <p className="text-xs text-muted-foreground">
                Accès aux widgets avancés + signaux + graphiques de risque (et bientôt alertes).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-border/60 bg-background/60 backdrop-blur px-4 py-2 text-xs font-semibold hover:bg-muted/40 transition-colors"
              >
                Voir les fonctionnalités
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-5 py-2 text-xs font-semibold shadow-sm hover:bg-primary/90 transition-colors"
              >
                Débloquer Pro
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
