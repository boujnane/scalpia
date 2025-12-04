import { useCallback, useRef, useState } from "react";
import { fetchVintedSearch, postVintedFilter } from "@/lib/api";
import { cleanVintedHtml } from "@/lib/cleanVintedHtml";

type VintedResult = {
  filteredVinted?: any;
  minPrice?: number | null;
};

// --- CACHE MEMOIRE UNIQUEMENT ---
const cache = new Map<string, VintedResult>();

function normalizeQuery(q: string) {
  return q.toLowerCase().trim().replace(/\s+/g, " ");
}

export function useSearchVinted() {
  const controllerRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (query: string): Promise<VintedResult | null> => {
      if (!query) return null;

      const norm = normalizeQuery(query);

      if (loading && lastQueryRef.current === norm) return null;
      lastQueryRef.current = norm;

      // --- CACHE MEMOIRE ---
      if (cache.has(norm)) {
        return cache.get(norm)!;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const fetchPromise = fetchVintedSearch(norm, controller.signal);

        const rawPromise = fetchPromise.then((html) =>
          html ? cleanVintedHtml(html) : { items: [] }
        );

        const [raw] = await Promise.all([rawPromise, fetchPromise]);

        const filteredVinted = await postVintedFilter(
          norm,
          raw.items || [],
          controller.signal
        );

        let minPrice: number | null = null;
        if (filteredVinted?.valid?.length) {
          const sorted = [...filteredVinted.valid].sort(
            (a, b) => parseFloat(a.price) - parseFloat(b.price)
          );
          minPrice = parseFloat(sorted[0].price);
        }

        const result: VintedResult = { filteredVinted, minPrice };

        // Sauvegarde uniquement en mémoire
        cache.set(norm, result);

        return result;
      } catch (err: any) {
        if (err.name === "AbortError") return null;
        console.error(err);
        setError("Erreur Vinted");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return {
    run,
    cancel,
    loading,
    error,
  } as const;
}
