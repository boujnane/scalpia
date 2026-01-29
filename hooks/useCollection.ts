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
  getTodaySnapshot,
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
      setSnapshots(snapshotData);
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

  // Lazy snapshot: create today's snapshot if it doesn't exist
  useEffect(() => {
    if (!user || loading || itemsWithPrices.length === 0) return;

    const createTodaySnapshot = async () => {
      try {
        const existing = await getTodaySnapshot(user.uid);
        if (existing) return;

        const today = new Date().toISOString().slice(0, 10);
        await saveCollectionSnapshot(user.uid, {
          date: today,
          totalValue: summary.totalValue,
          totalCost: summary.totalCost,
          itemCount: summary.totalItems,
        });

        // Refresh snapshots
        const newSnapshots = await getCollectionSnapshots(user.uid, 90);
        setSnapshots(newSnapshots);
      } catch (err) {
        console.error("Error creating snapshot:", err);
      }
    };

    createTodaySnapshot();
  }, [user, loading, itemsWithPrices.length, summary]);

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
