"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Icons } from "@/components/icons";
import { getChartAnalysis } from "@/lib/analyse/getChartAnalysis";
import type { Item } from "@/lib/analyse/types";
import { cn } from "@/lib/utils";
import { AddToCollectionDialog } from "@/components/collection/AddToCollectionDialog";
import { useCollection } from "@/hooks/useCollection";

type AddItemSearchDialogProps = {
  buttonClassName?: string;
  buttonLabel?: string;
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
};

type ItemsResponse = {
  items: Item[];
  error?: string;
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenize = (value: string) =>
  normalizeText(value)
    .split(" ")
    .filter(Boolean);

export default function AddItemSearchDialog({
  buttonClassName,
  buttonLabel = "Ajouter un item",
  buttonVariant = "outline",
}: AddItemSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const { addItem, isInCollection } = useCollection();

  useEffect(() => {
    if (!open || loaded) return;

    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/analyse/items");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = (await response.json()) as ItemsResponse;
        if (data.error) throw new Error(data.error);
        setItems(data.items || []);
        setLoaded(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    void fetchItems();
  }, [open, loaded]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setSubmittedQuery("");
    }
  }, [open]);

  const normalizedQuery = normalizeText(submittedQuery);
  const queryTokens = useMemo(() => tokenize(submittedQuery), [submittedQuery]);

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    const ranked = items
      .map((item) => {
        const combinedMain = normalizeText(`${item.type} ${item.name}`);
        const combinedFull = normalizeText(`${item.type} ${item.name} ${item.bloc}`);

        const hasAllTokens = queryTokens.every((token) => combinedFull.includes(token));
        if (!hasAllTokens) return null;

        let score = 0;
        if (combinedMain.startsWith(normalizedQuery)) score += 6;
        if (combinedFull.startsWith(normalizedQuery)) score += 5;
        if (combinedMain.includes(normalizedQuery)) score += 4;
        if (combinedFull.includes(normalizedQuery)) score += 3;

        const mainWords = combinedMain.split(" ");
        queryTokens.forEach((token) => {
          if (mainWords.some((word) => word.startsWith(token))) score += 1.5;
          else if (combinedFull.includes(token)) score += 0.5;
        });

        return { item, score };
      })
      .filter(Boolean) as { item: Item; score: number }[];

    return ranked
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item)
      .slice(0, 25);
  }, [items, normalizedQuery, queryTokens]);

  const handleSearch = () => {
    if (!query.trim()) return;
    setSubmittedQuery(query);
  };

  const handleOpenAddDialog = (item: Item) => {
    setSelectedItem(item);
    setAddDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant={buttonVariant}
            className={cn("gap-2", buttonClassName)}
            aria-label="Ajouter un item à la collection"
          >
            <Icons.search className="h-4 w-4" />
            {buttonLabel}
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 sm:max-w-2xl top-6 sm:top-10 translate-y-0 rounded-2xl max-h-[calc(100vh-6rem)] overflow-hidden">
          <div className="border-b border-border p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="shrink-0 rounded-xl border border-primary/20 bg-primary/10 p-2 text-primary">
                <Icons.collection className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle>Ajouter à ma collection</DialogTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recherchez un produit puis cliquez dessus pour l'ajouter.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, bloc ou type"
                  className="pl-9"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <Button onClick={handleSearch} disabled={!query.trim()}>
                Rechercher
              </Button>
            </div>
            {query && (
              <div className="mt-2 text-xs text-muted-foreground">
                Recherche avec tolérance aux accents et majuscules.
              </div>
            )}
          </div>

          <ScrollArea className="max-h-[65vh]">
            <div className="p-4 space-y-2">
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icons.loader className="h-4 w-4 animate-spin" />
                  Chargement des items...
                </div>
              )}

              {!loading && error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              {!loading && !error && !query && (
                <div className="text-sm text-muted-foreground">
                  Commencez a taper pour rechercher dans votre base.
                </div>
              )}

              {!loading && !error && query && !submittedQuery && (
                <div className="text-sm text-muted-foreground">
                  Appuyez sur "Rechercher" pour lancer la recherche.
                </div>
              )}

              {!loading && !error && submittedQuery && results.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  Aucun item ne correspond a "{submittedQuery}".
                </div>
              )}

              {!loading &&
                !error &&
                submittedQuery &&
                results.map((item) => {
                  const analysis = getChartAnalysis(item);
                  const alreadyInCollection = isInCollection(item);
                  return (
                    <div
                      key={`${item.name}-${item.type}-${item.releaseDate}`}
                      className="flex flex-col sm:flex-row sm:items-center gap-2"
                    >
                      <button
                        onClick={() => handleOpenAddDialog(item)}
                        className="w-full flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 p-3 text-left transition hover:border-primary/40 hover:bg-card"
                      >
                        <div className="relative h-12 w-12 shrink-0 rounded-md bg-muted/60 border border-border/60 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
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
                          <div className="flex items-center gap-2">
                            <span className="truncate font-semibold text-foreground">
                              {item.type} {item.name}
                            </span>
                            {alreadyInCollection && (
                              <Badge variant="secondary" className="shrink-0">
                                Dans la collection
                              </Badge>
                            )}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {item.bloc} · {item.releaseDate}
                          </div>
                        </div>

                        <div className="text-right">
                          {analysis.lastPrice !== null ? (
                            <div className="text-sm font-semibold text-primary">
                              {analysis.lastPrice.toFixed(2)} €
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">Prix N/A</div>
                          )}
                        </div>
                      </button>

                      <Button
                        variant="secondary"
                        className="w-full sm:w-auto sm:shrink-0"
                        onClick={() => handleOpenAddDialog(item)}
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

      {selectedItem && (
        <AddToCollectionDialog
          item={selectedItem}
          open={addDialogOpen}
          onOpenChange={(nextOpen) => {
            setAddDialogOpen(nextOpen);
            if (!nextOpen) setSelectedItem(null);
          }}
          onAdd={addItem}
          isAlreadyInCollection={isInCollection(selectedItem)}
        />
      )}
    </>
  );
}
