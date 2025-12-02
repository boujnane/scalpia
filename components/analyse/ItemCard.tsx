"use client";

import { useState } from "react";
import { Item } from "@/lib/analyse/types";
import { Badge } from "@/components/ui/badge";
import { buildChartData } from "@/lib/analyse/buildChartData";
import ItemModal from "./ItemModal";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export default function ItemCard({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);

  const chartData = buildChartData(item);

  // Dernier prix connu
  const lastPrice = item.prices?.length
    ? item.prices.sort((a, b) => (a.date < b.date ? 1 : -1))[0].price
    : null;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="group border rounded-2xl shadow-md bg-white overflow-hidden hover:shadow-xl transition-shadow cursor-pointer p-4 flex flex-col items-center"
      >
        {/* Image */}
        <div className="w-full h-36 sm:h-40 flex items-center justify-center bg-gray-50 rounded-xl overflow-hidden mb-4">
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>

        {/* Nom de l’item */}
        <span className="font-semibold text-lg sm:text-xl text-center text-gray-800 mb-2">
        {item.type} {item.name}
        </span>

        {/* Date de sortie */}
        <Badge variant="secondary" className="mb-4">
          {item.releaseDate}
        </Badge>

        {/* Bloc Dernier Prix */}
        {lastPrice !== null && (
          <div className="w-full p-4 sm:p-5 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow flex flex-col items-center">
            {/* Titre avec icône */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3">
              <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="22 17 18 13 14 17 10 9 5 14 2 11"></polyline>
                </svg>
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
                    {lastPrice} €
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm sm:text-base">
                  Les informations affichées proviennent de sources publiques
                  (Cardmarket, eBay, Vinted, Leboncoin, etc.). Elles sont
                  fournies à titre indicatif et peuvent varier. Nous ne
                  garantissons pas l’exactitude des prix et déclinons toute
                  responsabilité en cas d’erreurs ou de différences constatées.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <ItemModal item={item} chartData={chartData} open={open} onOpenChange={setOpen} />
    </>
  );
}
