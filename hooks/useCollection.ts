// hooks/useCollection.ts
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getCollection,
  addToCollection,
  updateCollectionItem,
  removeFromCollection,
  getCollectionSnapshots,
  saveCollectionSnapshot,
  generateItemId,
} from "@/lib/collection";
import type {
  CollectionItem,
  CollectionItemWithPrice,
  CollectionSnapshot,
  CollectionSummary,
  CollectionFormData,
} from "@/types/collection";
import type { Item } from "@/lib/analyse/types";

type UseCollectionReturn = {
  items: CollectionItemWithPrice[];
  snapshots: CollectionSnapshot[];
  summary: CollectionSummary;
  loading: boolean;
  error: string | null;
  addItem: (item: Item, formData: CollectionFormData) => Promise<boolean>;
  updateItem: (itemId: string, updates: Partial<Pick<CollectionItem, "quantity" | "purchase">>) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  isInCollection: (item: Item) => boolean;
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

/**
 * Hook for managing user collection
 */
export function useCollection(allItems: Item[] = []): UseCollectionReturn {
  const { user } = useAuth();
  const [collectionItems, setCollectionItems] = useState<CollectionItem[]>([]);
  const [snapshots, setSnapshots] = useState<CollectionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create a map of itemId to Item for quick lookup
  const itemsMap = useMemo(() => {
    const map = new Map<string, Item>();
    for (const item of allItems) {
      const id = generateItemId(item);
      map.set(id, item);
    }
    return map;
  }, [allItems]);

  // Fetch collection data
  const fetchCollection = useCallback(async () => {
    if (!user) {
      setCollectionItems([]);
      setSnapshots([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [items, snapshotData] = await Promise.all([
        getCollection(user.uid),
        getCollectionSnapshots(user.uid, 90),
      ]);

      setCollectionItems(items);

      // Filter snapshots to only include dates >= collection start date
      if (items.length > 0) {
        const collectionStartDate = items.reduce((earliest, item) => {
          const addedAt = item.addedAt instanceof Date ? item.addedAt : new Date(item.addedAt);
          const dateStr = addedAt.toISOString().slice(0, 10);
          return dateStr < earliest ? dateStr : earliest;
        }, new Date().toISOString().slice(0, 10));

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

    const profitLoss = totalCost > 0 ? totalValue - totalCost : 0;
    const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      totalItems: itemsWithPrices.length,
      totalQuantity,
      profitLoss,
      profitLossPercent,
    };
  }, [itemsWithPrices]);

  // Recalculate snapshots based on actual indexed prices
  // Starting from the date the first item was added to the collection
  useEffect(() => {
    if (!user || loading || collectionItems.length === 0 || allItems.length === 0) return;

    const recalculateSnapshots = async () => {
      try {
        // Find the earliest date an item was added to the collection
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

        // For each indexed date, calculate collection value
        for (const date of indexedDates) {
          // Skip dates before the collection was created
          if (date < collectionStartDate) continue;

          // Calculate value for this date
          let totalValue = 0;
          let itemsWithPriceCount = 0;

          for (const collectionItem of collectionItems) {
            // Only count items that were in the collection at this date
            const addedAt = collectionItem.addedAt instanceof Date
              ? collectionItem.addedAt
              : new Date(collectionItem.addedAt);
            const addedAtStr = addedAt.toISOString().slice(0, 10);
            if (date < addedAtStr) continue; // Item wasn't in collection yet

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
  }, [user, loading, collectionItems, allItems, itemsMap, itemsWithPrices]);

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

  // Update collection item
  const updateItem = useCallback(async (
    itemId: string,
    updates: Partial<Pick<CollectionItem, "quantity" | "purchase">>
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

  return {
    items: itemsWithPrices,
    snapshots,
    summary,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    refresh: fetchCollection,
    isInCollection: isInCollectionCheck,
  };
}
