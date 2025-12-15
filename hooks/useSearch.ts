import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchEbaySearch,
  fetchEbaySold,
  postEbayFilter,
  fetchVintedSearch,
  postVintedFilter,
  // 💡 Import des fonctions LBC
  fetchLeboncoinSearch,
  postLeboncoinFilter,
} from '@/lib/api';
import { cleanEbayHtml } from '@/lib/cleanEbayHtml';
import { cleanSoldEbayHtml, CleanSoldItem } from '@/lib/cleanSoldEbayHtml';
import { cleanVintedHtml } from '@/lib/cleanVintedHtml';
import { FilterResult, LBCOffer } from '@/types'; // Ajout de LBCOffer et s'assurer que FilterResult est bien importé

// Définition du type de résultat LBC pour useSearch
export type LBCResult = {
  valid: LBCOffer[]; // Renommée 'offers' en 'valid' pour cohérence avec FilterResult
  rejected: { title: string; reason: string }[];
  minPrice: number | null;
};

// 1. Fonction utilitaire pour convertir la chaîne de prix en nombre (Doit être en dehors de parseAndSortOffers)
const parsePrice = (price: string | number): number => {
  if (typeof price === "number") return price;
  if (!price) return 0;
  // Nettoyage: supprime tous les caractères sauf chiffres, virgules, points et signes
  // J'ai ajouté l'annotation : number pour plus de sécurité
  return Number(String(price).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
};

// 2. Fonction utilitaire pour parser et trier les prix
const parseAndSortOffers = (offers: LBCOffer[]): LBCOffer[] => {
  return offers.slice().sort((a, b) => {
    // Utilise la fonction parsePrice extraite
    const priceA = parsePrice(a.price);
    const priceB = parsePrice(b.price);
    return priceA - priceB;
  });
};


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
    // 💡 NOUVEL ÉTAT LBC
    const [leboncoin, setLeboncoin] = useState<LBCResult | null>(null);
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
      setLeboncoin(null); // Réinitialisation LBC
      setSold(null);
      setSoldItems(null);
  
      const result: {
        cleaned?: any;
        filteredVinted?: any;
        filteredSold?: any;
        filteredLBC?: any; // Pour le résultat LBC
        minPrice?: number | null;
        minPriceSold?: number | null;
        minPriceLBC?: number | null; // Pour le prix LBC
        sold?: CleanSoldItem[];
      } = {};
  
      try {
        // --- ETAPE 1: eBay search et nettoyage (0% -> 20%) ---
        const html = await safe(() => fetchEbaySearch(query, controller.signal), 'eBay search');
        if (html) {
          const cleanedHtml = cleanEbayHtml(html);
          setCleaned(cleanedHtml);
          result.cleaned = cleanedHtml;
          onProgress?.(20);
        }
  
        // --- ETAPE 2: eBay sold et nettoyage (20% -> 30%) ---
        const soldHtml = await safe(() => fetchEbaySold(query, controller.signal), 'eBay sold');
        const rawSold = soldHtml ? cleanSoldEbayHtml(soldHtml) : [];
        setSold(rawSold);
        result.sold = rawSold;
        onProgress?.(30);
  
        // --- ETAPE 3: eBay filter (30% -> 40%) ---
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
        onProgress?.(40);
  
        // --- ETAPE 4: Vinted search et nettoyage (40% -> 60%) ---
        const vintedHtml = await safe(() => fetchVintedSearch(query, controller.signal), 'Vinted search');
        const rawVinted = vintedHtml ? cleanVintedHtml(vintedHtml) : { items: [] };
        onProgress?.(60);
  
        // --- ETAPE 5: Vinted filter (60% -> 70%) ---
        const filteredVinted = await safe(() => postVintedFilter(query, rawVinted.items || [], controller.signal), 'Vinted filter');
        if (filteredVinted) {
          // Calcul du prix minimum Vinted
          const minPrice =
            filteredVinted.valid?.length
              ? Math.min(...filteredVinted.valid.map((i: any) => parseFloat(String(i.price))).filter((p: number) => !isNaN(p)))
              : null;
          setVinted({ ...filteredVinted, minPrice: minPrice });
          result.filteredVinted = filteredVinted;
          result.minPrice = minPrice;
        }
        onProgress?.(70);


        // --- ETAPE 6: Le Bon Coin Search (70% -> 85%) ---
        const rawLBCData = await safe(() => fetchLeboncoinSearch(query, controller.signal), 'LBC search');
        const rawLBCOffers: LBCOffer[] = rawLBCData?.offers || [];
        onProgress?.(85);

        // --- ETAPE 7: Le Bon Coin Filter et traitement (85% -> 100%) ---
        if (rawLBCOffers.length > 0) {
            const filteredLBC = await safe(() => postLeboncoinFilter(query, rawLBCOffers, controller.signal), 'LBC filter');

            if (filteredLBC) {
                // 3️⃣ Fusionner et récupérer les offres validées
                const validOffers: LBCOffer[] = (filteredLBC.valid || []).map((validItem: any) => {
                    const original = rawLBCOffers.find(o => o.link === validItem.url);
                    return original ? { ...original } : validItem;
                });
            
                // 4️⃣ Trier par prix croissant
                const sortedOffers = parseAndSortOffers(validOffers);
                
                // ✅ CORRECTION ICI : Utilisation explicite de parsePrice pour Math.min
                const minPriceLBC =
                    sortedOffers.length
                    ? Math.min(
                        ...sortedOffers
                            .map((i: LBCOffer) => parsePrice(i.price)) // Convertit le prix en nombre
                            .filter((p: number) => !isNaN(p))
                        )
                    : null;

                const lbcResult: LBCResult = {
                    valid: sortedOffers,
                    rejected: filteredLBC.rejected || [],
                    minPrice: minPriceLBC,
                };
                
                setLeboncoin(lbcResult);
                result.filteredLBC = lbcResult;
                result.minPriceLBC = minPriceLBC;
            }
        } else {
            setLeboncoin({ valid: [], rejected: [], minPrice: null });
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
      leboncoin, // 💡 NOUVEL EXPORT
      soldItems,
      sold,
    } as const;
  }