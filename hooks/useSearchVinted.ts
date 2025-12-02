import { useCallback, useEffect, useRef, useState } from "react";
import { fetchVintedSearch, postVintedFilter } from "@/lib/api";
import { cleanVintedHtml } from "@/lib/cleanVintedHtml";

type VintedResult = {
  filteredVinted?: any;
  minPrice?: number | null;
};

// --- UTIL --- //
function normalizeQuery(q: string) {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}

// --- CACHE GLOBAL + PERSISTENT --- //
const cache = new Map<string, VintedResult>();
const CACHE_KEY = "vinted_cache";

// Recuperation du cache persistent
(function loadCache() {
  if (typeof window === "undefined") return;
  const saved = localStorage.getItem(CACHE_KEY);
  if (!saved) return;

  try {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([k, v]) => cache.set(k, v as VintedResult));
  } catch {}
})();

function saveCacheToStorage() {
  if (typeof window === "undefined") return;
  const obj = Object.fromEntries(cache.entries());
  localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
}

export function useSearchVinted() {
  const controllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (query: string): Promise<VintedResult | null> => {
    if (!query) return null;

    const norm = normalizeQuery(query);

    // Si le même query est en cours → éviter double requête
    if (loading && lastQueryRef.current === norm) return null;

    lastQueryRef.current = norm;

    // --- CACHE ---
    if (cache.has(norm)) {
      return cache.get(norm)!;
    }

    // Annuler requête précédente
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      // Lancer fetch immédiat (PROMESSE)
      const fetchPromise = fetchVintedSearch(norm, controller.signal);

      // Pendant ce temps → pipeline clean HTML dès qu’il arrive
      const rawPromise = fetchPromise.then((html) =>
        html ? cleanVintedHtml(html) : { items: [] }
      );

      // On attend les deux (HTML + cleaned)
      const [raw] = await Promise.all([rawPromise, fetchPromise]);

      // Filtrage
      const filteredVinted = await postVintedFilter(
        norm,
        raw.items || [],
        controller.signal
      );

      // Min price ultra rapide : tri + premier élément
      let minPrice: number | null = null;
      if (filteredVinted?.valid?.length) {
        const sorted = [...filteredVinted.valid].sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
        minPrice = parseFloat(sorted[0].price);
      }

      const result: VintedResult = { filteredVinted, minPrice };

      // Cache en mémoire + storage
      cache.set(norm, result);
      saveCacheToStorage();

      return result;
    } catch (err: any) {
      if (err.name === "AbortError") return null;
      console.error(err);
      setError("Erreur Vinted");
      return null;
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return {
    run,
    cancel,
    loading,
    error,
  } as const;
}
