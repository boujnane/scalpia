"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ItemModal from "@/components/analyse/ItemModal";
import { Icons } from "@/components/icons";
import { getChartAnalysis } from "@/lib/analyse/getChartAnalysis";
import type { Item } from "@/lib/analyse/types";
import { cn } from "@/lib/utils";
import { useTokens } from "@/context/TokenContext";
import { NoTokensModal } from "@/components/ui/TokenBadge";

type ItemSearchDialogProps = {
  buttonClassName?: string;
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

export default function ItemSearchDialog({ buttonClassName }: ItemSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemOpen, setItemOpen] = useState(false);
  const [showNoTokensModal, setShowNoTokensModal] = useState(false);
  const { consumeToken } = useTokens();

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

  const selectedAnalysis = useMemo(
    () => (selectedItem ? getChartAnalysis(selectedItem) : null),
    [selectedItem]
  );

  const handleSelect = (item: Item) => {
    setSelectedItem(item);
    setItemOpen(true);
    setOpen(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    const canProceed = await consumeToken();
    if (!canProceed) {
      setShowNoTokensModal(true);
      setOpen(false);
      return;
    }
    setSubmittedQuery(query);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-9 w-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 hover:scale-105",
              buttonClassName
            )}
            aria-label="Rechercher un item"
          >
            <Icons.search className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 sm:max-w-2xl">
          <div className="border-b border-border p-4">
            <DialogTitle>Rechercher un item</DialogTitle>
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Icons.search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, bloc ou type"
                  className="pl-9"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSearch();
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
                  return (
                    <button
                      key={`${item.name}-${item.type}-${item.releaseDate}`}
                      onClick={() => handleSelect(item)}
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
                  );
                })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {selectedItem && selectedAnalysis && (
        <ItemModal
          item={selectedItem}
          chartData={selectedAnalysis.data}
          open={itemOpen}
          onOpenChange={setItemOpen}
          showImage
        />
      )}

      <NoTokensModal open={showNoTokensModal} onClose={() => setShowNoTokensModal(false)} />
    </>
  );
}
