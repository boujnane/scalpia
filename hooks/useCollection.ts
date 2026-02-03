// hooks/useCollection.ts
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getCollectionEntries,
  addToCollection,
  addCardToCollection,
  updateCollectionEntry,
  updateCollectionItem,
  removeFromCollection,
  getCollectionSnapshots,
  saveCollectionSnapshot,
  deleteSnapshotsBefore,
  generateItemId,
  generateCardId,
} from "@/lib/collection";
import type {
  CollectionItem,
  CollectionCard,
  CollectionEntry,
  CollectionItemWithPrice,
  CollectionCardWithPrice,
  CollectionEntryWithPrice,
  CollectionSnapshot,
  CollectionSummary,
  CollectionFormData,
} from "@/types/collection";
import { isCollectionItem, isCollectionCard } from "@/types/collection";
import type { Item } from "@/lib/analyse/types";
import type { CMCard } from "@/lib/cardmarket/types";

type UseCollectionReturn = {
  items: CollectionItemWithPrice[];
  cards: CollectionCardWithPrice[];
  entries: CollectionEntryWithPrice[];
  snapshots: CollectionSnapshot[];
  summary: CollectionSummary;
  loading: boolean;
  error: string | null;
  addItem: (item: Item, formData: CollectionFormData) => Promise<boolean>;
  addCard: (card: CMCard, formData: CollectionFormData) => Promise<boolean>;
  updateItem: (itemId: string, updates: Partial<Pick<CollectionItem, "quantity" | "purchase" | "ownedSince">>) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  isInCollection: (item: Item) => boolean;
  isCardInCollection: (card: CMCard) => boolean;
};

const ensureCardmarketLanguage = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.includes("language=2")) return url;
  return url.includes("?") ? `${url}&language=2` : `${url}?language=2`;
};

/**
 * Get the latest price for an item from prices array
 */
function getLatestPrice(item: Item): number | null {
  if (!item.prices || item.prices.length === 0) return null;

  const sorted = [...item.prices].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sorted[0]?.price ?? null;
}

/**
 * Get the price for an item at a specific date
 * Returns the price for that exact date, or null if not indexed
 */
function getPriceAtDate(item: Item, date: string): number | null {
  if (!item.prices || item.prices.length === 0) return null;

  const pricePoint = item.prices.find(p => p.date === date);
  return pricePoint?.price ?? null;
}

/**
 * Get all unique dates that have prices across all items
 */
function getIndexedDates(items: Item[]): Set<string> {
  const dates = new Set<string>();
  for (const item of items) {
    if (item.prices) {
      for (const p of item.prices) {
        dates.add(p.date);
      }
    }
  }
  return dates;
}

