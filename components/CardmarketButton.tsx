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
  onSelectPrice?: (price: number) => void; // callback pour le prix sélectionné
};

export default function CardmarketButton({ url, onSelectPrice }: Props) {
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
        // Exclut la première offre (souvent une offre groupée ou spéciale)
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
      <Button
        onClick={handleClick}
        disabled={loading}
        className="w-fit"
        variant="default" // Utilisation de la variante thématique par défaut
      >
        {loading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
        {loading ? "Chargement…" : "Charger les offres Cardmarket"}
      </Button>

      {/* Utilisation de text-muted-foreground */}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {offers.length > 0 && (
        <>
          <Separator className="bg-border" />
          <div className="flex gap-4 overflow-x-auto py-2">
            {offers.map((offer, i) => (
              <Card
              key={i}
              // Utilisation de bg-card, border-border et hover:shadow-lg
              className="flex-shrink-0 w-[220px] bg-card hover:shadow-lg transition rounded-xl border border-border cursor-pointer"
              onClick={() => {
                if (offer.price && onSelectPrice) {
                  // Nettoyage du prix pour extraire une valeur numérique
                  const numericPrice = parseFloat(
                    offer.price.replace(',', '.').replace(/[^\d.]/g, '')
                  );
                  if (!isNaN(numericPrice)) {
                    onSelectPrice(numericPrice);
                  }
                }
              }}
            >
                <CardContent className="flex flex-col gap-3 p-4">
                  <div className="flex justify-between items-center">
                    {/* Utilisation de text-primary pour le prix */}
                    <span className="text-xl font-semibold text-primary">
                      {offer.price ? `${offer.price}` : "—"}
                    </span>
                    {/* Utilisation de text-muted-foreground */}
                    <span className="text-xs text-muted-foreground">
                      {offer.count} dispo
                    </span>
                  </div>

                  {/* Vendeur */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Utilisation de text-foreground */}
                      <span className="text-sm text-foreground truncate cursor-default">
                        <Icons.user className="inline h-3 w-3 mr-1 text-primary" />
                        {offer.seller || "—"}
                      </span>
                    </TooltipTrigger>
                    {/* Utilisation de bg-popover/border-border */}
                    <TooltipContent side="top" className="bg-popover border-border text-popover-foreground">
                      {offer.seller || "Vendeur inconnu"}
                    </TooltipContent>
                  </Tooltip>

                  {/* Commentaire */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* Utilisation de text-muted-foreground */}
                      <span className="text-xs text-muted-foreground truncate cursor-default">
                        <Icons.note className="inline h-3 w-3 mr-1 text-primary" />
                        {offer.comment || "—"}
                      </span>
                    </TooltipTrigger>
                    {/* Utilisation de bg-popover/border-border */}
                    <TooltipContent side="top" className="bg-popover border-border text-popover-foreground">
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