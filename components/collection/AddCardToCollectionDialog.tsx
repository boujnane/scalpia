"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import { useCollection } from "@/hooks/useCollection";
import type { CMCard } from "@/lib/cardmarket/types";
import type { CollectionFormData } from "@/types/collection";
import { CreditCard } from "lucide-react";

type AddCardToCollectionDialogProps = {
  card: CMCard;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAlreadyInCollection?: boolean;
};

export function AddCardToCollectionDialog({
  card,
  open,
  onOpenChange,
  isAlreadyInCollection = false,
}: AddCardToCollectionDialogProps) {
  const defaultPurchasePrice = "5.99";
  const { user, loading: authLoading } = useAuth();
  const { addCard } = useCollection();
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState<string>(defaultPurchasePrice);
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showPurchaseFields, setShowPurchaseFields] = useState(false);
  const [preOwned, setPreOwned] = useState(false);
  const [ownedSince, setOwnedSince] = useState<string>("");

  const priceFR = card.prices?.fr ?? card.prices?.avg7 ?? null;

  const handleSubmit = async () => {
    if (!user || quantity < 1) return;

    setSubmitting(true);

    const trimmedPurchasePrice = purchasePrice.trim();
    const parsedPurchasePrice = trimmedPurchasePrice !== ""
      ? parseFloat(trimmedPurchasePrice)
      : undefined;

    const formData: CollectionFormData = {
      quantity,
      purchasePrice: parsedPurchasePrice,
      purchaseDate: purchaseDate || undefined,
      notes: notes || undefined,
      preOwned,
      ownedSince: ownedSince || undefined,
    };

    const success = await addCard(card, formData);

    setSubmitting(false);

    if (success) {
      // Reset form
      setQuantity(1);
      setPurchasePrice(defaultPurchasePrice);
      setPurchaseDate("");
      setNotes("");
      setShowPurchaseFields(false);
      setPreOwned(false);
      setOwnedSince("");
      onOpenChange(false);
    }
  };

  // Not logged in state
  if (!authLoading && !user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connexion requise</DialogTitle>
            <DialogDescription>
              Connectez-vous pour ajouter des cartes à votre collection.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              {card.image && (
                <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-background border border-border">
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{card.name}</p>
                <p className="text-sm text-muted-foreground">{card.episode?.name}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button asChild>
              <Link href="/login">
                <Icons.user className="w-4 h-4 mr-2" />
                Se connecter
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            {isAlreadyInCollection ? "Ajouter des exemplaires" : "Ajouter à ma collection"}
          </DialogTitle>
          <DialogDescription>
            {isAlreadyInCollection
              ? "Cette carte est déjà dans votre collection. Ajoutez des exemplaires supplémentaires."
              : "Ajoutez cette carte à votre collection personnelle."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Card preview */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            {card.image && (
              <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-background border border-border">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">{card.name}</p>
                {card.card_number && (
                  <Badge variant="outline" className="text-xs">#{card.card_number}</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{card.episode?.name}</p>
              {card.rarity && (
                <p className="text-xs text-muted-foreground">{card.rarity}</p>
              )}
            </div>
            {priceFR !== null && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-primary">{priceFR.toFixed(2)} €</p>
                <p className="text-[10px] text-muted-foreground">Prix FR</p>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantité</label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Icons.minusCircle className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Icons.plusCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Pre-owned checkbox */}
          <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="flex items-start gap-3">
              <Checkbox
                id="preOwned"
                checked={preOwned}
                onCheckedChange={(checked) => setPreOwned(checked === true)}
                className="mt-0.5"
              />
              <div className="space-y-1">
                <label htmlFor="preOwned" className="text-sm font-medium cursor-pointer">
                  Je possédais déjà cette carte
                </label>
                <p className="text-xs text-muted-foreground">
                  Cochez si vous ajoutez une carte que vous possédiez avant d'utiliser l'application.
                </p>
              </div>
            </div>

            {preOwned && (
              <div className="space-y-2 pl-7">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Icons.calendar className="w-4 h-4 text-muted-foreground" />
                  Depuis quand ? (optionnel)
                </label>
                <Input
                  type="date"
                  value={ownedSince}
                  onChange={(e) => setOwnedSince(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Toggle purchase fields */}
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setShowPurchaseFields(!showPurchaseFields)}
          >
            <Icons.chevronDown
              className={`w-4 h-4 mr-2 transition-transform ${showPurchaseFields ? "rotate-180" : ""}`}
            />
            {showPurchaseFields ? "Masquer" : "Ajouter"} les informations d'achat (optionnel)
          </Button>

          {/* Purchase fields */}
          {showPurchaseFields && (
            <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Icons.euro className="w-4 h-4 text-muted-foreground" />
                  Prix d'achat unitaire
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={priceFR !== null ? priceFR.toFixed(2) : "0.00"}
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
                {priceFR !== null && !purchasePrice && (
                  <p className="text-xs text-muted-foreground">
                    Prix actuel FR : {priceFR.toFixed(2)} €
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Icons.calendar className="w-4 h-4 text-muted-foreground" />
                  Date d'achat
                </label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optionnel)</label>
                <Input
                  type="text"
                  placeholder="Ex: Acheté sur Cardmarket"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {purchasePrice && quantity > 0 && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground">
                    Coût total : <span className="font-semibold text-foreground">
                      {(parseFloat(purchasePrice) * quantity).toFixed(2)} €
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || quantity < 1}
          >
            {submitting ? (
              <>
                <Icons.spinner className="w-4 h-4 mr-2 animate-spin" />
                Ajout en cours...
              </>
            ) : (
              <>
                <Icons.add className="w-4 h-4 mr-2" />
                Ajouter {quantity > 1 ? `${quantity} exemplaires` : "à ma collection"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
