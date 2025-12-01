"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Offer = {
  price: string | null;
  count: string;
  seller: string | null;
  comment: string | null;
};

type Props = {
  url: string | null; // L'URL à utiliser
};

export default function CardmarketButton({ url }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  const handleClick = async () => {
    if (!url) {
      setMessage("❌ Aucun lien Cardmarket disponible");
      return;
    }

    setLoading(true);
    setMessage(null);
    setOffers([]);

    try {
      const res = await fetch(`/api/cardmarket?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (res.ok && data.offers) {
        // Supprimer la première offre, puis prendre les 15 dernières
        const filteredOffers = data.offers.slice(1); 
        const latestOffers = filteredOffers.slice(0, 15);
        setOffers(latestOffers);
        setMessage(`✅ ${latestOffers.length} offres récupérées !`);
        console.log("Offres :", latestOffers);
      } else {
        setMessage(data.error || "Erreur inconnue");
      }
    } catch (err: any) {
      setMessage(err.message || "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-semibold shadow-lg hover:scale-105 transition-transform"
      >
        {loading ? "⏳ Chargement…" : "Ouvrir Cardmarket"}
      </button>

      {message && <p className="text-sm text-gray-500">{message}</p>}

      {offers.length > 0 && (
        <div className="flex gap-4 overflow-x-auto py-2">
          {offers.map((offer, i) => (
            <Card
              key={i}
              className="flex-shrink-0 w-[240px] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 rounded-xl"
            >
              <CardContent className="flex flex-col justify-between gap-2 p-4 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-green-600">{offer.price}</span>
                  <span className="text-sm text-gray-400 font-medium">📦 {offer.count}</span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-gray-700 truncate max-w-[180px] font-medium">
                      🧑‍💼 {offer.seller || "—"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">{offer.seller || "Inconnu"}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-gray-500 text-sm truncate max-w-[180px]">
                      📝 {offer.comment || "—"}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">{offer.comment || "Aucun commentaire"}</TooltipContent>
                </Tooltip>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
