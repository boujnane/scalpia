// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";

import TrendingCarousel from "@/components/home/TrendingCarousel";

import { ProWidget, ProBadge } from "@/components/analyse/ProWidget";


import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { useSeriesFinance } from "@/hooks/useSeriesFinance";

import { Sparkline } from "@/components/ui/sparkline";
import { MarketSentimentWidget, VolatilityGaugeWidget } from "@/components/analyse/widgets";
import { MarketSentimentWidgetPreview, VolatilityGaugeWidgetPreview } from "@/components/analyse/widgets/ProPreviews";
import { cn } from "@/lib/utils";
import { computeISPFromItems } from "@/lib/analyse/finance/ispIndex";

export default function HomePage() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const { items, loading: itemsLoading, error: itemsError } = useAnalyseItems();
  const seriesFinance = useSeriesFinance(items ?? [], "all");
  const series = seriesFinance.series ?? [];

  const platforms = [
    { name: "eBay", icon: "🛒", color: "from-ebay to-ebay-soft", mobileColor: "bg-ebay-soft", ariaLabel: "eBay" },
    { name: "Cardmarket", icon: "🏪", color: "from-cardmarket to-cardmarket-soft", mobileColor: "bg-cardmarket-soft", ariaLabel: "Cardmarket" },
    { name: "LeBoncoin", icon: "📦", color: "from-leboncoin to-leboncoin-soft", mobileColor: "bg-leboncoin-soft", ariaLabel: "LeBonCoin" },
    { name: "Vinted", icon: "👕", color: "from-vinted to-vinted-soft", mobileColor: "bg-vinted-soft", ariaLabel: "Vinted" },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: prefersReducedMotion ? 0 : 50 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: prefersReducedMotion ? 0 : 0.8 },
  };

  // Snapshot réel
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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Pokéindex",
            description:
              "Comparateur de prix pour le marché secondaire Pokémon. Comparez Cardmarket, eBay, LeBonCoin et Vinted.",
            url: "https://pokeindex.fr",
            applicationCategory: "FinanceApplication",
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
          }),
        }}
      />

      <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* HERO (je te laisse ton style, version compacte ici) */}
        <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center overflow-hidden" aria-labelledby="hero-title">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5" aria-hidden="true" />

          {!prefersReducedMotion && (
            <>
              <div className="absolute top-10 right-5 sm:top-20 sm:right-20 w-48 h-48 sm:w-96 sm:h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" aria-hidden="true" />
              <div className="absolute bottom-10 left-5 sm:bottom-20 sm:left-20 w-40 h-40 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} aria-hidden="true" />
            </>
          )}

          <div className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <motion.div className="space-y-6 sm:space-y-8 text-center lg:text-left" {...fadeInUp}>
                <motion.div
                  initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm text-sm sm:text-base"
                  role="status"
                  aria-live="polite"
                >
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className={prefersReducedMotion ? "absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" : "animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"} />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-primary">
                    100% Gratuit · Index des prix Pokémon
                  </span>
                </motion.div>

                <div className="space-y-5 sm:space-y-7">
                  <h1 id="hero-title" className="text-4xl sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] tracking-tight">
                    <span className="block">Maîtrisez le marché</span>
                    <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      secondaire Pokémon
                    </span>
                  </h1>

                  <p className="text-base sm:text-lg lg:text-xl text-muted-foreground/90 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                    Accédez gratuitement à un{" "}
                    <span className="font-semibold text-foreground">index des prix du marché secondaire Pokémon</span>.
                    Nous analysons Cardmarket, LeBonCoin, eBay et Vinted pour trouver les prix planchers.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start" role="list" aria-label="Plateformes supportées">
                  {platforms.map((platform, i) => (
                    <motion.div
                      key={platform.name}
                      role="listitem"
                      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: prefersReducedMotion ? 0 : 0.4 + i * 0.1 }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r ${platform.color} bg-opacity-10 border-white/10 backdrop-blur-sm hover:scale-105 transition-transform duration-300`}
                      aria-label={platform.ariaLabel}
                    >
                      <span className="text-lg" aria-hidden="true">{platform.icon}</span>
                      <span className="text-sm font-semibold text-foreground">{platform.name}</span>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start pt-2">
                  <Button asChild size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 hover:scale-105 w-full sm:w-auto group">
                    <Link href="/cartes">
                      <span className="hidden sm:inline">Rechercher une carte ou une série</span>
                      <span className="sm:hidden">Rechercher</span>
                      <Icons.search className="ml-2 h-4 sm:h-5 w-4 sm:w-5 transition-transform group-hover:scale-110" aria-hidden="true" />
                    </Link>
                  </Button>

                  <Button asChild variant="outline" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base font-semibold rounded-xl border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 hover:scale-105 w-full sm:w-auto group">
                    <Link href="/analyse">
                      <span className="hidden sm:inline">Analyser les produits scellés</span>
                      <span className="sm:hidden">Analyser</span>
                      <Icons.zap className="ml-2 h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>

                <div className="pt-4 flex justify-center lg:justify-start">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/60 backdrop-blur px-3 py-2">
                    <ProBadge />
                    <p className="text-xs text-muted-foreground">
                      Sentiment, volatilité, risque : lecture instantanée du marché
                    </p>
                    <Link href="/pricing" className="text-xs font-semibold text-primary hover:underline">
                      Voir Pro
                    </Link>
                  </div>
                </div>
              </motion.div>

{mounted && (
                <motion.div 
                  className="relative hidden lg:block"
                  initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.8, delay: prefersReducedMotion ? 0 : 0.2 }}
                  aria-hidden="true"
                >
                  <div className="relative w-full h-[500px] xl:h-[600px]">
                    <motion.div
                      className="absolute inset-0 rounded-2xl xl:rounded-3xl bg-gradient-to-br from-primary/10 to-purple-500/10 
                        backdrop-blur-xl border border-border/50 shadow-2xl p-6 xl:p-8"
                      animate={prefersReducedMotion ? {} : { y: [0, -20, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <div className="w-full h-full rounded-xl xl:rounded-2xl bg-background/50 backdrop-blur-sm border border-border/30 
                        flex flex-col items-center justify-center p-6 space-y-6">
                        
                        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                          <Icons.search className="h-10 w-10 text-primary" strokeWidth={2} />
                        </div>

                        <div className="flex gap-4">
                          {platforms.map((platform, i) => (
                            <motion.div
                              key={platform.name}
                              className={`
                                w-16 h-20 rounded-lg bg-gradient-to-br ${platform.color}
                                shadow-lg border dark:border-white/50 border-black/10 flex items-center justify-center text-2xl
                              `}
                              animate={prefersReducedMotion ? {} : { 
                                y: [0, -10, 0],
                                rotate: [0, 5 - i * 5, 0]
                              }}
                              transition={{ 
                                duration: 2 + i * 0.5,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: i * 0.3
                              }}
                            >
                              {platform.icon}
                            </motion.div>
                          ))}
                        </div>

                        <div className="w-full space-y-2">
                          {[60, 85, 45].map((width, i) => (
                            <motion.div
                              key={i}
                              className="h-2 rounded-full bg-gradient-to-r from-primary/30 to-purple-500/30"
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={prefersReducedMotion ? { duration: 0 } : { 
                                duration: 1.5,
                                delay: 1 + i * 0.2,
                                repeat: Infinity,
                                repeatDelay: 2
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute -left-4 xl:-left-8 top-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl 
                        bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl"
                      animate={prefersReducedMotion ? {} : { x: [0, 10, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      <div className="flex items-center gap-2 xl:gap-3">
                        <span className="text-2xl" aria-hidden="true">🏪</span>
                        <div>
                          <p className="text-xl xl:text-2xl font-bold">€24.99</p>
                          <p className="text-[10px] xl:text-xs text-muted-foreground">Cardmarket</p>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="absolute -right-4 xl:-right-8 bottom-1/4 px-4 xl:px-6 py-3 xl:py-4 rounded-xl xl:rounded-2xl 
                        bg-background/90 backdrop-blur-xl border border-border/50 shadow-xl"
                      animate={prefersReducedMotion ? {} : { x: [0, -10, 0] }}
                      transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                      <div className="flex items-center gap-2 xl:gap-3">
                        <Icons.linechart className="h-5 xl:h-6 w-5 xl:w-6 text-green-600 dark:text-green-400" aria-hidden="true" />
                        <div>
                          <p className="text-xl xl:text-2xl font-bold text-green-600 dark:text-green-400">+18%</p>
                          <p className="text-[10px] xl:text-xs text-muted-foreground">30 jours</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-center mt-8 lg:hidden" aria-hidden="true">
                <div className="relative w-48 h-60 rounded-xl bg-background shadow-lg p-4 border border-border/50">
                  <div className="w-full h-full rounded-lg bg-background flex flex-col items-center justify-center p-4 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Icons.search className="h-5 w-5 text-primary" strokeWidth={2} />
                    </div>
                    <div className="flex gap-2">
                      {platforms.map((platform) => (
                        <div key={platform.name} className={`w-8 h-8 rounded-full flex items-center justify-center ${platform.mobileColor}`}>
                          <span className="text-base">{platform.icon}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full space-y-1 mt-2">
                      <div className="h-1.5 w-[60%] rounded-full bg-blue-500" />
                      <div className="h-1.5 w-[85%] rounded-full bg-yellow-500" />
                      <div className="h-1.5 w-[45%] rounded-full bg-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRENDING */}
        <section className="py-16 sm:py-20" aria-labelledby="trending-title">
          <div className="container mx-auto px-4 sm:px-6 md:px-8">
            <motion.div
              className="text-center mb-8 sm:mb-12 space-y-3"
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 id="trending-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Produits en{" "}
                <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                  Tendance
                </span>
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Les items avec les plus grandes variations de prix cette semaine
              </p>
            </motion.div>

            <TrendingCarousel />

            <div className="text-center mt-8 sm:mt-10">
              <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-xl border-border/50 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300">
                <Link href="/analyse">
                  Voir tous les produits
                  <Icons.zap className="ml-2 h-5 w-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* INSIGHTS + PRO WIDGETS */}
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

            {/* CTA compact (non intrusif) */}
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
        {/* accents décoratifs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-12 -left-10 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl" aria-hidden="true" />

        <div className="relative flex flex-col h-full">
          {/* Header */}
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
              {/* KPIs (2) */}
              <div className="mt-4 grid grid-cols-2 gap-3 relative">
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

              {/* Breadth (up/stable/down) : version plus UX */}
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

                {/* Barre empilée */}
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

                {/* Chips chiffres (plus clean que 3 grosses cards) */}
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

              {/* Sparkline card */}
              <div className="mt-4 rounded-xl border border-border/30 bg-gradient-to-br from-primary/10 to-purple-500/10 p-3 relative overflow-hidden">
                {!prefersReducedMotion && (
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

                    {/* perf 7j mise en valeur */}
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
                    height={160}          // ✅ remplit mieux
                    animated
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
              {/* CTA soft (optionnel) */}
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


            {/* Pro : Sentiment */}
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
                    <MarketSentimentWidget series={series} className="border-0 bg-transparent shadow-none" />
                  </ProWidget>
                </div>
              </div>
            </div>

            {/* Pro : Volatilité */}
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
                    <VolatilityGaugeWidget series={series} className="border-0 bg-transparent shadow-none" />
                  </ProWidget>
                </div>
              </div>
            </div>
          </div>

          {/* Big CTA (plus convaincant) */}
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

        {/* CTA */}
        <section className="relative py-20 sm:py-28 lg:py-32 overflow-hidden" aria-labelledby="cta-title">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10" aria-hidden="true" />
          <motion.div
            className="container mx-auto px-4 sm:px-6 md:px-8 relative z-10"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="max-w-4xl mx-auto text-center space-y-8 py-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary text-secondary-foreground backdrop-blur-sm">
                <Icons.refreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="text-sm font-medium">Index mis à jour quotidiennement</span>
              </div>

              <h2 id="cta-title" className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight px-4">
                L&apos;observatoire des prix du
                <span className="block mt-2 text-primary">marché Pokémon scellé</span>
                francophone
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
                Accédez à un index consolidé des prix planchers observés sur les principales marketplaces.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 px-4">
                <Button asChild size="lg" className="h-12 px-8 text-base font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all">
                  <Link href="/analyse">
                    <Icons.barChart3 className="mr-2 h-5 w-5" aria-hidden="true" />
                    Consulter l&apos;index des prix
                  </Link>
                </Button>

                <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-lg">
                  <Link href="/pricing">Voir le plan Pro</Link>
                </Button>
              </div>

              <p className="text-xs text-muted-foreground/60 pt-4">
                Données agrégées à titre indicatif. Nous ne sommes pas affiliés aux plateformes citées.
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}
