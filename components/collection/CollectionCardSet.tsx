"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { CollectionCardWithPrice } from "@/types/collection";

type CollectionCardSetProps = {
  setName: string;
  setImage?: string | null;
  cards: CollectionCardWithPrice[];
  onEditCard?: (card: CollectionCardWithPrice) => void;
  onDeleteCard?: (card: CollectionCardWithPrice) => void;
};

export function CollectionCardSet({
  setName,
  setImage,
  cards,
  onEditCard,
  onDeleteCard,
}: CollectionCardSetProps) {
  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/20">
        <div className="flex items-center gap-3 min-w-0">
          {setImage ? (
            <img
              src={setImage}
              alt={setName}
              className="h-8 w-auto object-contain"
              loading="lazy"
              decoding="async"
            />
          ) : null}
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">{setName}</h4>
            <p className="text-xs text-muted-foreground">
              {cards.length} carte{cards.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Badge variant="secondary">Série</Badge>
      </div>

      <div className="divide-y divide-border/60">
        {cards.map((card) => {
          const hasPurchasePrice =
            typeof card.purchase?.price === "number" ||
            typeof card.purchase?.totalCost === "number";
          const hasInvestmentBasis =
            hasPurchasePrice || (card.priceAtPurchase && card.priceAtPurchase > 0);
          const unitPurchasePrice =
            hasPurchasePrice
              ? typeof card.purchase?.price === "number"
                ? card.purchase.price
                : typeof card.purchase?.totalCost === "number" && card.quantity > 0
                  ? card.purchase.totalCost / card.quantity
                  : null
              : card.priceAtPurchase && card.priceAtPurchase > 0
                ? card.priceAtPurchase
                : null;

          return (
            <div key={card.cardId} className="flex items-center gap-3 p-4">
              <div className="relative h-16 w-12 shrink-0 rounded-md bg-muted/60 border border-border/60 overflow-hidden">
                {card.cardImage ? (
                  <Image
                    src={card.cardImage}
                    alt={card.cardName}
                    fill
                    sizes="48px"
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                    N/A
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground truncate">
                    {card.cardName}
                  </span>
                  {card.cardNumber && (
                    <Badge variant="outline" className="text-xs">
                      #{card.cardNumber}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    x{card.quantity}
                  </Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  {card.rarity && (
                    <>
                      <Badge variant="secondary" className="text-[10px]">
                        {card.rarity}
                      </Badge>
                    </>
                  )}
                  {unitPurchasePrice !== null && (
                    <span className="tabular-nums">
                      {hasPurchasePrice ? "Prix d'achat" : "Prix à l'ajout"}{" "}
                      {unitPurchasePrice.toFixed(2)} €
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-primary tabular-nums">
                  {card.currentPrice !== null ? `${card.currentPrice.toFixed(2)} €` : "N/A"}
                </div>
                {hasInvestmentBasis && card.profitLoss !== null ? (
                  <div className={`text-xs font-semibold tabular-nums ${
                    card.profitLoss >= 0 ? "text-success" : "text-destructive"
                  }`}>
                    {card.profitLoss >= 0 ? "+" : ""}{card.profitLoss.toFixed(2)} €
                    {card.profitLossPercent !== null && (
                      <span className="ml-1">
                        ({card.profitLossPercent >= 0 ? "+" : ""}{card.profitLossPercent.toFixed(1)}%)
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">—</div>
                )}
              </div>

              {(onEditCard || onDeleteCard) && (
                <div className="flex items-center gap-1">
                  {onEditCard && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEditCard(card)}
                    >
                      <Icons.edit className="w-4 h-4" />
                    </Button>
                  )}
                  {onDeleteCard && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteCard(card)}
                    >
                      <Icons.delete className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
