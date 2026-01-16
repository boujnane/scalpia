"use client";

import { useEffect, useState } from "react";
import { Item } from "@/lib/analyse/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnalyseTabs from "@/components/analyse/AnalyseTabs";
import ISPIndexCard from "@/components/analyse/ISPIndexCard";
import TopMovers from "@/components/analyse/TopMovers";
import SeriesAnalytics from "@/components/analyse/SeriesAnalytics";
import { useSeriesFinance } from "@/hooks/useSeriesFinance";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Layers,
  PieChart,
  ArrowRight,
  Sparkles
} from "lucide-react";

export default function AnalysePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<"overview" | "products">("overview");

  useEffect(() => {
    async function fetchItems() {
      const querySnapshot = await getDocs(collection(db, "items"));
      const fetchedItems: Item[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as Omit<Item, "prices">;
        const pricesSnap = await getDocs(collection(db, `items/${docSnap.id}/prices`));
        const prices = pricesSnap.docs.map(p => p.data() as { date: string; price: number });
        fetchedItems.push({ ...data, prices });
      }

      setItems(fetchedItems);
      setLoading(false);
    }

    fetchItems();
  }, []);

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
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    Live
                  </span>
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
          NAVIGATION - Sticky, simple, 2 options max (Hick's Law)
      ═══════════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 py-2">
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
            <section>
              <ISPIndexCard items={items} />
            </section>

            {/* Top Movers - Accroche visuelle */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Mouvements de la semaine</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Séries avec les plus fortes variations</p>
              </div>
              <TopMovers series={series} metric="return7d" limit={3} />
            </section>

            {/* Analyse des séries - Composant unifié */}
            <section className="space-y-4">
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
  );
}
