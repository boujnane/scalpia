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

  const handleToggle = (setName: string) => {
    setExpandedSeries((prev) => (prev === setName ? null : setName));
  };

  return (
    <div className="space-y-6">
      {/* Series Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {seriesData.map((series, index) => (
          <motion.button
            key={series.setName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            onClick={() => handleToggle(series.setName)}
            className={cn(
              "group relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-300",
              "bg-card hover:bg-card/80",
              expandedSeries === series.setName
                ? "border-primary ring-2 ring-primary/20 shadow-lg shadow-primary/10"
                : "border-border hover:border-primary/40 hover:shadow-md"
            )}
          >
            {/* Series Logo */}
            <div className="relative w-16 h-16 mb-3 flex items-center justify-center">
              {series.setImage ? (
                <Image
                  src={series.setImage}
                  alt={series.setName}
                  fill
                  sizes="64px"
                  className="object-contain group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>

            {/* Series Name */}
            <h4 className="text-xs font-semibold text-center line-clamp-2 mb-2 group-hover:text-primary transition-colors">
              {series.setName}
            </h4>

            {/* Card Count */}
            <Badge
              variant="secondary"
              className="mb-2 text-[10px] px-2 py-0.5"
            >
              {series.cards.length} carte{series.cards.length > 1 ? "s" : ""}
            </Badge>

            {/* Value */}
            <p className="text-sm font-bold text-primary tabular-nums">
              {series.totalValue.toFixed(0)} €
            </p>

            {/* Profit/Loss indicator */}
            {series.totalCost > 0 && (
              <div
                className={cn(
                  "flex items-center gap-0.5 text-[10px] font-semibold mt-1",
                  series.profitLoss >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {series.profitLoss >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {series.profitLoss >= 0 ? "+" : ""}
                {series.profitLossPercent.toFixed(0)}%
              </div>
            )}

            {/* Expand indicator */}
            <ChevronDown
              className={cn(
                "absolute bottom-2 right-2 w-4 h-4 text-muted-foreground transition-transform duration-300",
                expandedSeries === series.setName && "rotate-180 text-primary"
              )}
            />
          </motion.button>
        ))}
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
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {setLogosByName[expandedSeries] && (
                    <img
                      src={setLogosByName[expandedSeries]}
                      alt={expandedSeries}
                      className="h-8 w-auto object-contain"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{expandedSeries}</h3>
                    <p className="text-sm text-muted-foreground">
                      {seriesData.find((s) => s.setName === expandedSeries)?.cards.length} cartes
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

              {/* Cards Grid - Binder Style */}
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
  const [isHovered, setIsHovered] = useState(false);

  const hasProfitLoss =
    card.purchase?.totalCost ||
    card.purchase?.price ||
    (card.priceAtPurchase && card.priceAtPurchase > 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02, duration: 0.2 }}
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "relative aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer",
          "bg-gradient-to-br from-muted/50 to-muted/30",
          isHovered
            ? "border-primary shadow-xl shadow-primary/20 -translate-y-2 scale-105 z-10"
            : "border-border/60"
        )}
      >
        {/* Card Image */}
        {card.cardImage ? (
          <Image
            src={card.cardImage}
            alt={card.cardName}
            fill
            sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
            className="object-contain p-1"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            N/A
          </div>
        )}

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
              "absolute top-1 left-1 flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold",
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

        {/* Hover Overlay */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-2"
            >
              <p className="text-white text-[10px] font-semibold line-clamp-1">
                {card.cardName}
              </p>
              {card.cardNumber && (
                <p className="text-white/70 text-[8px]">#{card.cardNumber}</p>
              )}
              <p className="text-primary-foreground text-xs font-bold mt-1">
                {card.currentPrice !== null
                  ? `${card.currentPrice.toFixed(2)} €`
                  : "N/A"}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-1 mt-2">
                {onEdit && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 px-2 text-[10px] flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(card);
                    }}
                  >
                    <Icons.edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(card);
                    }}
                  >
                    <Icons.delete className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Card Name below (visible when not hovered) */}
      <div
        className={cn(
          "mt-1.5 text-center transition-opacity duration-200",
          isHovered && "opacity-0"
        )}
      >
        <p className="text-[10px] font-medium truncate">{card.cardName}</p>
        <p className="text-[9px] text-muted-foreground tabular-nums">
          {card.currentPrice !== null ? `${card.currentPrice.toFixed(2)} €` : "—"}
        </p>
      </div>
    </motion.div>
  );
}
