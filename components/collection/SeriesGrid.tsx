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

      let hasPurchaseData = false;

      for (const card of cards) {
        if (card.currentValue !== null) {
          totalValue += card.currentValue;
        }
        // Check if we have any purchase data (including 0€)
        const hasTotalCost = card.purchase?.totalCost !== undefined && card.purchase.totalCost !== null;
        const hasPrice = card.purchase?.price !== undefined && card.purchase.price !== null;
        const hasPriceAtPurchase = card.priceAtPurchase !== undefined && card.priceAtPurchase !== null;

        if (hasTotalCost || hasPrice || hasPriceAtPurchase) {
          hasPurchaseData = true;
        }

        const costBasis =
          hasTotalCost
            ? card.purchase!.totalCost!
            : hasPrice
              ? card.purchase!.price! * card.quantity
              : hasPriceAtPurchase
                ? card.priceAtPurchase! * card.quantity
                : 0;
        totalCost += costBasis;
      }

      // Calculate profit/loss only if we have purchase data (even if cost is 0€)
      const profitLoss = hasPurchaseData ? totalValue - totalCost : 0;
      const profitLossPercent = hasPurchaseData && totalCost > 0 ? (profitLoss / totalCost) * 100 : (hasPurchaseData && totalCost === 0 && totalValue > 0 ? 100 : 0);

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

// Individual Card Tile Component - Elegant & Subtle
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
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const hasProfitLoss =
    card.purchase?.totalCost !== undefined ||
    card.purchase?.price !== undefined ||
    (card.priceAtPurchase !== undefined && card.priceAtPurchase !== null);

  // Subtle tilt effect (max 4 degrees - barely noticeable but feels premium)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const tiltX = ((y - centerY) / centerY) * -4;
    const tiltY = ((x - centerX) / centerX) * 4;

    setTilt({ x: tiltX, y: tiltY });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  // Long press for mobile
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
      if (navigator.vibrate) navigator.vibrate(30);
    }, 400);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const actionItems = [
    card.cardmarketUrl && {
      type: "link" as const,
      href: card.cardmarketUrl,
      icon: <Icons.external className="w-3 h-3" />,
      label: "Cardmarket",
    },
    onEdit && {
      type: "button" as const,
      onClick: () => onEdit(card),
      icon: <Icons.edit className="w-3 h-3" />,
      label: "Modifier",
    },
    onDelete && {
      type: "button" as const,
      onClick: () => onDelete(card),
      icon: <Icons.delete className="w-3 h-3" />,
      label: "Supprimer",
      variant: "destructive" as const,
    },
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.02,
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="group relative"
      style={{ perspective: "800px" }}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "relative aspect-[2.5/3.5] rounded-xl overflow-hidden cursor-pointer",
          "bg-muted/40",
          "border border-border/50",
          "transition-all duration-300 ease-out",
          isHovered && "shadow-lg shadow-black/8 -translate-y-1 border-border"
        )}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Card Image */}
        <div className="absolute inset-0">
          {card.cardImage ? (
            <Image
              src={card.cardImage}
              alt={card.cardName}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw"
              className={cn(
                "object-contain p-1.5 transition-transform duration-500 ease-out",
                isHovered && "scale-[1.03]"
              )}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs">
              N/A
            </div>
          )}
        </div>

        {/* Subtle light reflection - very faint */}
        <div
          className={cn(
            "absolute inset-0 pointer-events-none transition-opacity duration-500",
            isHovered ? "opacity-100" : "opacity-0"
          )}
          style={{
            backgroundImage: `linear-gradient(
              135deg,
              rgba(255,255,255,0.08) 0%,
              transparent 50%
            )`,
          }}
        />

        {/* Quantity Badge - clean & minimal */}
        {card.quantity > 1 && (
          <div className="absolute bottom-1.5 right-1.5 z-20">
            <Badge
              variant="secondary"
              className="text-[9px] px-1.5 py-0.5 font-semibold bg-background/95 backdrop-blur-sm border-border/80 shadow-sm"
            >
              x{card.quantity}
            </Badge>
          </div>
        )}

        {/* Profit/Loss Badge - subtle colors */}
        {hasProfitLoss && card.profitLoss !== null && (
          <div className="absolute top-1.5 left-1.5 z-20">
            <div
              className={cn(
                "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] font-semibold",
                "backdrop-blur-sm border shadow-sm",
                card.profitLoss >= 0
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              )}
            >
              {card.profitLoss >= 0 ? (
                <TrendingUp className="w-2.5 h-2.5" />
              ) : (
                <TrendingDown className="w-2.5 h-2.5" />
              )}
              <span>
                {card.profitLossPercent !== null
                  ? `${card.profitLossPercent >= 0 ? "+" : ""}${card.profitLossPercent.toFixed(0)}%`
                  : ""}
              </span>
            </div>
          </div>
        )}

        {/* Action buttons - appear on hover with elegant fade */}
        <AnimatePresence>
          {(isHovered || showActions) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute top-1.5 right-1.5 flex flex-col gap-1 z-30"
            >
              {actionItems.map((action, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.03, duration: 0.15 }}
                >
                  {action && action.type === "link" ? (
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center rounded-md p-1.5 bg-background/90 backdrop-blur-sm border border-border/60 text-foreground/70 hover:text-foreground hover:bg-background transition-colors duration-150"
                      aria-label={action.label}
                    >
                      {action.icon}
                    </a>
                  ) : action ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick?.();
                      }}
                      className={cn(
                        "inline-flex items-center justify-center rounded-md p-1.5 backdrop-blur-sm border transition-colors duration-150",
                        action.variant === "destructive"
                          ? "bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20"
                          : "bg-background/90 border-border/60 text-foreground/70 hover:text-foreground hover:bg-background"
                      )}
                      aria-label={action.label}
                    >
                      {action.icon}
                    </button>
                  ) : null}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Card Info Footer - clean typography */}
      <div className="mt-2 space-y-0.5 text-center">
        <p
          className="text-[10px] font-medium text-foreground/90 truncate px-0.5"
          title={card.cardName}
        >
          {card.cardName}
        </p>
        <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <span className="tabular-nums font-medium">
            {card.currentPrice !== null
              ? `${card.currentPrice.toFixed(2)} €`
              : "—"}
          </span>
          {card.cardNumber && (
            <>
              <span className="text-border">·</span>
              <span>#{card.cardNumber}</span>
            </>
          )}
        </div>
        {/* Prix d'achat */}
        {(card.purchase?.price !== undefined || (card.priceAtPurchase !== undefined && card.priceAtPurchase !== null)) && (
          <div className="text-[9px] text-muted-foreground/70">
            Achat : <span className="tabular-nums">
              {(card.purchase?.price !== undefined ? card.purchase.price : card.priceAtPurchase)?.toFixed(2)} €
            </span>
          </div>
        )}
      </div>

      {/* Mobile action overlay */}
      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setShowActions(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
