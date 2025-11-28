import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchEbaySearch,
  fetchEbaySold,
  postEbayFilter,
  fetchVintedSearch,
  postVintedFilter,
} from '@/lib/api';
import { cleanEbayHtml } from '@/lib/cleanEbayHtml';
import { cleanSoldEbayHtml, CleanSoldItem } from '@/lib/cleanSoldEbayHtml';
import { cleanVintedHtml } from '@/lib/cleanVintedHtml';
import { FilterResult } from '@/types';

export function useSearch() {
  const controllerRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cleaned, setCleaned] = useState<any | null>(null);
  const [vinted, setVinted] = useState<any | null>(null);
  const [soldItems, setSoldItems] = useState<FilterResult<CleanSoldItem> | null>(null);
  const [sold, setSold] = useState<CleanSoldItem[] | null>(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const run = useCallback(async (query: string, onProgress?: (p: number) => void) => {
    if (!query) return null;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError(null);
    setCleaned(null);
    setVinted(null);
    setSold(null);
    setSoldItems(null);

    try {
      onProgress?.(5);
      const html = await fetchEbaySearch(query, controller.signal);
      setCleaned(cleanEbayHtml(html));
      onProgress?.(20);

      const soldHtml = await fetchEbaySold(query, controller.signal);
      const rawSold = cleanSoldEbayHtml(soldHtml);
      setSold(rawSold);
      onProgress?.(30);

      const filteredSold = await postEbayFilter(query, rawSold, controller.signal);
      onProgress?.(40);

      const vintedHtml = await fetchVintedSearch(query, controller.signal);
      const rawVinted = cleanVintedHtml(vintedHtml);
      onProgress?.(75);

      const filteredVinted = await postVintedFilter(query, rawVinted.items || [], controller.signal);
      setVinted(filteredVinted);

      // Calcul du prix minimal sur Vinted
      let minPrice: number | null = null;
      if (filteredVinted.valid?.length) {
        const prices = filteredVinted.valid
          .map((item: any) => parseFloat(String(item.price)))
          .filter((p: number) => !isNaN(p));
        minPrice = prices.length > 0 ? Math.min(...prices) : null;
      }

      // Mettre à jour soldItems avec le minPrice sur les ventes Ebay
      let minPriceSold: number | null = null;
      if (filteredSold.valid?.length) {
        const prices = filteredSold.valid
          .map((item: any) => parseFloat(String(item.price)))
          .filter((p: number) => !isNaN(p));
        minPriceSold = prices.length > 0 ? Math.min(...prices) : null;
      }
      setSoldItems({ ...filteredSold, minPrice: minPriceSold });

      onProgress?.(100);

      // 🔹 Retour pour usage direct dans le composant
      return { filteredVinted, filteredSold, minPrice };
    } catch (err: any) {
      if (err.name === 'AbortError') return null;
      console.error(err);
      setError(err?.message || 'Erreur inconnue');
      onProgress?.(0);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => controllerRef.current?.abort(), []);

  return {
    run,
    cancel,
    loading,
    error,
    cleaned,
    vinted,
    soldItems,
    sold,
  } as const;
}
