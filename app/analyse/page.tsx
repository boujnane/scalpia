"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnalyseTabs from "@/components/analyse/AnalyseTabs";
import ISPIndexCard from "@/components/analyse/ISPIndexCard";
import TopMovers from "@/components/analyse/TopMovers";
import SeriesAnalytics from "@/components/analyse/SeriesAnalytics";
import { useSeriesFinance } from "@/hooks/useSeriesFinance";
import { useAnalyseItems } from "@/hooks/useAnalyseItems";
import { useAuth } from "@/context/AuthContext";
import { useTutorial, TutorialHelpButton, type TutorialStep } from "@/components/tutorial";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Layers,
  PieChart,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Zap,
  X
} from "lucide-react";

const ANALYSE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "navigation",
    target: "[data-tutorial='navigation']",
    title: "Choisissez votre vue",
    description: "Vue d'ensemble pour les tendances globales, ou Produits pour explorer boosters, displays et coffrets en détail.",
    position: "bottom",
  },
  {
    id: "isp-index",
    target: "[data-tutorial='isp-index']",
    title: "L'Index du marché",
    description: "Le pouls du marché scellé français. Cet indicateur agrège tous les prix pour vous montrer la tendance générale en un coup d'œil.",
    position: "bottom",
  },
  {
    id: "top-movers",
    target: "[data-tutorial='top-movers']",
    title: "Top des variations",
    description: "Les séries qui bougent le plus cette semaine. Repérez rapidement les hausses et les baisses significatives.",
    position: "top",
  },
  {
    id: "pro-widgets",
    target: "[data-tutorial='pro-widgets']",
    title: "Indicateurs avancés",
    description: "Sentiment, volatilité et signaux de marché. Des outils d'analyse réservés aux membres Pro.",
    position: "top",
  },
  {
    id: "series-analytics",
    target: "[data-tutorial='series-analytics']",
    title: "Analyse par série",
    description: "Filtrez par bloc, triez par performance et visualisez les tendances. Cliquez sur une série pour accéder à ses métriques détaillées.",
    position: "top",
  },
  {
    id: "series-view-modes",
    target: "[data-tutorial='series-view-modes']",
    title: "Modes d'affichage",
    description: "Aperçu pour une vue rapide, Données pour un tableau complet, ou Avancé (Pro) pour des graphiques et métriques approfondies.",
    position: "bottom",
  },
];

const PRODUCTS_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "product-type-selector",
    target: "[data-tutorial='product-type-selector']",
    title: "Choisissez un type",
    description: "Sélectionnez le type de produit pour filtrer les résultats (ETB, Display, etc.).",
    position: "bottom",
  },
  {
    id: "product-type-summary",
    target: "[data-tutorial='product-type-summary']",
    title: "Résumé du type",
    description: "Retrouvez le nombre de produits, le prix moyen et la variation 7 jours.",
    position: "bottom",
  },
  {
    id: "product-bloc-selector",
    target: "[data-tutorial='product-bloc-selector']",
    title: "Blocs / séries",
    description: "Faites défiler pour changer de bloc et explorer les séries.",
    position: "bottom",
  },
  {
    id: "product-items",
    target: "[data-tutorial='product-items']",
    title: "Liste des produits",
    description: "Découvrez les items disponibles pour le bloc sélectionné.",
    position: "top",
  },
];
import { ProWidget, ProBadge } from "@/components/analyse/ProWidget";
import {
  MarketSentimentWidget,
  VolatilityGaugeWidget,
  SignalsWidget,
  RiskReturnScatter
} from "@/components/analyse/widgets";
import { MarketSentimentWidgetPreview, RiskReturnScatterPreview, SignalsWidgetPreview, VolatilityGaugeWidgetPreview } from "@/components/analyse/widgets/ProPreviews";

