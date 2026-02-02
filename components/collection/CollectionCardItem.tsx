"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import type { CollectionCardWithPrice } from "@/types/collection";
import { TrendingDown, TrendingUp } from "lucide-react";

type CollectionCardItemProps = {
  card: CollectionCardWithPrice;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function CollectionCardItem({ card, onEdit, onDelete }: CollectionCardItemProps) {
  const hasInvestmentBasis =
    (card.purchase?.price && card.purchase.price > 0) ||
    (card.priceAtPurchase && card.priceAtPurchase > 0) ||
    (card.purchase?.totalCost && card.purchase.totalCost > 0);

  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      <div className="relative h-44 bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center">
        {card.cardImage ? (
          <Image
            src={card.cardImage}
            alt={card.cardName}
            fill
            className="object-contain p-3 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-xs text-muted-foreground">Image N/A</div>
        )}

        <div className="absolute top-3 right-3">
          <Badge variant="secondary" className="font-bold shadow-sm">
            x{card.quantity}
          </Badge>
        </div>

        {hasInvestmentBasis && card.profitLoss !== null && (
          <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
            card.profitLoss >= 0
              ? "bg-success/20 text-success"
              : "bg-destructive/20 text-destructive"
          }`}>
            {card.profitLoss >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {card.profitLossPercent !== null
              ? `${card.profitLossPercent >= 0 ? "+" : ""}${card.profitLossPercent.toFixed(1)}%`
              : ""}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
              {card.cardName}
            </h3>
            {card.cardNumber && (
              <Badge variant="outline" className="text-xs">
                #{card.cardNumber}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{card.setName}</span>
            {card.rarity && (
              <>
                <span>·</span>
                <Badge variant="secondary" className="text-[10px]">
                  {card.rarity}
                </Badge>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Prix FR actuel</p>
            <p className="text-lg font-bold text-primary tabular-nums">
              {card.currentPrice !== null ? `${card.currentPrice.toFixed(2)} €` : "N/A"}
            </p>
            {card.currentValue !== null && card.quantity > 1 && (
              <p className="text-[11px] text-muted-foreground">
                Valeur totale {card.currentValue.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </p>
            )}
          </div>
          <div className="space-y-0.5 text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Plus-value</p>
            {hasInvestmentBasis && card.profitLoss !== null ? (
              <p className={`text-lg font-bold tabular-nums ${
                card.profitLoss >= 0 ? "text-success" : "text-destructive"
              }`}>
                {card.profitLoss >= 0 ? "+" : ""}{card.profitLoss.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
              </p>
            ) : (
              <p className="text-lg font-bold tabular-nums text-muted-foreground">—</p>
            )}
          </div>
        </div>

        {card.priceAtPurchase && card.priceAtPurchase > 0 && (
          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>Prix à l'ajout</span>
            <span className="font-medium text-foreground tabular-nums">
              {card.priceAtPurchase.toFixed(2)} €
            </span>
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                  onClick={onEdit}
                >
                  <Icons.edit className="w-4 h-4 mr-1.5" />
                  Modifier
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  onClick={onDelete}
                >
                  <Icons.delete className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
