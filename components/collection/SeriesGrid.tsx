"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import type { CollectionCardWithPrice } from "@/types/collection";
import {
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Layers,
  X,
} from "lucide-react";

type SeriesData = {
  setName: string;
  setImage?: string | null;
  cards: CollectionCardWithPrice[];
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
};

type SeriesGridProps = {
  groupedCards: { setName: string; cards: CollectionCardWithPrice[] }[];
  setLogosByName: Record<string, string>;
  onEditCard?: (card: CollectionCardWithPrice) => void;
  onDeleteCard?: (card: CollectionCardWithPrice) => void;
};

export function SeriesGrid({
  groupedCards,
  setLogosByName,
  onEditCard,
  onDeleteCard,
}: SeriesGridProps) {
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);
  const expandedRef = useRef<HTMLDivElement>(null);

  // Scroll to expanded section when a series is clicked
  useEffect(() => {
    if (expandedSeries && expandedRef.current) {
      // Small delay to let the animation start
      setTimeout(() => {
        expandedRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [expandedSeries]);

  // Calculate series data with values
  const seriesData = useMemo((): SeriesData[] => {
    return groupedCards.map(({ setName, cards }) => {
      let totalValue = 0;
      let totalCost = 0;

      for (const card of cards) {
        if (card.currentValue !== null) {
          totalValue += card.currentValue;
        }
        const costBasis =
          card.purchase?.totalCost && card.purchase.totalCost > 0
            ? card.purchase.totalCost
            : card.purchase?.price && card.purchase.price > 0
              ? card.purchase.price * card.quantity
              : card.priceAtPurchase && card.priceAtPurchase > 0
                ? card.priceAtPurchase * card.quantity
                : 0;
        totalCost += costBasis;
      }

      const profitLoss = totalCost > 0 ? totalValue - totalCost : 0;
      const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

      return {
        setName,
        setImage: setLogosByName[setName] ?? null,
        cards,
        totalValue,
        totalCost,
        profitLoss,
        profitLossPercent,
      };
    });
  }, [groupedCards, setLogosByName]);

  const totalCards = useMemo(
    () => seriesData.reduce((sum, s) => sum + s.cards.length, 0),
    [seriesData]
  );

  const gridVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1 },
  };

  const handleToggle = (setName: string) => {
    setExpandedSeries((prev) => (prev === setName ? null : setName));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/5 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-semibold">Galerie des séries</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Explore tes cartes par extension avec une vue immersive.
            </p>
          </div>
          <Badge variant="secondary" className="text-[10px] sm:text-xs">
            {seriesData.length} séries • {totalCards} cartes
          </Badge>
        </div>

        <motion.div
          variants={gridVariants}
          initial="hidden"
          animate="show"
          className="mt-4 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        >
          {seriesData.map((series) => (
            <motion.button
              key={series.setName}
              variants={itemVariants}
              onClick={() => handleToggle(series.setName)}
              className={cn(
                "group relative flex h-full flex-col rounded-2xl border p-3 text-left transition-all duration-300",
                "bg-card/80 hover:bg-card shadow-sm",
                expandedSeries === series.setName
                  ? "border-primary/60 ring-2 ring-primary/20 shadow-lg shadow-primary/10"
                  : "border-border/60 hover:border-primary/40 hover:shadow-md"
              )}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-center overflow-hidden">
                    {series.setImage ? (
                      <Image
                        src={series.setImage}
                        alt={series.setName}
                        fill
                        sizes="40px"
                        className="object-contain"
                      />
                    ) : (
                      <Layers className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold leading-tight line-clamp-2">
                      {series.setName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {series.cards.length} carte{series.cards.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-300",
                    expandedSeries === series.setName && "rotate-180 text-primary"
                  )}
                />
              </div>

              <div className="relative z-10 mt-3 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {series.cards.slice(0, 3).map((card) => (
                    <div
                      key={card.cardId}
                      className="relative h-10 w-7 rounded-md border border-border/60 bg-muted/50 overflow-hidden"
                    >
                      {card.cardImage ? (
                        <Image
                          src={card.cardImage}
                          alt={card.cardName}
                          fill
                          sizes="28px"
                          className="object-contain"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
                {series.cards.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{series.cards.length - 3}
                  </span>
                )}
              </div>

              <div className="relative z-10 mt-3 grid grid-cols-2 gap-2 text-[10px]">
                <div className="space-y-0.5">
                  <p className="text-muted-foreground">Valeur</p>
                  <p className="font-semibold text-primary tabular-nums">
                    {series.totalValue.toFixed(0)} €
                  </p>
                </div>
                <div className="space-y-0.5 text-right">
                  <p className="text-muted-foreground">ROI</p>
                  <p className={cn("font-semibold tabular-nums", series.profitLoss >= 0 ? "text-success" : "text-destructive")}>
                    {series.totalCost > 0 ? `${series.profitLossPercent.toFixed(0)}%` : "—"}
                  </p>
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Expanded Cards View */}
      <AnimatePresence>
        {expandedSeries && (
          <motion.div
            ref={expandedRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden scroll-mt-20"
          >
            <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 shadow-lg shadow-primary/5">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  {setLogosByName[expandedSeries] ? (
                    <img
                      src={setLogosByName[expandedSeries]}
                      alt={expandedSeries}
                      className="h-9 w-auto object-contain"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-muted/50 border border-border/60 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{expandedSeries}</h3>
                    <p className="text-xs text-muted-foreground">
                      {seriesData.find((s) => s.setName === expandedSeries)?.cards.length} cartes •
                      {" "}
                      {seriesData.find((s) => s.setName === expandedSeries)?.totalValue.toFixed(0)} €
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setExpandedSeries(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Cards Grid - Motion Gallery */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {seriesData
                  .find((s) => s.setName === expandedSeries)
                  ?.cards.map((card, cardIndex) => (
                    <CardTile
                      key={card.cardId}
                      card={card}
                      index={cardIndex}
                      onEdit={onEditCard}
                      onDelete={onDeleteCard}
                    />
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Individual Card Tile Component
function CardTile({
  card,
  index,
  onEdit,
  onDelete,
}: {
  card: CollectionCardWithPrice;
  index: number;
  onEdit?: (card: CollectionCardWithPrice) => void;
  onDelete?: (card: CollectionCardWithPrice) => void;
}) {
  const hasProfitLoss =
    card.purchase?.totalCost ||
    card.purchase?.price ||
    (card.priceAtPurchase && card.priceAtPurchase > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group relative"
    >
      <div
        className={cn(
          "relative aspect-[2.5/3.5] rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer",
          "bg-gradient-to-br from-muted/60 via-muted/40 to-muted/30",
          "border-border/60",
          "group-hover:border-primary/60 group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:-translate-y-1 group-hover:z-10"
        )}
      >
        {/* Card Image */}
        {card.cardImage ? (
          <Image
            src={card.cardImage}
            alt={card.cardName}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
            className="object-contain p-1.5"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            N/A
          </div>
        )}

        {/* Gloss */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/15 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Quantity Badge */}
        {card.quantity > 1 && (
          <div className="absolute top-1 right-1">
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0 font-bold shadow-sm"
            >
              x{card.quantity}
            </Badge>
          </div>
        )}

        {/* Profit/Loss Badge */}
        {hasProfitLoss && card.profitLoss !== null && (
          <div
            className={cn(
              "absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold backdrop-blur",
              card.profitLoss >= 0
                ? "bg-success/90 text-success-foreground"
                : "bg-destructive/90 text-destructive-foreground"
            )}
          >
            {card.profitLoss >= 0 ? (
              <TrendingUp className="w-2 h-2" />
            ) : (
              <TrendingDown className="w-2 h-2" />
            )}
            {card.profitLossPercent !== null
              ? `${card.profitLossPercent >= 0 ? "+" : ""}${card.profitLossPercent.toFixed(0)}%`
              : ""}
          </div>
        )}

        {/* Action Rail */}
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
          {card.cardmarketUrl && (
            <a
              href={card.cardmarketUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center rounded-md bg-black/70 text-white/90 p-1.5 backdrop-blur-sm transition hover:bg-black/90"
              aria-label="Ouvrir sur Cardmarket"
            >
              <Icons.external className="w-3 h-3" />
            </a>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(card);
              }}
              className="inline-flex items-center justify-center rounded-md bg-black/70 text-white/90 p-1.5 backdrop-blur-sm transition hover:bg-black/90"
              aria-label="Modifier la carte"
            >
              <Icons.edit className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(card);
              }}
              className="inline-flex items-center justify-center rounded-md bg-destructive/80 text-white p-1.5 backdrop-blur-sm transition hover:bg-destructive"
              aria-label="Supprimer la carte"
            >
              <Icons.delete className="w-3 h-3" />
            </button>
          )}
        </div>

      </div>

      <div className="mt-2 space-y-0.5 text-center">
        <p className="text-[10px] font-semibold truncate">{card.cardName}</p>
        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <span className="tabular-nums">
            {card.currentPrice !== null ? `${card.currentPrice.toFixed(2)} €` : "Prix indispo"}
          </span>
          {card.cardNumber && <span>· #{card.cardNumber}</span>}
        </div>
        {card.cardmarketUrl && (
          <a
            href={card.cardmarketUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center gap-1 text-[9px] text-primary hover:text-primary/80 transition"
          >
            <Icons.external className="w-3 h-3" />
            Cardmarket
          </a>
        )}
      </div>
    </motion.div>
  );
}
