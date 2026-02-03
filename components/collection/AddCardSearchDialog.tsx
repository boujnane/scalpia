"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { cn } from "@/lib/utils";
import { AddCardToCollectionDialog } from "@/components/collection/AddCardToCollectionDialog";
import { useCollection } from "@/hooks/useCollection";
import type { CMCard } from "@/lib/cardmarket/types";
import { CreditCard } from "lucide-react";

type AddCardSearchDialogProps = {
  buttonClassName?: string;
  buttonLabel?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

export default function AddCardSearchDialog({
  buttonClassName,
  buttonLabel = "Ajouter une carte",
  buttonVariant = "outline",
}: AddCardSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cards, setCards] = useState<CMCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CMCard | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { isCardInCollection } = useCollection();

  const getCardKey = (card: CMCard) => {
    if (typeof card.cardmarketId === "number" && !Number.isNaN(card.cardmarketId)) {
      return `cm-${card.cardmarketId}`;
    }
    const episodeName = card.episode?.name ?? "set-inconnu";
    const cardNumber = card.card_number ?? "no-number";
    return `tcg-${card.name}-${episodeName}-${cardNumber}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      // API hybride : Cardmarket (IDs + prix) + TCGdex (noms FR)
      const response = await fetch(`/api/cards/search?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      const data = await response.json();

      // Map API response to CMCard format (structure déjà correcte depuis l'API)
      const mappedCards: CMCard[] = (data.results || []).map((card: Record<string, unknown>) => ({
        id: card.id as number,
        cardmarketId: card.cardmarketId as number | undefined,
        name: card.name as string,
        rarity: card.rarity as string | undefined,
        card_number: card.card_number as string | undefined,
        image: card.image as string | undefined,
        prices: card.prices as CMCard["prices"],
        episode: card.episode as { name: string } || { name: "Set inconnu" },
        cardmarket_url: card.cardmarket_url as string | null,
        tcggo_url: card.tcggo_url as string | null,
      }));

      const uniqueCardsMap = new Map<string, CMCard>();
      for (const card of mappedCards) {
        const key = getCardKey(card);
        if (!uniqueCardsMap.has(key)) {
          uniqueCardsMap.set(key, card);
        }
      }

      setCards(Array.from(uniqueCardsMap.values()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la recherche");
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddDialog = (card: CMCard) => {
    setSelectedCard(card);
    setAddDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setQuery("");
    setCards([]);
    setSearched(false);
    setError(null);
  };

  const getPriceFR = (card: CMCard): number | null => {
    return card.prices?.fr ?? card.prices?.avg7 ?? null;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(nextOpen) => {
        if (!nextOpen) handleCloseDialog();
        else setOpen(true);
      }}>
        <DialogTrigger asChild>
          <Button
            variant={buttonVariant}
            className={cn("gap-2", buttonClassName)}
            aria-label="Ajouter une carte à la collection"
          >
            <CreditCard className="h-4 w-4" />
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 sm:max-w-2xl top-6 sm:top-10 translate-y-0 rounded-2xl max-h-[calc(100vh-6rem)] overflow-hidden">
          <div className="border-b border-border p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                <CreditCard className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle>Ajouter une carte</DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recherchez une carte Pokémon puis cliquez dessus pour l'ajouter.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom de la carte (ex: Pikachu, Dracaufeu...)"
                  className="pl-9"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <Button onClick={handleSearch} disabled={!query.trim() || loading}>
                {loading ? (
                  <>
                    <Icons.loader className="h-4 w-4 mr-2 animate-spin" />
                    Recherche...
                  </>
                ) : (
                  "Rechercher"
                )}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Recherche en français. Les cartes avec prix Cardmarket sont affichées en premier.
            </p>
          </div>

          <ScrollArea className="max-h-[65vh]">
            <div className="p-4 space-y-2">
              {loading && (
                <div className="flex items-center justify-center py-8 gap-2 text-sm text-muted-foreground">
                  <Icons.loader className="h-4 w-4 animate-spin" />
                  Recherche en cours...
                </div>
              )}

              {!loading && error && (
                <div className="text-sm text-destructive py-4">{error}</div>
              )}

              {!loading && !error && !searched && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Entrez le nom d'une carte et cliquez sur "Rechercher".
                </div>
              )}

              {!loading && !error && searched && cards.length === 0 && (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Aucune carte trouvée pour "{query}".
                </div>
              )}

              {!loading &&
                !error &&
                cards.map((card) => {
                  const priceFR = getPriceFR(card);
                  const alreadyInCollection = isCardInCollection(card);
                  const uniqueKey = getCardKey(card);

                  return (
                    <div
                      key={uniqueKey}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <button
                        onClick={() => handleOpenAddDialog(card)}
                        className="w-full flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3 text-left transition hover:border-primary/40 hover:bg-card"
                      >
                        <div className="relative h-16 w-12 shrink-0 rounded-md bg-muted/60 border border-border/60 overflow-hidden">
                          {card.image ? (
                            <Image
                              src={card.image}
                              alt={card.name}
                              fill
                              sizes="48px"
                              className="object-contain"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="truncate font-semibold text-foreground">
                              {card.name}
                            </span>
                            {card.card_number && (
                              <Badge variant="outline" className="shrink-0 text-xs">
                                #{card.card_number}
                              </Badge>
                            )}
                            {alreadyInCollection && (
                              <Badge variant="secondary" className="shrink-0">
                                Dans la collection
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{card.episode?.name || "Set inconnu"}</span>
                            {card.rarity && (
                              <>
                                <span>·</span>
                                <span>{card.rarity}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          {priceFR !== null ? (
                            <div>
                              <div className="text-sm font-semibold text-primary">
                                {priceFR.toFixed(2)} €
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                Meilleur prix FR
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Prix N/A</div>
                          )}
                        </div>
                      </button>

                      <Button
                        variant="secondary"
                        className="w-full sm:w-auto sm:shrink-0"
                        onClick={() => handleOpenAddDialog(card)}
                      >
                        <Icons.add className="h-4 w-4 mr-2" />
                        {alreadyInCollection ? "Ajouter +1" : "Ajouter"}
                      </Button>
                    </div>
                  );
                })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedCard && (
        <AddCardToCollectionDialog
          card={selectedCard}
          open={addDialogOpen}
          onOpenChange={(nextOpen) => {
            setAddDialogOpen(nextOpen);
            if (!nextOpen) setSelectedCard(null);
          }}
          isAlreadyInCollection={isCardInCollection(selectedCard)}
        />
      )}
    </>
  );
}
