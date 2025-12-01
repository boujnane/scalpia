"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/icons";

type Offer = {
  price: string | null;
  count: string;
  seller: string | null;
  comment: string | null;
};

type Props = {
  url: string | null;
};

export default function CardmarketButton({ url }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);

  const handleClick = async () => {
    if (!url) {
      setMessage("Aucun lien Cardmarket disponible.");
      return;
    }

    setLoading(true);
    setMessage(null);
    setOffers([]);

    try {
      const res = await fetch(`/api/cardmarket?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (res.ok && data.offers) {
        // Remove first offer and keep 15
        const filteredOffers = data.offers.slice(1).slice(0, 15);
        setOffers(filteredOffers);
        setMessage(`${filteredOffers.length} offres trouvées sur Cardmarket.`);
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
    <div className="flex flex-col gap-4">
       <br></br>
      <Button
        onClick={handleClick}
        disabled={loading}
        className="w-fit"
        variant="default"
      >
        {loading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        {loading ? "Chargement…" : "Charger les offres Cardmarket"}
      </Button>

      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}

      {offers.length > 0 && (
        <>
          <Separator />
          <div className="flex gap-4 overflow-x-auto py-2">
            {offers.map((offer, i) => (
              <Card
                key={i}
                className="flex-shrink-0 w-[220px] hover:shadow-md transition rounded-xl border"
              >
                <CardContent className="flex flex-col gap-3 p-4">

                  {/* Price + quantity */}
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-indigo-600">
                      {offer.price ? `${offer.price}` : "—"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {offer.count} dispo
                    </span>
                  </div>

                  {/* Seller */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-gray-700 truncate cursor-default">
                        <Icons.user className="inline h-3 w-3 mr-1" />
                        {offer.seller || "—"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {offer.seller || "Vendeur inconnu"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Comment */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-gray-500 truncate cursor-default">
                        <Icons.note className="inline h-3 w-3 mr-1" />
                        {offer.comment || "—"}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {offer.comment || "Aucun commentaire"}
                    </TooltipContent>
                  </Tooltip>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
