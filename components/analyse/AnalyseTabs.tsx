"use client";

import { useMemo, useState } from "react";
import BlocTabs from "@/components/analyse/BlocTabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/lib/utils";
import type { Item } from "@/lib/analyse/types";
import { Badge } from "@/components/ui/badge";
import {
  Box,
  Package,
  Layers,
  Grid3X3,
  Crown,
  Palette,
  Gift,
  Image as ImageIcon,
  TrendingUp,
  TrendingDown,
  Minus,
  Euro,
  type LucideIcon,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   Type Icons & Colors Mapping
═══════════════════════════════════════════════════════════ */
const TYPE_CONFIG: Record<string, { icon: LucideIcon; color: string; bgColor: string; description: string }> = {
  ETB: {
    icon: Box,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
    description: "Elite Trainer Box - Coffret Dresseur d'Elite",
  },
  Display: {
    icon: Grid3X3,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
    description: "36 boosters",
  },
  "Demi-Display": {
    icon: Layers,
    color: "text-indigo-600 dark:text-indigo-400",
    bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
    description: "18 boosters",
  },
  "Tri-Pack": {
    icon: Package,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-100 dark:bg-teal-900/30",
    description: "3 boosters + promo",
  },
  UPC: {
    icon: Crown,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
    description: "Ultra Premium",
  },
  Artset: {
    icon: Palette,
    color: "text-pink-600 dark:text-pink-400",
    bgColor: "bg-pink-100 dark:bg-pink-900/30",
    description: "4 (ou 5) Illustrations blister",
  },
  Bundle: {
    icon: Gift,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    description: "Pack découverte",
  },
  "Coffret Collection Poster": {
    icon: ImageIcon,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-100 dark:bg-rose-900/30",
    description: "Poster + boosters",
  },
  Coffret: {
    icon: Box,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-900/30",
    description: "Coffret thématique",
  },
  Pokébox: {
    icon: Gift,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-100 dark:bg-red-900/30",
    description: "Pokébox avec carte promo",
  },
};

/* ═══════════════════════════════════════════════════════════
   Helper: Calculate Type Stats
═══════════════════════════════════════════════════════════ */
interface TypeStats {
  avgPrice: number | null;
  avgReturn7d: number | null;
  count: number;
}

function calculateTypeStats(items: Item[]): TypeStats {
  if (items.length === 0) return { avgPrice: null, avgReturn7d: null, count: 0 };

  const prices: number[] = [];
  const returns: number[] = [];

  for (const item of items) {
    if (item.prices && item.prices.length > 0) {
      const sorted = [...item.prices].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestPrice = sorted[0]?.price;
      if (latestPrice != null) prices.push(latestPrice);

      // Calculate 7d return if we have enough data
      if (sorted.length > 1) {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oldPrice = sorted.find((p) => new Date(p.date) <= weekAgo);
        if (oldPrice && latestPrice) {
          const ret = (latestPrice - oldPrice.price) / oldPrice.price;
          returns.push(ret);
        }
      }
    }
  }

  return {
    avgPrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : null,
    avgReturn7d: returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : null,
    count: items.length,
  };
}

export default function AnalyseTabs({ items }: { items: Item[] }) {
  // Breakpoint à 768px pour inclure tablettes
  const isMobile = useIsMobile(768);

  const types = useMemo(
    () => [
      "ETB",
      "Display",
      "Demi-Display",
      "Tri-Pack",
      "UPC",
      "Artset",
      "Bundle",
      "Coffret Collection Poster",
      "Coffret",
      "Pokébox",
    ],
    []
  );

  // Indexation par type (perf)
  const itemsByType = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const t of types) map[t] = [];
    for (const it of items) {
      if (!it?.type) continue;
      if (!map[it.type]) map[it.type] = [];
      map[it.type].push(it);
    }
    return map;
  }, [items, types]);

  const tabs = useMemo(() => {
    return types.map((t) => {
      const data = itemsByType[t] ?? [];
      const stats = calculateTypeStats(data);
      const config = TYPE_CONFIG[t] ?? {
        icon: Package,
        color: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-100 dark:bg-gray-900/30",
        description: "",
      };
      return {
        label: t,
        data,
        count: data.length,
        stats,
        config,
      };
    });
  }, [itemsByType, types]);

  const defaultTab = useMemo(() => {
    const firstNonEmpty = tabs.find((t) => t.count > 0);
    return (firstNonEmpty ?? tabs[0])?.label;
  }, [tabs]);

  const [selectedType, setSelectedType] = useState(defaultTab);

  const selectedTab = useMemo(() => {
    return tabs.find((t) => t.label === selectedType) ?? tabs[0];
  }, [tabs, selectedType]);

  // Helper pour formater les prix
  const formatPrice = (price: number | null) => {
    if (price == null) return "—";
    return `${price.toFixed(0)}€`;
  };

  // Helper pour formater les pourcentages
  const formatPercent = (value: number | null) => {
    if (value == null) return "—";
    const formatted = (value * 100).toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  // Version mobile avec Select dropdown
  if (isMobile) {
    return (
      <div className="space-y-4 w-full">
        {/* Select dropdown pour choisir le type */}
        <div data-tutorial="product-type-selector">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full h-14 bg-background border-border">
            <div className="flex items-center gap-3 w-full">
              {(() => {
                const Icon = selectedTab.config.icon;
                return (
                  <div className={`p-2 rounded-lg ${selectedTab.config.bgColor}`}>
                    <Icon className={`w-4 h-4 ${selectedTab.config.color}`} />
                  </div>
                );
              })()}
              <div className="flex-1 text-left">
                <p className="font-medium">{selectedTab.label}</p>
                <p className="text-xs text-muted-foreground">{selectedTab.config.description}</p>
              </div>
            </div>
            </SelectTrigger>
            <SelectContent className="min-w-[320px]">
            {tabs.map((tab) => {
              const Icon = tab.config.icon;
              return (
                <SelectItem key={tab.label} value={tab.label} className="py-3">
                  <div className="flex items-center gap-3 w-full">
                    <div className={`p-1.5 rounded-lg ${tab.config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${tab.config.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tab.label}</span>
                        <Badge variant="secondary" className="tabular-nums text-[10px] px-1.5">
                          {tab.count}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{tab.config.description}</p>
                    </div>
                    {tab.stats.avgReturn7d != null && (
                      <div className={`text-xs font-semibold ${
                        tab.stats.avgReturn7d > 0 ? "text-success" :
                        tab.stats.avgReturn7d < 0 ? "text-destructive" :
                        "text-muted-foreground"
                      }`}>
                        {formatPercent(tab.stats.avgReturn7d)}
                      </div>
                    )}
                  </div>
                </SelectItem>
              );
            })}
            </SelectContent>
          </Select>
        </div>

        {/* Mini stats pour le type sélectionné */}
        {selectedTab.count > 0 && (
          <div className="flex items-center justify-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/50" data-tutorial="product-type-summary">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{selectedTab.count}</p>
              <p className="text-[10px] text-muted-foreground">Produits</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{formatPrice(selectedTab.stats.avgPrice)}</p>
              <p className="text-[10px] text-muted-foreground">Prix moy.</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className={`text-lg font-bold ${
                (selectedTab.stats.avgReturn7d ?? 0) > 0 ? "text-success" :
                (selectedTab.stats.avgReturn7d ?? 0) < 0 ? "text-destructive" :
                "text-foreground"
              }`}>
                {formatPercent(selectedTab.stats.avgReturn7d)}
              </p>
              <p className="text-[10px] text-muted-foreground">Var. 7j</p>
            </div>
          </div>
        )}

        {/* Contenu du type sélectionné */}
        <div className="w-full" data-tutorial="product-blocs">
          {selectedTab.count > 0 ? (
            <BlocTabs items={selectedTab.data} />
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground rounded-xl bg-muted/30 border border-border/50">
              Aucun item pour ce type.
            </div>
          )}
        </div>
      </div>
    );
  }

  // Version desktop avec grille de types + contenu
  return (
    <div className="space-y-6">
      {/* Grille des types de produits */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pt-3 px-1" data-tutorial="product-type-selector">
        {tabs.map((tab) => {
          const Icon = tab.config.icon;
          const isSelected = selectedType === tab.label;

          return (
            <button
              key={tab.label}
              onClick={() => setSelectedType(tab.label)}
              className={`
                relative p-4 rounded-2xl border-2 transition-all duration-200 text-left
                ${isSelected
                  ? `${tab.config.bgColor} border-current shadow-lg scale-[1.02]`
                  : "bg-card border-border/50 hover:border-border hover:bg-muted/30"
                }
              `}
            >
              {/* Badge count */}
              <div className={`
                absolute -top-2 -right-2 min-w-[24px] h-6 px-2 rounded-full
                flex items-center justify-center text-xs font-bold
                ${isSelected
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground border border-border"
                }
              `}>
                {tab.count}
              </div>

              <div className="flex items-start gap-3">
                <div className={`
                  p-2.5 rounded-xl transition-all
                  ${isSelected ? "bg-background/50" : tab.config.bgColor}
                `}>
                  <Icon className={`w-5 h-5 ${tab.config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm truncate ${isSelected ? tab.config.color : "text-foreground"}`}>
                    {tab.label}
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                    {tab.config.description}
                  </p>
                </div>
              </div>

              {/* Mini stats */}
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/30">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Prix moy.</p>
                  <p className="font-bold text-sm tabular-nums">{formatPrice(tab.stats.avgPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">7 jours</p>
                  <p className={`font-bold text-sm tabular-nums ${
                    (tab.stats.avgReturn7d ?? 0) > 0 ? "text-success" :
                    (tab.stats.avgReturn7d ?? 0) < 0 ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    {formatPercent(tab.stats.avgReturn7d)}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Contenu du type sélectionné */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Header du type sélectionné */}
        <div className={`p-5 border-b border-border ${selectedTab.config.bgColor}`} data-tutorial="product-type-summary">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-background/60 backdrop-blur-sm">
              {(() => {
                const Icon = selectedTab.config.icon;
                return <Icon className={`w-7 h-7 ${selectedTab.config.color}`} />;
              })()}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{selectedTab.label}</h2>
              <p className="text-sm text-muted-foreground">{selectedTab.config.description}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{selectedTab.count}</p>
                <p className="text-xs text-muted-foreground">Produits</p>
              </div>
              <div className="w-px h-12 bg-border/50" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground tabular-nums">{formatPrice(selectedTab.stats.avgPrice)}</p>
                <p className="text-xs text-muted-foreground">Prix moyen</p>
              </div>
              <div className="w-px h-12 bg-border/50" />
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1.5 ${
                  (selectedTab.stats.avgReturn7d ?? 0) > 0 ? "text-success" :
                  (selectedTab.stats.avgReturn7d ?? 0) < 0 ? "text-destructive" :
                  "text-foreground"
                }`}>
                  {(selectedTab.stats.avgReturn7d ?? 0) > 0 && <TrendingUp className="w-6 h-6" />}
                  {(selectedTab.stats.avgReturn7d ?? 0) < 0 && <TrendingDown className="w-6 h-6" />}
                  {(selectedTab.stats.avgReturn7d == null || Math.abs(selectedTab.stats.avgReturn7d) < 0.001) && <Minus className="w-6 h-6" />}
                  <p className="text-3xl font-bold tabular-nums">{formatPercent(selectedTab.stats.avgReturn7d)}</p>
                </div>
                <p className="text-xs text-muted-foreground">Variation 7j</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="p-4" data-tutorial="product-blocs">
          {selectedTab.count > 0 ? (
            <BlocTabs items={selectedTab.data} />
          ) : (
            <div className="py-16 text-center">
              <div className={`mx-auto w-20 h-20 rounded-2xl ${selectedTab.config.bgColor} flex items-center justify-center mb-4`}>
                {(() => {
                  const Icon = selectedTab.config.icon;
                  return <Icon className={`w-10 h-10 ${selectedTab.config.color}`} />;
                })()}
              </div>
              <p className="text-lg font-medium text-muted-foreground">Aucun produit disponible</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Les données pour {selectedTab.label} seront affichées ici une fois disponibles.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