export default function AnalysePage() {
  const { items, loading, fromCache, refresh } = useAnalyseItems();
  const { user, isPro, loading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<"overview" | "products">("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [proBannerDismissed, setProBannerDismissed] = useState(false);
  const { startTutorial, hasCompleted } = useTutorial();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "products") {
      setActiveSection("products");
    }
  }, []);

  // Lancer le tutoriel au premier visit (après chargement des données)
  useEffect(() => {
    if (loading) return;
    const isProducts = activeSection === "products";
    const key = isProducts ? "analyse-products" : "analyse";
    if (hasCompleted(key)) return;

    const timer = setTimeout(() => {
      startTutorial(isProducts ? PRODUCTS_TUTORIAL_STEPS : ANALYSE_TUTORIAL_STEPS, key);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading, hasCompleted, startTutorial, activeSection]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const { series } = useSeriesFinance(items, "all");

  // Loading state avec design premium
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-6">
          {/* Animated logo/spinner */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-2xl border-2 border-primary/30 animate-ping" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">Chargement des données</p>
            <p className="text-sm text-muted-foreground">Analyse du marché en cours...</p>
          </div>
        </div>
      </div>
    );
  }

  // Stats calculées
  const statsUp = series.filter((s) => s.trend7d === "up").length;
  const statsDown = series.filter((s) => s.trend7d === "down").length;
  const statsStable = series.filter((s) => s.trend7d === "stable").length;

  return (
    <>
      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.pokeindex.fr" },
              { "@type": "ListItem", position: 2, name: "Analyse du marché" },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Pokéindex Analyse",
            applicationCategory: "FinanceApplication",
            operatingSystem: "Web",
            description: "Outil d'analyse du marché Pokémon scellé avec tendances, volatilité et sentiment en temps réel",
            url: "https://www.pokeindex.fr/analyse",
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
            featureList: [
              "Tendances du marché en temps réel",
              "Indicateur de volatilité",
              "Analyse de sentiment",
              "Top movers (hausses/baisses)",
              "Graphiques interactifs",
            ],
          }),
        }}
      />
    <div className="min-h-screen bg-background">
      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION - Premium, minimaliste, impact immédiat
          Applique: Z-pattern, Fitts's Law (large touch targets)
      ═══════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden border-b border-border/50">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/3" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Title & Description */}
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                    Analyse du Marché
                  </h1>
                  {fromCache ? (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      Cache
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      Live
                    </span>
                  )}
                  <button
                    onClick={handleRefresh}
                    disabled={refreshing || loading}
                    className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    title="Rafraîchir les données"
                  >
                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${refreshing ? "animate-spin" : ""}`} />
                  </button>
                  <TutorialHelpButton
                    steps={activeSection === "products" ? PRODUCTS_TUTORIAL_STEPS : ANALYSE_TUTORIAL_STEPS}
                    tutorialKey={activeSection === "products" ? "analyse-products" : "analyse"}
                    label="Guide"
                    className="hidden sm:inline-flex"
                  />
                </div>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Suivez l'évolution du marché français des produits scellés Pokémon
                avec des indicateurs clairs et des données actualisées.
              </p>
            </div>

            {/* Quick Stats Pills - Scannable at a glance (Hick's Law) */}
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-[10px] text-muted-foreground">Sur 7 jours</span>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-success/10 border border-success/20">
                  <TrendingUp className="w-4 h-4 text-success" />
                  <span className="text-sm font-semibold text-success">{statsUp}</span>
                  <span className="text-xs text-success/70 hidden sm:inline">hausse</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-destructive/10 border border-destructive/20">
                  <TrendingDown className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-destructive">{statsDown}</span>
                  <span className="text-xs text-destructive/70 hidden sm:inline">baisse</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted border border-border">
                  <Minus className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground">{statsStable}</span>
                  <span className="text-xs text-muted-foreground/70 hidden sm:inline">stable</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          BANNER PRO - Upsell pour les utilisateurs Free
      ═══════════════════════════════════════════════════════════ */}
      {!authLoading && user && !isPro && !proBannerDismissed && (
        <div className="relative bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 border-b border-primary/20">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 p-1.5 rounded-lg bg-primary/20">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm text-foreground truncate">
                  <span className="font-medium">Plan Gratuit</span>
                  <span className="hidden sm:inline text-muted-foreground"> · Historique 7 jours · 4 widgets masqués</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href="/pricing"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Débloquer Pro</span>
                  <span className="sm:hidden">Pro</span>
                </Link>
                <button
                  onClick={() => setProBannerDismissed(true)}
                  className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          NAVIGATION - Sticky, simple, 2 options max (Hick's Law)
      ═══════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2" data-tutorial="navigation">
            <button
              onClick={() => setActiveSection("overview")}
              className={`
                group flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                transition-all duration-200
                ${activeSection === "overview"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }
              `}
            >
              <PieChart className="w-4 h-4" />
              <span>Vue d'ensemble</span>
            </button>
            <button
              onClick={() => setActiveSection("products")}
              className={`
                group flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                transition-all duration-200
                ${activeSection === "products"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }
              `}
            >
              <Layers className="w-4 h-4" />
              <span>Produits</span>
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════════════════════ */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ─────────────────────────────────────────────────────────
            SECTION: VUE D'ENSEMBLE
            Progressive disclosure: ISP d'abord, puis détails
        ───────────────────────────────────────────────────────── */}
        {activeSection === "overview" && (
          <div className="space-y-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">

            {/* ISP Index - Hero metric (Visual weight = most important) */}
            <section data-tutorial="isp-index">
              <ISPIndexCard items={items} onForceRefresh={refresh} />
            </section>

            {/* Top Movers - Accroche visuelle */}
            <section className="space-y-4" data-tutorial="top-movers">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Mouvements de la semaine</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Séries avec les plus fortes variations</p>
              </div>
              <TopMovers series={series} metric="return7d" limit={3} />
            </section>

            {/* Indicateurs Pro - Widgets avancés */}
            <section className="space-y-4" data-tutorial="pro-widgets">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-foreground">Indicateurs avancés</h2>
                <ProBadge />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sentiment de marché, volatilité, signaux et analyse risque/rendement
              </p>

              {/* Widget Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
                {/* Sentiment */}
                <ProWidget
                  title="Sentiment du Marché"
                  className="h-full"
                  preview={<MarketSentimentWidgetPreview className="h-full" />}
                >
                  <MarketSentimentWidget series={series} className="h-full" />
                </ProWidget>

                {/* Volatility Gauge */}
                <ProWidget
                  title="Volatilité du Marché"
                  className="h-full"
                  preview={<VolatilityGaugeWidgetPreview className="h-full" />}
                >
                  <VolatilityGaugeWidget series={series} className="h-full" />
                </ProWidget>

                {/* Signals Widget - Spans 2 columns on large screens */}
                <div className="lg:col-span-2 h-full">
                  <ProWidget
                    title="Signaux Actifs"
                    className="h-full"
                    preview={<SignalsWidgetPreview className="h-full" />}
                  >
                    <SignalsWidget series={series} className="h-full" />
                  </ProWidget>
                </div>
                </div>

                {/* Risk/Return Scatter - Full width */}
                <ProWidget
                  title="Graphique Risque / Rendement"
                  preview={<RiskReturnScatterPreview />}
                >
                  <RiskReturnScatter series={series} />
                </ProWidget>

            </section>

            {/* Analyse des séries - Composant unifié */}
            <section className="space-y-4" data-tutorial="series-analytics">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Analyse des séries</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Performance, données et métriques avancées</p>
              </div>
              <SeriesAnalytics items={items} />
            </section>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────
            SECTION: PRODUITS
        ───────────────────────────────────────────────────────── */}
        {activeSection === "products" && (
          <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground">Détail des produits</h2>
              <p className="text-muted-foreground">
                Visualisez les prix et l'évolution des différents types de produits scellés par série.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <AnalyseTabs items={items} />
            </div>
          </div>
        )}
      </main>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER CTA - Encourage exploration
      ═══════════════════════════════════════════════════════════ */}
      {activeSection === "overview" && (
        <div className="border-t border-border/50 bg-muted/30">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => setActiveSection("products")}
              className="
                group w-full sm:w-auto flex items-center justify-center gap-3
                px-6 py-3 rounded-xl
                bg-card border border-border hover:border-primary/50
                text-foreground font-medium
                transition-all duration-200
                hover:shadow-lg hover:shadow-primary/5
              "
            >
              <Layers className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Explorer les produits en détail</span>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
