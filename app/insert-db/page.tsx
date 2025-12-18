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
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";

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
import { fetchLeboncoinSearch, postLeboncoinFilter } from "@/lib/api";
import Fuse from "fuse.js";
import { LBCOffer } from "@/types";
import { normalizeLBCOffers, parseLBCPrice } from "@/lib/utils";
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

  const [saving, setSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [cardmarketUrl, setCardmarketUrl] = useState<string | null>(null);

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

  useEffect(() => {
    if (!currentItem) return;
  
    const cached = prefetchCache.current.get(currentItem.id);
  
    // Si pas de cache (cas du 1er item) ou cache trop vieux -> on fetch
    const isFresh =
      cached?.timestamp && Date.now() - cached.timestamp < 5 * 60 * 1000;
  
    if (!cached || !isFresh) {
      prefetchItem(currentItem);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem]);
  

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

      // Attendre les deux recherches
      const [vintedData, lbcData] = await Promise.all([vintedPromise, lbcPromise]);

      // Calculer le prix minimum entre Vinted et LBC
      const prices = [
        vintedData?.minPrice,
        lbcData.minPrice
      ].filter((p): p is number => p !== null && p !== undefined && !isNaN(p));

      const finalMinPrice = prices.length > 0 ? Math.min(...prices) : null;

      // Stocker dans le cache avec timestamp
      prefetchCache.current.set(item.id, {
        vinted: vintedData,
        lbc: lbcData.offers,
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

  // Prefetch du prochain item quand on change d'index
  useEffect(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < items.length) {
      const nextItem = items[nextIndex];
      // Petit délai pour laisser le temps à l'UI de se charger
      const timeout = setTimeout(() => {
        prefetchItem(nextItem);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, items]);

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
        setCurrentMinPrice(null);
      } else {
        setVintedResults(cached.vinted || null);
        setLbcResults(cached.lbc || []);
        setCurrentMinPrice(cached.minPrice ?? null);
        setCurrentError(null);
      }
    } else {
      // Pas de cache, réinitialiser
      console.log(`🔍 Pas de cache pour: ${currentItem.name}`);
      setVintedResults(null);
      setLbcResults([]);
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
  

  const handleInsertPrice = async () => {
    if (!currentItem || currentMinPrice === null) return;
    const today = new Date().toISOString().slice(0, 10);
    setSaving(true);
    try {
      await insertPriceInDB(currentItem.id, { date: today, price: currentMinPrice });
      setItemsWithPriceToday((prev) => new Set(prev).add(currentItem.id));
      alert(`Prix ajouté pour ${currentItem.name}`);
    } catch {
      alert("Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i + 1 < items.length ? i + 1 : 0));
    setCurrentMinPrice(null);
    setCurrentError(null);
    setEditingPrice(false);
    setCardmarketUrl(null);
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
  
    await prefetchItem(currentItem);
  };

  return (
    <ProtectedPage>
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card overflow-y-auto p-4 hidden md:block h-screen md:sticky md:top-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">Liste des items</h2>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => {
            const statusIcon = getPrefetchStatusIcon(it.id);
            return (
              <div
                key={it.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setEditingPrice(false);
                }}
                className={`p-2 rounded cursor-pointer text-sm transition relative
                  ${idx === currentIndex ? "bg-primary/10 font-semibold text-primary border-r-4 border-primary" : "hover:bg-muted/50 text-foreground"}
                  ${itemsWithPriceToday.has(it.id) ? "bg-success/20 border-l-4 border-success" : ""}
                `}
              >
                <div className="flex items-center gap-1">
                  <span className="flex-1">{it.type} {it.name}</span>
                  <div className="flex items-center gap-1">
                    {itemsWithPriceToday.has(it.id) && (
                      <span className="text-success font-bold text-sm">✔</span>
                    )}
                    {statusIcon}
                  </div>
                </div>
                {it.series && <div className="text-xs text-muted-foreground">{it.series}</div>}
              </div>
            );
          })}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-foreground">Gestion des Items • Prix Vinted/Cardmarket</h1>

        {currentItem ? (
          <>
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <span>
                Item {currentIndex + 1} / {items.length} —{" "}
                restants : {items.length - currentIndex - 1}
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

                {/* Vinted Section */}
                <Collapsible open={openVinted} onOpenChange={setOpenVinted}>
                  <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer font-medium text-foreground hover:text-primary transition-colors">
                    {openVinted ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    Recherche Vinted/LeBonCoin
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-3 space-y-4">
                    {currentError && <div className="text-sm text-destructive">{currentError}</div>}

                    {/* Vinted results */}
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

                    {/* Le Bon Coin results */}
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

                {(currentMinPrice === null || !!currentError) && (
                  <div className="flex flex-wrap gap-3 p-3 bg-muted/40 border border-border rounded-lg">
                    <Button
                      variant="outline"
                      onClick={handleManualRefresh}
                    >
                      🔄 Relancer la recherche (Vinted + LBC)
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
                  </div>
                )}

                {currentMinPrice !== null && !currentError && (
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

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {currentMinPrice !== null && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => setEditingPrice((v) => !v)}
                      >
                        {editingPrice ? "Valider le prix" : "Modifier le prix"}
                      </Button>

                      <Button
                        onClick={handleInsertPrice}
                        disabled={saving}
                        className="bg-success text-success-foreground hover:bg-success/90"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Enregistrement…
                          </>
                        ) : (
                          "Enregistrer le prix"
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
                    Supprimer l’item
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
