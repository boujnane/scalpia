// hooks/useAnalyseItems.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import type { Item } from "@/lib/analyse/types";

const CACHE_KEY = "analyse_items_cache";
const CLIENT_CACHE_TTL = 2 * 60 * 1000; // 2 minutes côté client

type CacheData = {
  items: Item[];
  timestamp: number;
};

type UseAnalyseItemsReturn = {
  items: Item[];
  loading: boolean;
  error: string | null;
  fromCache: boolean;
  refresh: () => Promise<void>;
};

function getClientCache(): CacheData | null {
  if (typeof window === "undefined") return null;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as CacheData;
    const now = Date.now();

    // Vérifier si le cache client est encore valide
    if (now - parsed.timestamp < CLIENT_CACHE_TTL) {
      return parsed;
    }

    // Cache expiré, le supprimer
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function setClientCache(items: Item[]): void {
  if (typeof window === "undefined") return;

  try {
    const cacheData: CacheData = {
      items,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (e) {
    // sessionStorage plein ou désactivé
    console.warn("Could not cache items in sessionStorage:", e);
  }
}

export function useAnalyseItems(): UseAnalyseItemsReturn {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);

  const fetchItems = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    // Vérifier le cache client d'abord (sauf si refresh forcé)
    if (!forceRefresh) {
      const clientCache = getClientCache();
      if (clientCache) {
        setItems(clientCache.items);
        setFromCache(true);
        setLoading(false);
        return;
      }
    } else {
      // Forcer le refresh = vider aussi le cache client
      sessionStorage.removeItem(CACHE_KEY);
    }

    try {
      // Ajouter le param refresh=true pour forcer le refresh côté serveur aussi
      const url = forceRefresh ? "/api/analyse/items?refresh=true" : "/api/analyse/items";
      const response = await fetch(url, {
        // Utiliser le cache HTTP pour les requêtes identiques
        cache: forceRefresh ? "no-store" : "default",
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setItems(data.items);
      setFromCache(data.fromCache);

      // Sauvegarder dans le cache client
      setClientCache(data.items);
    } catch (err) {
      console.error("Error fetching analyse items:", err);
      setError(err instanceof Error ? err.message : "Unknown error");

      // Essayer de récupérer depuis le cache même expiré en cas d'erreur
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as CacheData;
          setItems(parsed.items);
          setFromCache(true);
        }
      } catch {
        // Pas de fallback possible
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchItems(true);
  }, [fetchItems]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, fromCache, refresh };
}
