"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Item } from "@/lib/analyse/types";
import { Badge } from "@/components/ui/badge";
import { getChartAnalysis } from "@/lib/analyse/getChartAnalysis"; 
import ItemModal from "./ItemModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Icons } from "@/components/icons";

export default function ItemCard({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);

  const analysis = useMemo(
    () => getChartAnalysis(item),
    [item]
  );
  
  const chartData = analysis.data;
  const lastPrice = analysis.lastPrice;
  const trend7d = analysis.trend7d;
  
  // Application des couleurs thématiques
  const trendColor = 
    trend7d === null || Math.abs(trend7d) <= 0.5 ? "text-muted-foreground" : 
    trend7d > 0.5 ? "text-success" : 
    "text-destructive";
  
  const TrendIcon = trend7d === null || Math.abs(trend7d) <= 0.5 ? Icons.minus : trend7d > 0.5 ? Icons.trendingUp : Icons.trendingDown;


  return (
    <>
      <div
        onClick={() => setOpen(true)}
        role="button"
        aria-label={`Ouvrir les détails de ${item.name}`}
        className="
          group border border-border rounded-2xl shadow-lg 
          bg-card overflow-hidden 
          hover:shadow-xl hover:border-primary/50 transition-all duration-300 
          cursor-pointer p-4 flex flex-col items-center
        "
      >
        {/* Image */}
        <div className="w-full h-36 sm:h-40 relative flex items-center justify-center bg-secondary/30 rounded-xl overflow-hidden mb-4 border border-border/50">
          {item.image && (
            <Image
              src={item.image}
              alt={item.name}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-contain hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>

        {/* Nom de l’item */}
        <span className="font-semibold text-lg sm:text-xl text-center text-foreground mb-2 line-clamp-2">
          {item.type} {item.name}
        </span>

        {/* Date */}
        <Badge variant="secondary" className="mb-4 text-muted-foreground">
          Date de sortie : {item.releaseDate}
        </Badge>

        {/* Bloc Dernier Prix */}
        {lastPrice !== null && (
          <div className="w-full flex flex-col items-center mt-auto p-4 sm:p-5 bg-muted/50 border border-border rounded-xl shadow-inner transition-shadow">
            {/* Titre avec icône */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              {/* Icône de prix : utilise primary */}
              <div className="p-2 sm:p-3 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Icons.linechart size={20} />
              </div>
              <span className="text-muted-foreground font-semibold text-sm sm:text-base uppercase tracking-wide">
                Dernière Évaluation
              </span>
            </div>

            {/* Prix avec tooltip */}
            <div className="flex flex-col items-center">
              <Tooltip delayDuration={150}>
                <TooltipTrigger asChild>
                  {/* Prix : utilise primary */}
                  <span className="text-primary font-extrabold text-3xl sm:text-4xl cursor-pointer">
                    {lastPrice.toFixed(2)} €
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm bg-popover border-border shadow-md">
                    <p className="text-muted-foreground">
                        Les données sont fournies à titre indicatif et ne constituent pas un conseil en investissement.
                    </p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Indicateur de Tendance */}
            <div className={`mt-3 flex items-center gap-1.5 font-bold ${trendColor}`}>
              <TrendIcon size={18} className="w-4 h-4" />
              {trend7d === null ? (
                <span className="text-sm font-medium">Tendance N/A</span>
              ) : (
                <span className="text-sm">{trend7d > 0 ? "+" : ""}{trend7d.toFixed(2)}% (7j)</span>
              )}
            </div>
          </div>
        )}
      </div>

      <ItemModal item={item} chartData={chartData} open={open} onOpenChange={setOpen} />
    </>
  );
}