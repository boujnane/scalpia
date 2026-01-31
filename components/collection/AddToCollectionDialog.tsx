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
import { Icons } from "@/components/icons";
import { useAuth } from "@/context/AuthContext";
import type { Item } from "@/lib/analyse/types";
import type { CollectionFormData } from "@/types/collection";

type AddToCollectionDialogProps = {
  item: Item;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: Item, formData: CollectionFormData) => Promise<boolean>;
  isAlreadyInCollection?: boolean;
};

export function AddToCollectionDialog({
  item,
  open,
  onOpenChange,
  onAdd,
  isAlreadyInCollection = false,
}: AddToCollectionDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [purchasePrice, setPurchasePrice] = useState<string>("");
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [showPurchaseFields, setShowPurchaseFields] = useState(false);
  const [preOwned, setPreOwned] = useState(false);
  const [ownedSince, setOwnedSince] = useState<string>("");

  const handleSubmit = async () => {
    if (!user || quantity < 1) return;

    setSubmitting(true);

    const formData: CollectionFormData = {
      quantity,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchaseDate: purchaseDate || undefined,
      notes: notes || undefined,
      preOwned,
      ownedSince: ownedSince || undefined,
    };

    const success = await onAdd(item, formData);

    setSubmitting(false);

    if (success) {
      // Reset form
      setQuantity(1);
      setPurchasePrice("");
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
              Connectez-vous pour ajouter des articles à votre collection.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              {item.image && (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-background border border-border">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{item.type} {item.name}</p>
                <p className="text-sm text-muted-foreground">{item.bloc}</p>
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
            <Icons.collection className="w-5 h-5 text-primary" />
            {isAlreadyInCollection ? "Ajouter des exemplaires" : "Ajouter à ma collection"}
          </DialogTitle>
          <DialogDescription>
            {isAlreadyInCollection
              ? "Cet article est déjà dans votre collection. Ajoutez des exemplaires supplémentaires."
              : "Ajoutez cet article à votre collection personnelle."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Item preview */}
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            {item.image && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-background border border-border">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.type} {item.name}</p>
              <p className="text-sm text-muted-foreground">{item.bloc}</p>
            </div>
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
                  Je possédais déjà cet article
                </label>
                <p className="text-xs text-muted-foreground">
                  Cochez si vous ajoutez un article que vous possédiez avant d'utiliser l'application.
                  Il sera inclus dans vos statistiques depuis le début.
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
                  placeholder="Laisser vide pour inclure depuis le début"
                />
                <p className="text-xs text-muted-foreground">
                  Laissez vide pour l'inclure depuis le début de votre collection.
                </p>
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
                    placeholder="0.00"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
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
