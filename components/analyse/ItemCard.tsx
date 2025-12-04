"use client";

import { useState, useMemo } from "react"; // ⬅️ useMemo ajouté
import Image from "next/image"; // ⬅️ Next/Image pour l'optimisation
import { Item } from "@/lib/analyse/types";
import { Badge } from "@/components/ui/badge";
// Import de l'utilitaire d'analyse unifié
import { getChartAnalysis } from "@/lib/analyse/getChartAnalysis"; 
import ItemModal from "./ItemModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Icons } from "@/components/icons";

export default function ItemCard({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);

  // 1. Utilisation de useMemo et de l'analyse unifiée
  const analysis = useMemo(
    () => getChartAnalysis(item),
    [item]
  );
  
  const chartData = analysis.data;
  const lastPrice = analysis.lastPrice;
  const trend7d = analysis.trend7d; // Le trend 7j est prêt à être affiché
  
  // 2. Logique de l'indicateur visuel
  const trendColor = trend7d === null ? "text-gray-500" : trend7d > 0.5 ? "text-green-600" : trend7d < -0.5 ? "text-red-600" : "text-gray-500";
  const TrendIcon = trend7d === null || Math.abs(trend7d) <= 0.5 ? Icons.Minus : trend7d > 0.5 ? Icons.TrendingUp : Icons.TrendingDown;


  return (
    <>
      <div
        onClick={() => setOpen(true)}
        role="button"
        aria-label={`Ouvrir les détails de ${item.name}`}
        className="group border rounded-2xl shadow-md bg-white overflow-hidden hover:shadow-xl transition-shadow cursor-pointer p-4 flex flex-col items-center"
      >
        {/* Image */}
        <div className="w-full h-36 sm:h-40 relative flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden mb-4">
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
        <span className="font-semibold text-lg sm:text-xl text-center text-gray-800 mb-2">
          {item.type} {item.name}
        </span>

        {/* Date */}
        <Badge variant="secondary" className="mb-4">
          {item.releaseDate}
        </Badge>

        {/* Bloc Dernier Prix */}
        {lastPrice !== null && (
          <div className="w-full flex flex-col items-center mt-auto p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow">
            {/* Titre avec icône */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                <Icons.LineChart size={20} />
              </div>
              <span className="text-gray-700 font-semibold text-sm sm:text-base uppercase tracking-wide">
                Dernière Évaluation
              </span>
            </div>

            {/* Prix avec tooltip */}
            <div className="flex flex-col items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-indigo-700 font-extrabold text-3xl sm:text-4xl cursor-pointer">
                    {lastPrice.toFixed(2)} €
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm sm:text-base">
                  Les informations affichées proviennent de sources publiques...
                </TooltipContent>
              </Tooltip>
            </div>
            
            {/* Indicateur de Tendance */}
            <div className={`mt-3 flex items-center gap-1.5 font-bold ${trendColor}`}>
              <TrendIcon size={18} className="w-4 h-4" />
              {trend7d === null ? (
                <span className="text-sm">Tendance N/A</span>
              ) : (
                <span className="text-sm">{trend7d.toFixed(2)}% (7j)</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal - on passe maintenant chartData qui vient de l'analyse */}
      <ItemModal item={item} chartData={chartData} open={open} onOpenChange={setOpen} />
    </>
  );
}