function extractCardmarketId(card: CollectionCard): number | null {
  if (typeof card.cardmarketId === "number" && !Number.isNaN(card.cardmarketId)) {
    return card.cardmarketId;
  }
  // Handle legacy data where cardmarketId might be stored as string
  const rawId = (card as unknown as { cardmarketId?: unknown }).cardmarketId;
  if (typeof rawId === "string") {
    const parsed = Number(rawId);
    if (!Number.isNaN(parsed)) return parsed;
  }
  const match = card.cardId.match(/card-(\d+)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isNaN(parsed) ? null : parsed;
}

function getCardCostBasis(card: CollectionCard): number | null {
  if (card.purchase) {
    if (typeof card.purchase.totalCost === "number") {
      return card.purchase.totalCost;
    }
    if (typeof card.purchase.price === "number") {
      return card.purchase.price * card.quantity;
    }
  }
  if (card.priceAtPurchase && card.priceAtPurchase > 0) {
    return card.priceAtPurchase * card.quantity;
  }
  return null;
}

/**
 * Hook for managing user collection
 */
export function useCollection(allItems: Item[] = []): UseCollectionReturn {
  const { user } = useAuth();
  const [collectionEntries, setCollectionEntries] = useState<CollectionEntry[]>([]);
  const [snapshots, setSnapshots] = useState<CollectionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardPrices, setCardPrices] = useState<Record<number, number | null>>({});
  const [cardLinks, setCardLinks] = useState<Record<number, string | null>>({});
  const scrapedCardsRef = useRef<Set<string>>(new Set());

  // Create a map of itemId to Item for quick lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>();
    for (const item of allItems) {
      const id = generateItemId(item);
      map.set(id, item);
    }
    return map;
  }, [allItems]);

  const collectionItems = useMemo(
    () => collectionEntries.filter(isCollectionItem),
    [collectionEntries]
  );

  const collectionCards = useMemo(
    () => collectionEntries.filter(isCollectionCard),
    [collectionEntries]
  );

  // Fetch collection data
  const fetchCollection = useCallback(async () => {
    if (!user) {
      setCollectionEntries([]);
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [entries, snapshotData] = await Promise.all([
        getCollectionEntries(user.uid),
        getCollectionSnapshots(user.uid, 90),
      ]);

      setCollectionEntries(entries);

      // Filter snapshots to only include dates >= collection start date
      // collectionStartDate is based on addedAt (when user started using the app)
      // NOT ownedSince (which is for pre-owned items)
      const itemsOnly = entries.filter(isCollectionItem);
      if (itemsOnly.length > 0) {
        const collectionStartDate = itemsOnly.reduce((earliest, item) => {
          const addedAt = item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt);
          const dateStr = addedAt.toISOString().slice(0, 10);
          return dateStr < earliest ? dateStr : earliest;
        }, new Date().toISOString().slice(0, 10));

        // Delete old snapshots from Firestore that are before collection start
        const oldSnapshots = snapshotData.filter(s => s.date < collectionStartDate);
        if (oldSnapshots.length > 0) {
          await deleteSnapshotsBefore(user.uid, collectionStartDate);
        }

        const filteredSnapshots = snapshotData.filter(s => s.date >= collectionStartDate);
        setSnapshots(filteredSnapshots);
      } else {
        setSnapshots([]);
      }
    } catch (err) {
      console.error("Error fetching collection:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  // Calculate items with prices
  const itemsWithPrices = useMemo((): CollectionItemWithPrice[] => {
    return collectionItems.map((item) => {
      const sourceItem = itemsMap.get(item.itemId);
      const currentPrice = sourceItem ? getLatestPrice(sourceItem) : null;
      const currentValue = currentPrice !== null ? currentPrice * item.quantity : null;
      const retailPrice = sourceItem?.retailPrice ?? null;

      const totalCost = item.purchase?.price && item.purchase.price > 0
        ? item.purchase.price * item.quantity
        : (retailPrice && retailPrice > 0
          ? retailPrice * item.quantity
          : (item.purchase?.totalCost ?? 0));
      const profitLoss = currentValue !== null && totalCost > 0
        ? currentValue - totalCost
        : null;
      const profitLossPercent = profitLoss !== null && totalCost > 0
        ? (profitLoss / totalCost) * 100
        : null;

      return {
        ...item,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
        retailPrice,
      };
    });
  }, [collectionItems, itemsMap]);

  const cardmarketIds = useMemo(() => {
    const ids = new Set<number>();
    for (const card of collectionCards) {
      const id = extractCardmarketId(card);
      if (id !== null) ids.add(id);
    }
    return Array.from(ids);
  }, [collectionCards]);

  const cardmarketIdsKey = useMemo(() => cardmarketIds.join(","), [cardmarketIds]);

  useEffect(() => {
    if (!user) {
      setCardPrices({});
      setCardLinks({});
      return;
    }
    if (cardmarketIds.length === 0) {
      setCardPrices({});
      setCardLinks({});
      return;
    }

    let cancelled = false;

    const fetchCardPrices = async () => {
      try {
        const nextPrices: Record<number, number | null> = {};
        const nextLinks: Record<number, string | null> = {};
        const chunks: number[][] = [];
        for (let i = 0; i < cardmarketIds.length; i += 50) {
          chunks.push(cardmarketIds.slice(i, i + 50));
        }

        for (const chunk of chunks) {
          const res = await fetch("/api/cardmarket/cards/batch", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardIds: chunk }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data?.error || `API error ${res.status}`);
          }

          const cards = Array.isArray(data?.cards) ? data.cards : [];
          for (const card of cards) {
            const rawId = card?.cardmarketId ?? card?.id ?? card?.cardmarket_id;
            const id = Number(rawId);
            if (Number.isNaN(id)) continue;
            const price = card?.prices?.fr ?? card?.prices?.avg7 ?? null;
            const link = card?.cardmarket_url ?? card?.cardmarketUrl ?? null;
            nextPrices[id] = typeof price === "number" ? price : null;
            nextLinks[id] = typeof link === "string"
              ? (link.includes("?") ? `${link}&language=2` : `${link}?language=2`)
              : null;
          }
        }

        if (!cancelled) {
          setCardPrices(nextPrices);
          setCardLinks(nextLinks);
        }
      } catch (err) {
        console.error("Error fetching card prices:", err);
      }
    };

    fetchCardPrices();

    return () => {
      cancelled = true;
    };
  }, [user, cardmarketIdsKey, cardmarketIds]);

  useEffect(() => {
    if (!user || collectionCards.length === 0) return;

    const candidates = collectionCards.filter((card) => {
      const id = extractCardmarketId(card);
      if (id === null) return false;
      if (scrapedCardsRef.current.has(card.cardId)) return false;
      return !card.cardmarketUrl || !card.tcggoUrl;
    });

    if (candidates.length === 0) return;

    let cancelled = false;

    const run = async () => {
      const queue = [...candidates];
      const updated: string[] = [];
      const concurrency = Math.min(4, queue.length);

      const worker = async () => {
        while (queue.length > 0) {
          const card = queue.shift();
          if (!card) return;
          if (scrapedCardsRef.current.has(card.cardId)) continue;
          scrapedCardsRef.current.add(card.cardId);

          const cardmarketId = extractCardmarketId(card);
          if (cardmarketId === null) continue;

          try {
            const res = await fetch(`/api/cardmarket/cards/${cardmarketId}?scrape=1`, {
              cache: "no-store",
            });
            const data = await res.json().catch(() => null);
            if (!res.ok || !data) continue;

            const rawUrl = data?.cardmarket_url ?? data?.cardmarketUrl ?? null;
            const nextUrl = typeof rawUrl === "string"
              ? (rawUrl.includes("?") ? `${rawUrl}&language=2` : `${rawUrl}?language=2`)
              : null;
            const nextTcggo = data?.tcggo_url ?? data?.tcggoUrl ?? null;
            const updates: Record<string, unknown> = {};

            if (nextUrl && !card.cardmarketUrl) updates.cardmarketUrl = nextUrl;
            if (nextTcggo && !card.tcggoUrl) updates.tcggoUrl = nextTcggo;

            if (Object.keys(updates).length > 0) {
              await updateCollectionEntry(user.uid, card.cardId, updates);
              updated.push(card.cardId);
            }
          } catch {
          }
        }
      };

      await Promise.all(Array.from({ length: concurrency }, worker));

      if (!cancelled && updated.length > 0) {
        await fetchCollection();
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [user, collectionCards, fetchCollection]);

  const cardsWithPrices = useMemo((): CollectionCardWithPrice[] => {
    return collectionCards.map((card) => {
      const cardmarketId = extractCardmarketId(card);
      const currentPrice = cardmarketId !== null ? cardPrices[cardmarketId] ?? null : null;
      const rawUrl = cardmarketId !== null
        ? cardLinks[cardmarketId] ?? card.cardmarketUrl ?? null
        : card.cardmarketUrl ?? null;
      const cardmarketUrl = ensureCardmarketLanguage(rawUrl);
      const tcggoUrl = card.cardmarketUrl && card.tcggoUrl
        ? card.tcggoUrl
        : card.tcggoUrl ?? null;
      const currentValue = currentPrice !== null ? currentPrice * card.quantity : null;
      const costBasis = getCardCostBasis(card);
      const profitLoss = currentValue !== null && costBasis !== null
        ? currentValue - costBasis
        : null;
      const profitLossPercent = profitLoss !== null && costBasis !== null && costBasis > 0
        ? (profitLoss / costBasis) * 100
        : null;

      return {
        ...card,
        cardmarketUrl,
        tcggoUrl,
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPercent,
      };
    });
  }, [collectionCards, cardPrices, cardLinks]);

  const entriesWithPrices = useMemo(
    () => [...itemsWithPrices, ...cardsWithPrices],
    [itemsWithPrices, cardsWithPrices]
  );

  // Calculate summary
  const summary = useMemo((): CollectionSummary => {
    let totalValue = 0;
    let totalCost = 0;
    let totalQuantity = 0;

    for (const item of itemsWithPrices) {
      if (item.currentValue !== null) {
        totalValue += item.currentValue;
      }
      if (item.purchase?.price && item.purchase.price > 0) {
        totalCost += item.purchase.price * item.quantity;
      } else if (item.retailPrice && item.retailPrice > 0) {
        totalCost += item.retailPrice * item.quantity;
      } else if (item.purchase?.totalCost) {
        totalCost += item.purchase.totalCost;
      }
      totalQuantity += item.quantity;
    }

    for (const card of cardsWithPrices) {
      if (card.currentValue !== null) {
        totalValue += card.currentValue;
      }
      const costBasis = getCardCostBasis(card);
      if (costBasis !== null && costBasis > 0) {
        totalCost += costBasis;
      }
      totalQuantity += card.quantity;
    }

    const profitLoss = totalCost > 0 ? totalValue - totalCost : 0;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalItems: itemsWithPrices.length + cardsWithPrices.length,
      totalQuantity,
      profitLoss,
      profitLossPercent,
    };
  }, [itemsWithPrices, cardsWithPrices]);

  // Recalculate snapshots based on actual indexed prices
  // Starting from the date the first item was added to the collection
  useEffect(() => {
    if (!user || loading || collectionItems.length === 0 || allItems.length === 0) return;

    const recalculateSnapshots = async () => {
      try {
        // Find the earliest date an item was added to the collection (addedAt)
        // This represents when the user started using the app, NOT ownedSince
        const collectionStartDate = collectionItems.reduce((earliest, item) => {
          const addedAt = item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt);
          const dateStr = addedAt.toISOString().slice(0, 10);
          return dateStr < earliest ? dateStr : earliest;
        }, new Date().toISOString().slice(0, 10));

        // Get all dates that have indexed prices
        const indexedDates = getIndexedDates(allItems);
        if (indexedDates.size === 0) return;

        // Get existing snapshots to compare
        const existingSnapshots = await getCollectionSnapshots(user.uid, 90);
        const existingByDate = new Map(existingSnapshots.map(s => [s.date, s]));

        // Calculate total cost (doesn't change per day)
        let totalCost = 0;
        for (const item of itemsWithPrices) {
          if (item.purchase?.price && item.purchase.price > 0) {
            totalCost += item.purchase.price * item.quantity;
          } else if (item.retailPrice && item.retailPrice > 0) {
            totalCost += item.retailPrice * item.quantity;
          } else if (item.purchase?.totalCost) {
            totalCost += item.purchase.totalCost;
          }
        }

        let hasChanges = false;
        const today = new Date().toISOString().slice(0, 10);

        // For each indexed date, calculate collection value (except today - handled separately)
        for (const date of indexedDates) {
          // Skip dates before the collection was created
          if (date < collectionStartDate) continue;
          // Skip today - we'll handle it separately to include cards
          if (date === today) continue;

          // Calculate value for this date
          let totalValue = 0;
          let itemsWithPriceCount = 0;

          for (const collectionItem of collectionItems) {
            // Use ownedSince if available, otherwise use addedAt
            // This allows users to track items they owned before adding to the app
            let ownedSinceStr: string;
            if (collectionItem.ownedSince) {
              ownedSinceStr = collectionItem.ownedSince;
            } else {
              const addedAt = collectionItem.addedAt instanceof Date
                ? collectionItem.addedAt
                : new Date(collectionItem.addedAt);
              ownedSinceStr = addedAt.toISOString().slice(0, 10);
            }
            if (date < ownedSinceStr) continue; // Item wasn't owned yet

            const sourceItem = itemsMap.get(collectionItem.itemId);
            if (!sourceItem) continue;

            const priceAtDate = getPriceAtDate(sourceItem, date);
            if (priceAtDate !== null) {
              totalValue += priceAtDate * collectionItem.quantity;
              itemsWithPriceCount++;
            }
          }

          // Only create snapshot if at least one item has a price for this date
          if (itemsWithPriceCount === 0) continue;

          // Check if we need to update
          const existing = existingByDate.get(date);
          if (existing && Math.abs(existing.totalValue - totalValue) < 0.01) {
            continue; // No change needed
          }

          // Save or update snapshot
          await saveCollectionSnapshot(user.uid, {
            date,
            totalValue,
            totalCost,
            itemCount: collectionItems.length,
          });
          hasChanges = true;
        }

        // Always update today's snapshot to include cards value
        const todayItemsValue = itemsWithPrices.reduce((sum, item) => sum + (item.currentValue ?? 0), 0);
        const todayCardsValue = cardsWithPrices.reduce((sum, card) => sum + (card.currentValue ?? 0), 0);
        const todayTotalValue = todayItemsValue + todayCardsValue;

        // Calculate cards cost for today's snapshot
        let cardsCost = 0;
        for (const card of cardsWithPrices) {
          const costBasis = getCardCostBasis(card);
          if (costBasis !== null && costBasis > 0) {
            cardsCost += costBasis;
          }
        }

        const existingToday = existingByDate.get(today);
        const todayTotalCost = totalCost + cardsCost;
        if (!existingToday || Math.abs(existingToday.totalValue - todayTotalValue) >= 0.01) {
          await saveCollectionSnapshot(user.uid, {
            date: today,
            totalValue: todayTotalValue,
            totalCost: todayTotalCost,
            itemCount: collectionItems.length + collectionCards.length,
          });
          hasChanges = true;
        }

        // Refresh snapshots if changes were made
        if (hasChanges) {
          const newSnapshots = await getCollectionSnapshots(user.uid, 90);
          setSnapshots(newSnapshots);
        }
      } catch (err) {
        console.error("Error recalculating snapshots:", err);
      }
    };

    recalculateSnapshots();
  }, [user, loading, collectionItems, collectionCards, allItems, itemsMap, itemsWithPrices, cardsWithPrices]);

  // Add item to collection
  const addItem = useCallback(async (item: Item, formData: CollectionFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      await addToCollection(user.uid, item, formData);
      await fetchCollection();
      return true;
    } catch (err) {
      console.error("Error adding to collection:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
      return false;
    }
  }, [user, fetchCollection]);

  // Add card to collection
  const addCard = useCallback(async (card: CMCard, formData: CollectionFormData): Promise<boolean> => {
    if (!user) return false;

    try {
      await addCardToCollection(user.uid, card, formData);
      await fetchCollection();
      return true;
    } catch (err) {
      console.error("Error adding card to collection:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de l'ajout");
      return false;
    }
  }, [user, fetchCollection]);

  // Update collection item
  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<Pick<CollectionItem, "quantity" | "purchase" | "ownedSince">>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      await updateCollectionItem(user.uid, itemId, updates);
      await fetchCollection();
      return true;
    } catch (err) {
      console.error("Error updating collection item:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
      return false;
    }
  }, [user, fetchCollection]);

  // Remove item from collection
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      await removeFromCollection(user.uid, itemId);
      await fetchCollection();
      return true;
    } catch (err) {
      console.error("Error removing from collection:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
      return false;
    }
  }, [user, fetchCollection]);

  // Check if item is in collection
  const isInCollectionCheck = useCallback((item: Item): boolean => {
    const itemId = generateItemId(item);
    return collectionItems.some((ci) => ci.itemId === itemId);
  }, [collectionItems]);

  const isCardInCollectionCheck = useCallback((card: CMCard): boolean => {
    const cardId = generateCardId(card);
    return collectionCards.some((cc) => cc.cardId === cardId);
  }, [collectionCards]);

  return {
    items: itemsWithPrices,
    cards: cardsWithPrices,
    entries: entriesWithPrices,
    snapshots,
    summary,
    loading,
    error,
    addItem,
    addCard,
    updateItem,
    removeItem,
    refresh: fetchCollection,
    isInCollection: isInCollectionCheck,
    isCardInCollection: isCardInCollectionCheck,
  };
}
