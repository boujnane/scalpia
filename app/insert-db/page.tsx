"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  collectionGroup,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { insertPriceInDB } from "@/lib/insert-price";
import { useSearchVinted } from "@/hooks/useSearchVinted";
import { ChevronDown, ChevronUp, Loader2, Check, Square, CheckSquare } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import CardmarketButton from "@/components/CardmarketButton";
import { Button } from "@/components/ui/button";

import LBCItemCard from "@/components/leboncoin/LBCItemCard";
import {
  fetchLeboncoinSearch,
  postLeboncoinFilter,
  fetchEbaySold,
  postEbayFilter,
} from "@/lib/api";
import Fuse from "fuse.js";
import { LBCOffer } from "@/types";
import { normalizeLBCOffers, parseLBCPrice } from "@/lib/utils";
import { cleanSoldEbayHtml } from "@/lib/cleanSoldEbayHtml";
import ProtectedPage from "@/components/ProtectedPage";

type ItemEntry = {
  id: string;
  name?: string;
  type?: string;
  series?: string;
  cardmarketUrl?: string | null;
};

type PrefetchData = {
  vinted?: any;
  lbc?: LBCOffer[];
  ebay?: any;
  minPrice?: number;
  error?: string;
  timestamp?: number;
};

export default function InsertDbPage() {
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [currentMinPrice, setCurrentMinPrice] = useState<number | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [vintedResults, setVintedResults] = useState<any | null>(null);
  const [lbcResults, setLbcResults] = useState<LBCOffer[]>([]);
  const [ebayResults, setEbayResults] = useState<any | null>(null);

  const [saving, setSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [cardmarketUrl, setCardmarketUrl] = useState<string | null>(null);
  const [priceUnavailable, setPriceUnavailable] = useState(false);

  const [openVinted, setOpenVinted] = useState(true);
  const [openCardmarket, setOpenCardmarket] = useState(true);

  const { run: searchVinted, loading: searchLoading } = useSearchVinted();
  const [itemsWithPriceToday, setItemsWithPriceToday] = useState<Set<string>>(new Set());

  const [yesterdayPrice, setYesterdayPrice] = useState<number | null>(null);
  const [yesterdayDate, setYesterdayDate] = useState<string | null>(null);

  // Cache et prefetch
  const prefetchCache = useRef<Map<string, PrefetchData>>(new Map());
  const prefetchingRef = useRef<Set<string>>(new Set());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const [prefetchStatus, setPrefetchStatus] = useState<{itemId: string, status: string} | null>(null);

  // Nouveaux états pour le contrôle manuel
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [autoSkipProcessed, setAutoSkipProcessed] = useState(true);
  const [showOnlyUnprocessed, setShowOnlyUnprocessed] = useState(false);
  const [batchPrefetching, setBatchPrefetching] = useState(false);

  // Load items from Firestore
  useEffect(() => {
    const fetchItemsWithPriceToday = async () => {
      // 1) Items
      const snapshot = await getDocs(collection(db, "items"));
      const list: ItemEntry[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          name: data.name ?? data.title ?? "",
          type: data.type ?? "",
          series: data.series ?? "",
          cardmarketUrl: data.cardmarketUrl ?? null,
        };
      });
      setItems(list);
  
      // 2) Items traités aujourd’hui (1 requête via collectionGroup)
      const today = new Date().toISOString().slice(0, 10);
  
      const pricesTodaySnap = await getDocs(
        query(collectionGroup(db, "prices"), where("date", "==", today))
      );
  
      const itemsToday = new Set<string>();
      pricesTodaySnap.forEach((priceDoc) => {
        const itemId = priceDoc.ref.parent.parent?.id; // prices -> item
        if (itemId) itemsToday.add(itemId);
      });
  
      setItemsWithPriceToday(itemsToday);
    };
  
    fetchItemsWithPriceToday();
  }, []);
  

  const currentItem = items[currentIndex] || null;

  // Prefetch automatique désactivé - contrôle manuel uniquement
  

  useEffect(() => {
    if (!currentItem) return;
    setCardmarketUrl(currentItem.cardmarketUrl ?? null);
  }, [currentIndex, currentItem]);

  // Fetch yesterday price
  useEffect(() => {
    const fetchYesterdayPrice = async () => {
      if (!currentItem) return;

      setYesterdayPrice(null);
      setYesterdayDate(null);

      const pricesSnap = await getDocs(collection(db, `items/${currentItem.id}/prices`));
      if (pricesSnap.empty) return;

      const prices = pricesSnap.docs.map((doc) => doc.data() as any);
      prices.sort((a, b) => (a.date < b.date ? 1 : -1));

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      const priceYesterday = prices.find((p) => p.date === yesterdayStr);
      if (priceYesterday) {
        setYesterdayPrice(priceYesterday.price);
        setYesterdayDate(priceYesterday.date);
        return;
      }

      setYesterdayPrice(prices[0].price);
      setYesterdayDate(prices[0].date);
    };

    fetchYesterdayPrice();
  }, [currentItem]);

  // Fonction de prefetch optimisée
  const prefetchItem = async (item: ItemEntry) => {
    // Éviter de prefetch si déjà en cours ou déjà en cache
    if (prefetchingRef.current.has(item.id)) {
      console.log(`⏭️ Prefetch déjà en cours pour: ${item.name}`);
      return;
    }

    // Si en cache et récent (< 5 min), ne pas re-fetch
    const cached = prefetchCache.current.get(item.id);
    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp;
      if (age < 5 * 60 * 1000) { // 5 minutes
        console.log(`✅ Cache valide pour: ${item.name} (${Math.round(age/1000)}s)`);
        return;
      }
    }

    const queryStr = `${item.type} ${item.name}`.trim();
    if (!queryStr) {
      console.log(`⚠️ Query vide pour: ${item.name}`);
      return;
    }

    prefetchingRef.current.add(item.id);
    setPrefetchStatus({ itemId: item.id, status: 'loading' });

    // AbortController pour pouvoir annuler
    const controller = new AbortController();
    abortControllersRef.current.set(item.id, controller);

    try {
      console.log(`🔄 Prefetch démarré: ${item.name}`);

      // Prefetch Vinted (utilise son propre cache interne)
      const vintedPromise = searchVinted(queryStr);

      // Prefetch LBC en parallèle
      const lbcPromise = (async () => {
        try {
          const lbcRaw = await fetchLeboncoinSearch(queryStr, controller.signal);
          
          if (!lbcRaw?.offers || lbcRaw.offers.length === 0) {
            console.log(`ℹ️ Pas d'offres LBC pour: ${item.name}`);
            return { offers: [], minPrice: null };
          }

          const normalizedOffers = normalizeLBCOffers(lbcRaw.offers);
          
          if (normalizedOffers.length === 0) {
            console.log(`⚠️ Aucune offre LBC valide pour: ${item.name}`);
            return { offers: [], minPrice: null };
          }

          const filtered = await postLeboncoinFilter(queryStr, normalizedOffers, controller.signal);

          const validOffers: LBCOffer[] = (filtered.valid || []).map((v: any) => {
            const original = normalizedOffers.find(o =>
              o.link === v.url ||
              o.link?.includes(v.url) ||
              v.url.includes(o.link)
            );
          
            return original ?? {
              title: v.title,
              link: v.url,
              price: v.price ?? "",
              images: [],
              location: "",
              date: "",
            };
          });
          

          if (validOffers.length === 0) {
            console.log(`⚠️ Toutes les offres LBC rejetées pour: ${item.name}`);
            return { offers: [], minPrice: null };
          }

          const sorted = validOffers
            .sort((a, b) => parseLBCPrice(a.price) - parseLBCPrice(b.price))
            .slice(0, 30);

          const minLBCPrice = sorted.length > 0 ? parseLBCPrice(sorted[0].price) : null;

          return { offers: sorted, minPrice: minLBCPrice };
        } catch (err: any) {
          if (err.name === 'AbortError') throw err;
          console.error(`❌ Erreur LBC pour ${item.name}:`, err);
          return { offers: [], minPrice: null };
        }
      })();

      const ebayPromise = (async () => {
        try {
          const ebayHtml = await fetchEbaySold(queryStr, controller.signal);
          const rawEbay = ebayHtml ? cleanSoldEbayHtml(ebayHtml) : [];

          if (rawEbay.length === 0) {
            console.log(`ℹ️ Pas d'offres eBay pour: ${item.name}`);
            return { valid: [], minPrice: null, rejected: [] };
          }

          const filtered = await postEbayFilter(queryStr, rawEbay, controller.signal);
          const validItems = filtered?.valid || [];
          const prices = validItems
            .map((offer: any) => parseEbayPrice(offer.price))
            .filter((p: number) => !Number.isNaN(p));
          const minPrice = prices.length > 0 ? Math.min(...prices) : null;

          return { ...filtered, minPrice };
        } catch (err: any) {
          if (err.name === "AbortError") throw err;
          console.error(`❌ Erreur eBay pour ${item.name}:`, err);
          return { valid: [], minPrice: null, rejected: [] };
        }
      })();

      // Attendre les recherches
      const [vintedData, lbcData, ebayData] = await Promise.all([
        vintedPromise,
        lbcPromise,
        ebayPromise,
      ]);

      // Calculer le prix minimum entre Vinted, LBC et eBay
      const prices = [
        vintedData?.minPrice,
        lbcData.minPrice,
        ebayData.minPrice,
      ].filter((p): p is number => p !== null && p !== undefined && !isNaN(p));

      const finalMinPrice = prices.length > 0 ? Math.min(...prices) : null;

      // Stocker dans le cache avec timestamp
      prefetchCache.current.set(item.id, {
        vinted: vintedData,
        lbc: lbcData.offers,
        ebay: ebayData,
        minPrice: finalMinPrice ?? undefined,
        timestamp: Date.now(),
      });

      console.log(`✅ Prefetch réussi: ${item.name} - Prix min: ${finalMinPrice}€`);
      setPrefetchStatus({ itemId: item.id, status: 'success' });
      
      // Clear status after 2s
      setTimeout(() => {
        setPrefetchStatus(prev => prev?.itemId === item.id ? null : prev);
      }, 2000);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`🚫 Prefetch annulé: ${item.name}`);
        return;
      }
      
      console.error(`❌ Erreur prefetch pour ${item.name}:`, err);
      prefetchCache.current.set(item.id, {
        error: err.message || "Erreur inconnue",
        timestamp: Date.now(),
      });
      setPrefetchStatus({ itemId: item.id, status: 'error' });
    } finally {
      prefetchingRef.current.delete(item.id);
      abortControllersRef.current.delete(item.id);
    }
  };

  // Fonctions de batch prefetch manuel
  const handleBatchPrefetch = async (itemIds: string[]) => {
    setBatchPrefetching(true);
    for (const id of itemIds) {
      const item = items.find(i => i.id === id);
      if (item && !prefetchCache.current.has(id)) {
        try {
          await prefetchItem(item);
        } catch (err) {
          console.error(`Erreur batch prefetch pour ${item.name}:`, err);
          // Continue avec le prochain item même en cas d'erreur
        }
        // Petit délai entre chaque item pour laisser les browsers se fermer
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    setBatchPrefetching(false);
    setSelectedItems(new Set()); // Clear selection après prefetch
  };

  const handlePrefetchNext = async (count: number) => {
    setBatchPrefetching(true);
    const unprocessedItems = items
      .slice(currentIndex)
      .filter(item => !itemsWithPriceToday.has(item.id))
      .slice(0, count);

    for (const item of unprocessedItems) {
      if (!prefetchCache.current.has(item.id)) {
        try {
          await prefetchItem(item);
        } catch (err) {
          console.error(`Erreur batch prefetch pour ${item.name}:`, err);
          // Continue avec le prochain item même en cas d'erreur
        }
        // Petit délai entre chaque item pour laisser les browsers se fermer
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    setBatchPrefetching(false);
  };

  const handlePrefetchSelected = () => {
    handleBatchPrefetch(Array.from(selectedItems));
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const selectAllUnprocessed = () => {
    const unprocessedIds = items
      .filter(item => !itemsWithPriceToday.has(item.id))
      .map(item => item.id);
    setSelectedItems(new Set(unprocessedIds));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  // Charger les données depuis le cache pour l'item actuel
  useEffect(() => {
    if (!currentItem) return;

    const cached = prefetchCache.current.get(currentItem.id);
    
    if (cached) {
      const age = cached.timestamp ? Math.round((Date.now() - cached.timestamp) / 1000) : 0;
      console.log(`📦 Chargement depuis le cache: ${currentItem.name} (${age}s)`);
      
      if (cached.error) {
        setCurrentError(cached.error);
        setVintedResults(null);
        setLbcResults([]);
        setEbayResults(null);
        setCurrentMinPrice(null);
      } else {
        setVintedResults(cached.vinted || null);
        setLbcResults(cached.lbc || []);
        setEbayResults(cached.ebay || null);
        setCurrentMinPrice(cached.minPrice ?? null);
        setCurrentError(null);
      }
    } else {
      // Pas de cache, réinitialiser
      console.log(`🔍 Pas de cache pour: ${currentItem.name}`);
      setVintedResults(null);
      setLbcResults([]);
      setEbayResults(null);
      setCurrentMinPrice(null);
      setCurrentError(null);
    }
  }, [currentItem]);

  // Cleanup: annuler tous les prefetch en cours au démontage
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  // Actions
  const handleSearchVintedFuzzy = async () => {
    if (!currentItem) return;
    const queryStr = `${currentItem.type} ${currentItem.name}`.trim();
    if (!queryStr) return setCurrentError("Type ou nom manquant");

    setCurrentMinPrice(null);
    setCurrentError(null);
    setVintedResults(null);

    try {
      const vintedData = await searchVinted(queryStr);

      const fuse = new Fuse(vintedData?.filteredVinted.valid || [], {
        keys: ["title"],
        threshold: 0.3,
      });

      const fuzzyResults = fuse.search(queryStr).map(r => r.item).slice(0, 10);

      const result = {
        filteredVinted: { valid: fuzzyResults },
        minPrice: fuzzyResults.length > 0 ? Math.min(...fuzzyResults.map((item: any) => item.price)) : null,
      };

      setVintedResults(result);
      setCurrentMinPrice(result.minPrice);

      // Mettre à jour le cache
      const currentCache = prefetchCache.current.get(currentItem.id) || {};
      prefetchCache.current.set(currentItem.id, {
        ...currentCache,
        vinted: result,
        minPrice: result.minPrice ?? currentCache.minPrice,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setCurrentError(err.message || "Erreur inconnue");
    }
  };

  const handleUseYesterdayPrice = () => {
    if (yesterdayPrice !== null) setCurrentMinPrice(yesterdayPrice);
  };

  const handleSearchVinted = async () => {
    if (!currentItem) return;
    const queryStr = `${currentItem.type} ${currentItem.name}`.trim();
    if (!queryStr) return setCurrentError("Type ou nom manquant");

    setCurrentMinPrice(null);
    setCurrentError(null);
    setVintedResults(null);

    try {
      const vintedData = await searchVinted(queryStr);
      if (!vintedData) return setCurrentError("Erreur lors de la recherche Vinted");

      setCurrentMinPrice(vintedData.minPrice ?? null);
      setVintedResults({
        filteredVinted: {
          valid: (vintedData.filteredVinted?.valid || []).slice(0, 10),
        },
        minPrice: vintedData.minPrice,
      });

      // Mettre à jour le cache
      const currentCache = prefetchCache.current.get(currentItem.id) || {};
      prefetchCache.current.set(currentItem.id, {
        ...currentCache,
        vinted: vintedData,
        minPrice: vintedData.minPrice ?? currentCache.minPrice,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      setCurrentError(err.message || "Erreur inconnue");
    }
  };

  const handleSearchLBCFuzzy = async () => {
    if (!currentItem) return;

    const queryStr = `${currentItem.type} ${currentItem.name}`.trim();
    if (!queryStr) {
      setCurrentError("Type ou nom manquant");
      return;
    }

    setCurrentError(null);
    setCurrentMinPrice(null);
    setLbcResults([]);

    try {
      const lbcRaw = await fetchLeboncoinSearch(queryStr);
      const normalizedOffers = normalizeLBCOffers(lbcRaw.offers);

      if (normalizedOffers.length === 0) {
        setCurrentError("Aucune annonce Le Bon Coin valide");
        return;
      }

      const filtered = await postLeboncoinFilter(queryStr, normalizedOffers);

      const validOffers: LBCOffer[] = (filtered.valid || [])
        .map((v: any) => normalizedOffers.find((o) => o.link === v.url))
        .filter(Boolean) as LBCOffer[];

      if (validOffers.length === 0) {
        setCurrentError("Toutes les annonces ont été rejetées par l'IA");
        return;
      }

      const fuse = new Fuse(validOffers, {
        keys: ["title"],
        threshold: 0.3,
      });

      const fuzzyResults = fuse.search(queryStr).map((r) => r.item).slice(0, 30);
      const sorted = fuzzyResults.sort((a, b) => parseLBCPrice(a.price) - parseLBCPrice(b.price));

      setLbcResults(sorted);

      const minPrice = parseLBCPrice(sorted[0].price);
      if (!Number.isNaN(minPrice)) {
        setCurrentMinPrice(minPrice);
      }

      // Mettre à jour le cache
      const currentCache = prefetchCache.current.get(currentItem.id) || {};
      prefetchCache.current.set(currentItem.id, {
        ...currentCache,
        lbc: sorted,
        minPrice: minPrice,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error(err);
      setCurrentError(err.message || "Erreur Le Bon Coin");
    }
  };

  const parseVintedPrice = (value: any): number => {
    if (typeof value === "number") return value;
    if (!value) return NaN;
  
    return Number(
      value
        .toString()
        .replace(/\s/g, "")
        .replace(/\u202F/g, "")
        .replace(/[^\d]/g, "")
    );
  };

  const parseEbayPrice = (value: any): number => {
    if (typeof value === "number") return value;
    if (!value) return NaN;

    const raw = String(value).replace(/[^\d,.\s\u00A0\u202F]/g, "");
    const compact = raw.replace(/[\s\u00A0\u202F]/g, "");
    const hasComma = compact.includes(",");
    const hasDot = compact.includes(".");
    let normalized = compact;

    if (hasComma && hasDot) {
      if (compact.lastIndexOf(",") > compact.lastIndexOf(".")) {
        normalized = compact.replace(/\./g, "").replace(",", ".");
      } else {
        normalized = compact.replace(/,/g, "");
      }
    } else if (hasComma) {
      normalized = compact.replace(",", ".");
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  };

  const handleSearchEbay = async () => {
    if (!currentItem) return;
    const queryStr = `${currentItem.type} ${currentItem.name}`.trim();
    if (!queryStr) return setCurrentError("Type ou nom manquant");

    setCurrentError(null);
    setCurrentMinPrice(null);
    setEbayResults(null);

    try {
      const ebayHtml = await fetchEbaySold(queryStr);
      const rawEbay = ebayHtml ? cleanSoldEbayHtml(ebayHtml) : [];
      if (rawEbay.length === 0) {
        setCurrentError("Aucune annonce eBay");
        return;
      }

      const filtered = await postEbayFilter(queryStr, rawEbay);
      const validItems = filtered?.valid || [];
      const prices = validItems
        .map((offer: any) => parseEbayPrice(offer.price))
        .filter((p: number) => !Number.isNaN(p));
      const minPrice = prices.length > 0 ? Math.min(...prices) : null;

      const result = { ...filtered, minPrice };
      setEbayResults(result);
      if (minPrice !== null) setCurrentMinPrice(minPrice);

      const currentCache = prefetchCache.current.get(currentItem.id) || {};
      prefetchCache.current.set(currentItem.id, {
        ...currentCache,
        ebay: result,
        minPrice: minPrice ?? currentCache.minPrice,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error(err);
      setCurrentError(err.message || "Erreur eBay");
    }
  };
  

  const handleInsertPrice = async () => {
    if (!currentItem) return;
    // On peut enregistrer si on a un prix OU si le prix est marqué non disponible
    if (currentMinPrice === null && !priceUnavailable) return;

    // Bloquer si déjà traité aujourd'hui
    if (itemsWithPriceToday.has(currentItem.id)) {
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const priceToSave = priceUnavailable ? null : currentMinPrice;

    setSaving(true);
    try {
      await insertPriceInDB(currentItem.id, { date: today, price: priceToSave });
      setItemsWithPriceToday((prev) => new Set(prev).add(currentItem.id));
    } catch {
      alert("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  // Action combinée : Enregistrer + Suivant
  const handleInsertAndNext = async () => {
    if (!currentItem) return;
    // On peut enregistrer si on a un prix OU si le prix est marqué non disponible
    if (currentMinPrice === null && !priceUnavailable) {
      handleNext();
      return;
    }
    if (itemsWithPriceToday.has(currentItem.id)) {
      handleNext();
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    const priceToSave = priceUnavailable ? null : currentMinPrice;

    setSaving(true);
    try {
      await insertPriceInDB(currentItem.id, { date: today, price: priceToSave });
      setItemsWithPriceToday((prev) => new Set(prev).add(currentItem.id));
      handleNext();
    } catch {
      alert("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    let nextIndex = currentIndex + 1;

    // Auto-skip des items déjà traités si l'option est activée
    if (autoSkipProcessed) {
      while (nextIndex < items.length && itemsWithPriceToday.has(items[nextIndex].id)) {
        nextIndex++;
      }
    }

    // Boucler au début si on dépasse la liste
    if (nextIndex >= items.length) {
      nextIndex = 0;
      // Re-chercher le premier non-traité si auto-skip
      if (autoSkipProcessed) {
        while (nextIndex < items.length && itemsWithPriceToday.has(items[nextIndex].id)) {
          nextIndex++;
        }
        // Si tout est traité, rester sur 0
        if (nextIndex >= items.length) nextIndex = 0;
      }
    }

    setCurrentIndex(nextIndex);
    setCurrentMinPrice(null);
    setCurrentError(null);
    setEditingPrice(false);
    setCardmarketUrl(null);
    setPriceUnavailable(false);
    window.scrollTo(0, 0);
  };

  const handleDeleteItem = async () => {
    if (!currentItem) return;
    if (!window.confirm(`Supprimer "${currentItem.name}" ?`)) return;

    try {
      await deleteDoc(doc(db, "items", currentItem.id));
      
      // Supprimer du cache aussi
      prefetchCache.current.delete(currentItem.id);
      
      // Annuler prefetch en cours si existe
      const controller = abortControllersRef.current.get(currentItem.id);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(currentItem.id);
      }
      
      setItems((prev) => prev.filter((i) => i.id !== currentItem.id));
      setItemsWithPriceToday((prev) => {
        const next = new Set(prev);
        next.delete(currentItem.id);
        return next;
      });      
      handleNext();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  const getPrefetchStatusIcon = (itemId: string) => {
    if (prefetchStatus?.itemId === itemId) {
      if (prefetchStatus.status === 'loading') return <Loader2 className="w-3 h-3 animate-spin text-blue-500" />;
      if (prefetchStatus.status === 'success') return <span className="text-xs text-green-500">✓</span>;
      if (prefetchStatus.status === 'error') return <span className="text-xs text-red-500">✗</span>;
    }
    const cached = prefetchCache.current.get(itemId);
    if (cached?.timestamp) {
      const age = Math.round((Date.now() - cached.timestamp) / 1000);
      if (age < 300) return <span className="text-xs text-muted-foreground">📦</span>; // < 5min
    }
    return null;
  };


  const handleManualRefresh = async () => {
    if (!currentItem) return;
  
    // Supprimer cache existant
    prefetchCache.current.delete(currentItem.id);
  
    // Annuler un éventuel prefetch en cours
    const controller = abortControllersRef.current.get(currentItem.id);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(currentItem.id);
    }
  
    setCurrentError(null);
    setCurrentMinPrice(null);
    setVintedResults(null);
    setLbcResults([]);
    setEbayResults(null);
  
    await prefetchItem(currentItem);
  };

  // Items filtrés selon les options
  const filteredItems = showOnlyUnprocessed
    ? items.filter(item => !itemsWithPriceToday.has(item.id))
    : items;

  // Compteurs
  const totalItems = items.length;
  const processedCount = itemsWithPriceToday.size;
  const cachedCount = items.filter(item => prefetchCache.current.has(item.id)).length;
  const unprocessedCount = totalItems - processedCount;

  return (
    <ProtectedPage>
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card overflow-y-auto hidden md:flex md:flex-col h-screen md:sticky md:top-0">
        {/* Header avec compteurs */}
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground mb-2">Liste des items</h2>
          <div className="flex gap-2 text-xs">
            <span className="bg-muted px-2 py-1 rounded">{totalItems} total</span>
            <span className="bg-success/20 text-success px-2 py-1 rounded">{processedCount} traités</span>
            <span className="bg-primary/20 text-primary px-2 py-1 rounded">{cachedCount} en cache</span>
          </div>
        </div>

        {/* Contrôles de prefetch */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePrefetchNext(5)}
              disabled={batchPrefetching}
              className="flex-1 text-xs"
            >
              {batchPrefetching ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Prefetch 5
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePrefetchNext(10)}
              disabled={batchPrefetching}
              className="flex-1 text-xs"
            >
              Prefetch 10
            </Button>
          </div>

          {selectedItems.size > 0 && (
            <Button
              size="sm"
              variant="default"
              onClick={handlePrefetchSelected}
              disabled={batchPrefetching}
              className="w-full text-xs"
            >
              {batchPrefetching ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Prefetch sélection ({selectedItems.size})
            </Button>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={selectAllUnprocessed}
              className="flex-1 text-xs"
            >
              Sélectionner non-traités
            </Button>
            {selectedItems.size > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="text-xs"
              >
                Désélectionner
              </Button>
            )}
          </div>
        </div>

        {/* Options de filtrage */}
        <div className="p-3 border-b border-border space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyUnprocessed}
              onChange={(e) => setShowOnlyUnprocessed(e.target.checked)}
              className="rounded"
            />
            <span className="text-foreground">Afficher uniquement non-traités</span>
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoSkipProcessed}
              onChange={(e) => setAutoSkipProcessed(e.target.checked)}
              className="rounded"
            />
            <span className="text-foreground">Auto-skip traités</span>
          </label>
        </div>

        {/* Liste des items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.map((it) => {
            const idx = items.findIndex(i => i.id === it.id);
            const statusIcon = getPrefetchStatusIcon(it.id);
            const isSelected = selectedItems.has(it.id);
            const isProcessed = itemsWithPriceToday.has(it.id);
            const isCached = prefetchCache.current.has(it.id);

            return (
              <div
                key={it.id}
                className={`p-2 rounded text-sm transition relative flex items-start gap-2
                  ${idx === currentIndex ? "bg-primary/10 font-semibold text-primary ring-2 ring-primary" : "hover:bg-muted/50 text-foreground"}
                  ${isProcessed ? "bg-success/10" : ""}
                `}
              >
                {/* Checkbox de sélection */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItemSelection(it.id);
                  }}
                  className="mt-0.5 text-muted-foreground hover:text-foreground"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                {/* Contenu de l'item */}
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setCurrentIndex(idx);
                    setEditingPrice(false);
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span className="flex-1 min-w-0 whitespace-normal break-words">{it.type} {it.name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Indicateur de statut */}
                      {isProcessed && (
                        <span className="text-success" title="Traité aujourd'hui">
                          <Check className="w-4 h-4" />
                        </span>
                      )}
                      {isCached && !isProcessed && (
                        <span className="text-primary text-xs" title="En cache">📦</span>
                      )}
                      {statusIcon}
                    </div>
                  </div>
                  {it.series && <div className="text-xs text-muted-foreground">{it.series}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Gestion des Items • Prix Vinted/Cardmarket</h1>

        {currentItem ? (
          <>
            <div className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">
              <span>
                Item {currentIndex + 1} / {items.length}
              </span>
              <span className="text-success">
                {unprocessedCount} non-traités
              </span>
              {(() => {
                const cached = prefetchCache.current.get(currentItem.id);
                if (cached?.timestamp) {
                  const age = Math.round((Date.now() - cached.timestamp) / 1000);
                  return (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      📦 Cache ({age}s)
                    </span>
                  );
                }
                return null;
              })()}
            </div>

            <Card className="shadow-lg border border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  {currentItem.type} {currentItem.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Cardmarket Section */}
                {cardmarketUrl && (
                  <Collapsible open={openCardmarket} onOpenChange={setOpenCardmarket}>
                    <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer font-medium text-foreground hover:text-primary transition-colors">
                      {openCardmarket ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      Recherche Cardmarket
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      <a
                        href={cardmarketUrl}
                        target="_blank"
                        className="underline break-all text-primary hover:text-primary/80 transition"
                      >
                        {cardmarketUrl}
                      </a>
                      <CardmarketButton
                        url={cardmarketUrl}
                        onSelectPrice={(price) => setCurrentMinPrice(price)}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Yesterday Price */}
                {yesterdayPrice !== null && (
                  <div
                    onClick={handleUseYesterdayPrice}
                    className="p-3 bg-primary/10 border-l-4 border-primary rounded-lg shadow-sm cursor-pointer hover:bg-primary/20 transition"
                    title="Cliquer pour utiliser ce prix comme prix minimal"
                  >
                    <div className="text-primary font-semibold">Prix du {yesterdayDate ? yesterdayDate : 'dernier relevé'} :</div>
                    <div className="text-primary-foreground text-lg">
                      <span className="text-primary font-bold">{yesterdayPrice} €</span>
                      {yesterdayDate && <span className="text-sm text-muted-foreground ml-2">(date : {yesterdayDate})</span>}
                    </div>
                  </div>
                )}

                <Separator className="bg-border" />

                {/* Bouton de lancement de recherche si pas de résultats */}
                {!vintedResults && lbcResults.length === 0 && !ebayResults && !currentError && (
                  prefetchStatus?.itemId === currentItem.id && prefetchStatus.status === 'loading' ? (
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg text-center">
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Recherche en cours...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
                      <p className="text-muted-foreground mb-3">Aucune donnée en cache pour cet item</p>
                      <Button
                        onClick={handleManualRefresh}
                        className="bg-primary text-primary-foreground"
                      >
                        Lancer la recherche Vinted + LeBonCoin + eBay
                      </Button>
                    </div>
                  )
                )}

                {/* Vinted Section */}
                <Collapsible open={openVinted} onOpenChange={setOpenVinted}>
                  <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer font-medium text-foreground hover:text-primary transition-colors">
                    {openVinted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    Recherche Vinted/LeBonCoin/eBay
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-3 space-y-4">
                    {currentError && <div className="text-sm text-destructive">{currentError}</div>}

                    {/* Vinted results */}
                    {vintedResults && vintedResults?.filteredVinted?.valid?.length === 0 && (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                        Vinted : aucun résultat trouvé
                      </div>
                    )}
                    {vintedResults?.filteredVinted?.valid?.length > 0 && (
                      <section>
                        <h3 className="font-medium mb-2 text-foreground">Annonces Vinted trouvées</h3>
                        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
                          {vintedResults.filteredVinted.valid
                            .slice()
                            .sort(
                              (a: any, b: any) =>
                                parseVintedPrice(a.price) - parseVintedPrice(b.price)
                            )                            
                            .map((item: any, i: number) => (
                              <Card
                                key={i}
                                className="bg-card border border-border hover:shadow-lg cursor-pointer transition flex-shrink-0 w-80 flex flex-row p-4 items-center gap-4"
                                onClick={() => {
                                  if (item.url) window.open(item.url, "_blank");
                                  setCurrentMinPrice(item.price);
                                }}
                              >
                                {item.thumbnail && (
                                  <div className="w-28 h-28 relative flex-shrink-0 bg-secondary/20 rounded-xl overflow-hidden border border-border/50">
                                    <img
                                      src={item.thumbnail}
                                      alt={item.title}
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                )}

                                <div className="flex flex-col justify-between flex-1 h-full">
                                  <CardHeader>
                                    <CardTitle className="text-sm line-clamp-2 text-foreground">{item.title}</CardTitle>
                                  </CardHeader>

                                  <CardContent className="flex flex-col gap-1">
                                    <span className="font-bold text-lg text-primary">{item.price} €</span>
                                  </CardContent>
                                </div>
                              </Card>
                            ))}
                        </div>
                      </section>
                    )}

                    {/* eBay results */}
                    {ebayResults && ebayResults?.valid?.length === 0 && (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                        eBay : aucun résultat trouvé
                      </div>
                    )}
                    {ebayResults?.valid?.length > 0 && (
                      <section>
                        <h3 className="font-medium mb-2 text-foreground">Annonces eBay vendues</h3>
                        <div className="flex flex-row gap-4 overflow-x-auto pb-2">
                          {ebayResults.valid
                            .slice()
                            .sort(
                              (a: any, b: any) =>
                                parseEbayPrice(a.price) - parseEbayPrice(b.price)
                            )
                            .map((item: any, i: number) => {
                              const thumbnail = item.thumbnail || item.img;
                              const parsedPrice = parseEbayPrice(item.price);

                              return (
                                <Card
                                  key={i}
                                  className="bg-card border border-border hover:shadow-lg cursor-pointer transition flex-shrink-0 w-80 flex flex-row p-4 items-center gap-4"
                                  onClick={() => {
                                    if (item.url) window.open(item.url, "_blank");
                                    if (!Number.isNaN(parsedPrice)) {
                                      setCurrentMinPrice(parsedPrice);
                                    }
                                  }}
                                >
                                  {thumbnail && (
                                    <div className="w-28 h-28 relative flex-shrink-0 bg-secondary/20 rounded-xl overflow-hidden border border-border/50">
                                      <img
                                        src={thumbnail}
                                        alt={item.title}
                                        className="w-full h-full object-contain"
                                      />
                                    </div>
                                  )}

                                  <div className="flex flex-col justify-between flex-1 h-full">
                                    <CardHeader>
                                      <CardTitle className="text-sm line-clamp-2 text-foreground">{item.title}</CardTitle>
                                    </CardHeader>

                                    <CardContent className="flex flex-col gap-1">
                                      <span className="font-bold text-lg text-primary">
                                        {Number.isNaN(parsedPrice) ? item.price : `${parsedPrice} €`}
                                      </span>
                                      {item.soldDate && (
                                        <span className="text-xs text-muted-foreground">{item.soldDate}</span>
                                      )}
                                      {item.condition && (
                                        <span className="text-xs text-muted-foreground">{item.condition}</span>
                                      )}
                                    </CardContent>
                                  </div>
                                </Card>
                              );
                            })}
                        </div>
                      </section>
                    )}

                    {/* Le Bon Coin results */}
                    {(vintedResults || ebayResults) && lbcResults.length === 0 && (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded">
                        LeBonCoin : aucun résultat trouvé
                      </div>
                    )}
                    {lbcResults.length > 0 && (
                      <section>
                        <h3 className="font-medium mb-2 text-foreground">Annonces Le Bon Coin</h3>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {lbcResults.map((offer, i) => (
                            <div key={i} className="flex-shrink-0 w-100">
                              <LBCItemCard
                                offer={offer}
                                onClick={() => {
                                  const price = parseLBCPrice(offer.price);
                                  setCurrentMinPrice(price);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {(currentMinPrice === null || !!currentError) && !priceUnavailable && (
                  <div className="flex flex-wrap gap-3 p-3 bg-muted/40 border border-border rounded-lg">
                    <Button
                      variant="outline"
                      onClick={handleManualRefresh}
                    >
                      🔄 Relancer la recherche (Vinted + LBC + eBay)
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleSearchVinted}
                    >
                      🔍 Relancer Vinted
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleSearchLBCFuzzy}
                    >
                      🔍 Relancer Le Bon Coin
                    </Button>

                    <Button
                      variant="secondary"
                      onClick={handleSearchEbay}
                    >
                      🔍 Relancer eBay
                    </Button>
                  </div>
                )}

                {currentMinPrice !== null && !currentError && !priceUnavailable && (
                  <div className="flex items-center gap-3 text-base font-semibold bg-success-light border-l-4 border-success p-3 rounded-md shadow-md">
                    <span className="text-success">Prix minimal trouvé :</span>
                    {editingPrice ? (
                      <input
                        type="number"
                        value={currentMinPrice}
                        onChange={(e) => setCurrentMinPrice(Number(e.target.value))}
                        className="border border-input bg-background rounded px-2 py-1 w-28 text-center font-medium text-foreground focus:ring-primary focus:border-primary"
                      />
                    ) : (
                     <span className="text-success font-bold text-lg">
                        {currentMinPrice} €
                      </span>
                    )}
                  </div>
                )}

                {priceUnavailable && (
                  <div className="flex items-center justify-between gap-3 text-base font-semibold bg-warning/10 border-l-4 border-warning p-3 rounded-md shadow-md">
                    <span className="text-warning">Prix non disponible ce jour</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPriceUnavailable(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Annuler
                    </Button>
                  </div>
                )}

                {/* Message si déjà traité */}
                {currentItem && itemsWithPriceToday.has(currentItem.id) && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                    <span className="text-success font-medium flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      Prix déjà enregistré aujourd'hui
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {!priceUnavailable && currentItem && !itemsWithPriceToday.has(currentItem.id) && (
                    <Button
                      variant="outline"
                      onClick={() => setPriceUnavailable(true)}
                      className="border-warning text-warning hover:bg-warning/10"
                    >
                      ⚠️ Prix non disponible ce jour
                    </Button>
                  )}

                  {/* Boutons d'enregistrement: affichés si on a un prix OU si prix marqué non disponible, ET pas déjà traité */}
                  {(currentMinPrice !== null || priceUnavailable) && currentItem && !itemsWithPriceToday.has(currentItem.id) && (
                    <>
                      {!priceUnavailable && (
                        <Button
                          variant="outline"
                          onClick={() => setEditingPrice((v) => !v)}
                        >
                          {editingPrice ? "Valider le prix" : "Modifier le prix"}
                        </Button>
                      )}

                      <Button
                        onClick={handleInsertPrice}
                        disabled={saving}
                        className={priceUnavailable
                          ? "bg-warning text-warning-foreground hover:bg-warning/90"
                          : "bg-success text-success-foreground hover:bg-success/90"}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enregistrement…
                          </>
                        ) : priceUnavailable ? (
                          "Enregistrer (non disponible)"
                        ) : (
                          "Enregistrer le prix"
                        )}
                      </Button>

                      <Button
                        onClick={handleInsertAndNext}
                        disabled={saving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enregistrement…
                          </>
                        ) : (
                          "Enregistrer + Suivant"
                        )}
                      </Button>
                    </>
                  )}

                  <Button variant="secondary" onClick={handleNext}>
                    Item suivant
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteItem}
                  >
                    Supprimer l'item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-muted-foreground">
            Aucun item sélectionné
          </div>
        )}
      </main>
    </div>
    </ProtectedPage>
  );
}
