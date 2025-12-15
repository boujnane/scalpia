// useLeboncoinSearch.ts

import { useState, useCallback } from "react";
import { LBCOffer } from "@/types"; // Assurez-vous que le chemin est correct
import { fetchLeboncoinSearch, postLeboncoinFilter } from "@/lib/api";

export type LBCRejected = { title: string; reason: string };
export type LBCResult = {
  offers: LBCOffer[];
  rejected: LBCRejected[];
};

// Fonction utilitaire pour parser et trier les prix
const parseAndSortOffers = (offers: LBCOffer[]): LBCOffer[] => {
  return offers.slice().sort((a, b) => {
    const parsePrice = (price: string | number) => {
      if (typeof price === "number") return price;
      if (!price) return 0;
      // Nettoyage: supprime tous les caractères sauf chiffres, virgules, points et signes
      return Number(String(price).replace(/[^\d,.-]/g, "").replace(",", ".")) || 0;
    };
  
    const priceA = parsePrice(a.price);
    const priceB = parsePrice(b.price);
    return priceA - priceB;
  });
};

export function useLeboncoinSearch() {
  const [result, setResult] = useState<LBCResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query) return;

    setLoading(true);
    setError(null);
    setResult(null);
  
    const abortController = new AbortController();
    const { signal } = abortController;
    
    try {
      // 1️⃣ Récupérer les offres brutes
      const rawData = await fetchLeboncoinSearch(query, signal);
      const offers: LBCOffer[] = rawData.offers || [];

      if (offers.length === 0) {
        setResult({ offers: [], rejected: [] });
        return;
      }
  
      // 2️⃣ Appeler le filtrage IA
      const filteredData = await postLeboncoinFilter(query, offers, signal);
  
      // 3️⃣ Fusionner et récupérer les offres validées par l'IA
      const validOffers = (filteredData.valid || []).map((validItem: any) => {
        // Chercher l'offre originale (avec toutes les données)
        const original = offers.find(o => o.link === validItem.url);
        // Si trouvé, on retourne l'original, sinon (fallback) on retourne ce que l'IA a validé.
        return original ? { ...original } : validItem;
      });
  
      // 4️⃣ Trier par prix croissant
      const sortedOffers = parseAndSortOffers(validOffers);
  
      setResult({
        offers: sortedOffers,
        rejected: filteredData.rejected || [],
      });
      
    } catch (e) {
      if (e instanceof Error) {
        // Gérer l'erreur d'annulation
        if (e.name === 'AbortError') {
          console.log('Requête annulée');
        } else {
          setError(e.message);
        }
      } else {
        setError("Une erreur inattendue est survenue.");
      }
    } finally {
      setLoading(false);
    }
    
    return () => abortController.abort(); // Fonction de nettoyage (non utilisée ici, mais bonne pratique)
  }, []);

  return { result, loading, error, search };
}