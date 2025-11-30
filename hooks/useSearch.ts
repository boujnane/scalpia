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

function safe<T>(fn: () => Promise<T>, label?: string): Promise<T | null> {
    return fn().catch(err => {
      console.warn(`${label || 'Step'} failed`, err);
      return null;
    });
  }
  
  export function useSearch() {
    const controllerRef = useRef<AbortController | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cleaned, setCleaned] = useState<any | null>(null);
    const [vinted, setVinted] = useState<any | null>(null);
    const [soldItems, setSoldItems] = useState<FilterResult<CleanSoldItem> | null>(null);
    const [sold, setSold] = useState<CleanSoldItem[] | null>(null);
  
    useEffect(() => {
      return () => controllerRef.current?.abort();
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
  
      const result: {
        cleaned?: any;
        filteredVinted?: any;
        filteredSold?: any;
        minPrice?: number | null;
        minPriceSold?: number | null;
        sold?: CleanSoldItem[];
      } = {};
  
      try {
        // eBay search
        const html = await safe(() => fetchEbaySearch(query, controller.signal), 'eBay search');
        if (html) {
          const cleanedHtml = cleanEbayHtml(html);
          setCleaned(cleanedHtml);
          result.cleaned = cleanedHtml;
          onProgress?.(20);
        }
  
        // eBay sold
        const soldHtml = await safe(() => fetchEbaySold(query, controller.signal), 'eBay sold');
        const rawSold = soldHtml ? cleanSoldEbayHtml(soldHtml) : [];
        setSold(rawSold);
        result.sold = rawSold;
        onProgress?.(30);
  
        // eBay filter
        const filteredSold = await safe(() => postEbayFilter(query, rawSold, controller.signal), 'eBay filter');
        if (filteredSold) {
          const minPriceSold =
            filteredSold.valid?.length
              ? Math.min(...filteredSold.valid.map((i: any) => parseFloat(String(i.price))).filter((p: number) => !isNaN(p)))
              : null;
          setSoldItems({ ...filteredSold, minPrice: minPriceSold });
          result.filteredSold = filteredSold;
          result.minPriceSold = minPriceSold;
        }
  
        // Vinted search
        const vintedHtml = await safe(() => fetchVintedSearch(query, controller.signal), 'Vinted search');
        const rawVinted = vintedHtml ? cleanVintedHtml(vintedHtml) : { items: [] };
  
        // Vinted filter
        const filteredVinted = await safe(() => postVintedFilter(query, rawVinted.items || [], controller.signal), 'Vinted filter');
        if (filteredVinted) {
          setVinted(filteredVinted);
          result.filteredVinted = filteredVinted;
  
          const minPrice =
            filteredVinted.valid?.length
              ? Math.min(...filteredVinted.valid.map((i: any) => parseFloat(String(i.price))).filter((p: number) => !isNaN(p)))
              : null;
          result.minPrice = minPrice;
        }
  
        onProgress?.(100);
        return result;
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
  