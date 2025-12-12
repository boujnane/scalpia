"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { insertPriceInDB } from "@/lib/insert-price";
import { useSearchVinted } from "@/hooks/useSearchVinted";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import CardmarketButton from "@/components/CardmarketButton";
import { Button } from "@/components/ui/button"; // Import de Button Shadcn/ui

type ItemEntry = {
  id: string;
  name?: string;
  type?: string;
  series?: string;
  cardmarketUrl?: string | null;
};

export default function InsertDbPage() {
  const [items, setItems] = useState<ItemEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [currentMinPrice, setCurrentMinPrice] = useState<number | null>(null);
  const [currentError, setCurrentError] = useState<string | null>(null);
  const [vintedResults, setVintedResults] = useState<any | null>(null);

  const [saving, setSaving] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [cardmarketUrl, setCardmarketUrl] = useState<string | null>(null);

  const [openVinted, setOpenVinted] = useState(true);
  const [openCardmarket, setOpenCardmarket] = useState(true);

  const { run, loading: searchLoading } = useSearchVinted();

  const [itemsWithPriceToday, setItemsWithPriceToday] = useState<Set<string>>(new Set());

  const [yesterdayPrice, setYesterdayPrice] = useState<number | null>(null);
  const [yesterdayDate, setYesterdayDate] = useState<string | null>(null);

  // Load items from Firestore
  useEffect(() => {
    const fetchItemsWithPriceToday = async () => {
      const snapshot = await getDocs(collection(db, "items"));
      const list: ItemEntry[] = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          name: data.name ?? data.title ?? "",
          type: data.type ?? "",
          series: data.series ?? "",
          cardmarketUrl: data.cardmarketUrl ?? null,
        };
      });
      setItems(list);
  
      // --- Vérifier les prix ajoutés aujourd'hui pour chaque item ---
      const today = new Date().toISOString().slice(0, 10);
      const itemsToday = new Set<string>();
  
      for (const itemDoc of snapshot.docs) {
        const pricesSnap = await getDocs(collection(db, `items/${itemDoc.id}/prices`));
        pricesSnap.docs.forEach((priceDoc) => {
          const data = priceDoc.data() as any;
          if (data.date === today) {
            itemsToday.add(itemDoc.id);
          }
        });
      }
  
      setItemsWithPriceToday(itemsToday);
    };
  
    fetchItemsWithPriceToday();
  }, []);
  


  const currentItem = items[currentIndex] || null;

  useEffect(() => {
    if (!currentItem) return;
    setCardmarketUrl(currentItem.cardmarketUrl ?? null);
  }, [currentIndex, currentItem]);

  useEffect(() => {
    const fetchYesterdayPrice = async () => {
      if (!currentItem) return;
  
      // Reset avant chargement
      setYesterdayPrice(null);
      setYesterdayDate(null);
  
      // On charge la sous-collection /prices
      const pricesSnap = await getDocs(
        collection(db, `items/${currentItem.id}/prices`)
      );
  
      if (pricesSnap.empty) return;
  
      // Extraire tous les prix avec date + price
      const prices = pricesSnap.docs.map((doc) => doc.data() as any);
  
      // Trier du plus récent au plus ancien
      prices.sort((a, b) => (a.date < b.date ? 1 : -1));
  
      // Le prix le plus récent (aujourd'hui ou autre)
      const last = prices[0];
  
      // Prix de la veille = celui d’hier
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
      const priceYesterday = prices.find((p) => p.date === yesterdayStr);
  
      if (priceYesterday) {
        setYesterdayPrice(priceYesterday.price);
        setYesterdayDate(priceYesterday.date);
        return;
      }
  
      // Sinon on affiche simplement le dernier prix connu (pas "veille" mais utile)
      setYesterdayPrice(last.price);
      setYesterdayDate(last.date);
    };
  
    fetchYesterdayPrice();
  }, [currentItem]);
  
  
  // ------- Actions -------

  const handleUseYesterdayPrice = () => {
    if (yesterdayPrice !== null) {
      setCurrentMinPrice(yesterdayPrice);
    }
  };

  const handleSearchCurrent = async () => {
    if (!currentItem) return;
  
    const queryStr = `${currentItem.type} ${currentItem.name}`.trim();
    if (!queryStr) {
      setCurrentError("Type ou nom manquant");
      return;
    }
  
    setCurrentMinPrice(null);
    setCurrentError(null);
    setVintedResults(null);
  
    try {
      const t0 = performance.now(); // ⏱ départ du timer
  
      const result = await run(queryStr);
  
      const t1 = performance.now(); // ⏱ fin du timer
      console.log(`Temps de recherche Vinted: ${(t1 - t0).toFixed(2)} ms`);
  
      if (!result) return setCurrentError("Erreur lors de la recherche");
  
      setCurrentMinPrice(result.minPrice ?? null);
      setVintedResults(result);
    } catch (err: any) {
      setCurrentError(err?.message ?? "Erreur inconnue");
    }
  };
  

  const handleInsertPrice = async () => {
    if (!currentItem || currentMinPrice === null) return;

    const today = new Date().toISOString().slice(0, 10);

    setSaving(true);
    try {
      await insertPriceInDB(currentItem.id, {
        date: today,
        price: currentMinPrice,
      });

      // --- Mettre à jour le Set pour la couleur directement ---
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
    setVintedResults(null);
    setCardmarketUrl(null);
    window.scrollTo(0, 0);
  };

  const handleDeleteItem = async () => {
    if (!currentItem) return;

    if (!window.confirm(`Supprimer "${currentItem.name}" ?`)) return;

    try {
      await deleteDoc(doc(db, "items", currentItem.id));
      setItems((prev) => prev.filter((i) => i.id !== currentItem.id));
      handleNext();
    } catch {
      alert("Erreur lors de la suppression");
    }
  };

  // ------- UI -------

  return (
    // Utilisation de bg-background pour le conteneur principal
    <div className="flex min-h-screen bg-background">
    {/* Sidebar */}
    <aside 
      // Utilisation de border-r et de bg-muted/20 ou bg-card pour la sidebar
      className="w-64 border-r border-border bg-card overflow-y-auto p-4 hidden md:block"
    >
      <h2 className="font-semibold mb-3 text-foreground">Liste des items</h2>

      <div className="space-y-2">
        {items.map((it, idx) => (
          <div
          key={it.id}
          onClick={() => {
            setCurrentIndex(idx);
            setCurrentMinPrice(null);
            setCurrentError(null);
            setVintedResults(null);
            setCardmarketUrl(null);
          }}
          className={`p-2 rounded cursor-pointer text-sm transition 
            ${idx === currentIndex ? "bg-primary/10 font-semibold text-primary border-r-4 border-primary" : "hover:bg-muted/50 text-foreground"}
            ${itemsWithPriceToday.has(it.id) ? "bg-success/20 border-l-4 border-success" : ""}
          `}
        >
          <div className="flex items-center gap-1">
            {it.type} {it.name}
            {itemsWithPriceToday.has(it.id) && (
              // Utilisation de text-success
              <span className="text-success font-bold text-sm">✔</span>
            )}
          </div>
          {/* Utilisation de text-muted-foreground */}
          {it.series && <div className="text-xs text-muted-foreground">{it.series}</div>}
        </div>
        
        ))}
      </div>
    </aside>
    <main className="flex-1 overflow-y-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold text-foreground">Gestion des Items • Prix Vinted/Cardmarket</h1>

      {currentItem ? (
        <>
          {/* Utilisation de text-muted-foreground */}
          <div className="text-muted-foreground text-sm">
            Item {currentIndex + 1} / {items.length} —{" "}
            <span className="text-muted-foreground">
              restants : {items.length - currentIndex - 1}
            </span>
          </div>

          {/* Utilisation de bg-card, border-border et shadow-lg */}
          <Card className="shadow-lg border border-border bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">
                {currentItem.type} {currentItem.name}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* ----- Cardmarket Section ----- */}
              {cardmarketUrl && (
                <Collapsible
                  open={openCardmarket}
                  onOpenChange={setOpenCardmarket}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer font-medium text-foreground hover:text-primary transition-colors">
                    {openCardmarket ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    Recherche Cardmarket
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-3 space-y-2">
                    {/* Lien : utilise text-primary */}
                    <a
                      href={cardmarketUrl}
                      target="_blank"
                      className="underline break-all text-primary hover:text-primary/80 transition"
                    >
                      {cardmarketUrl}
                    </a>
                    <br></br>
                    <CardmarketButton
                      url={cardmarketUrl}
                      onSelectPrice={(price) => setCurrentMinPrice(price)}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Prix de la veille (Yesterday Price) */}
              {yesterdayPrice !== null && (
                <div
                  onClick={handleUseYesterdayPrice}
                  // Thème : Utilisation de bg-secondary/30 et border-primary
                  className="p-3 bg-primary/10 border-l-4 border-primary rounded-lg shadow-sm cursor-pointer hover:bg-primary/20 transition"
                  title="Cliquer pour utiliser ce prix comme prix minimal"
                >
                  <div className="text-primary font-semibold">Prix du {yesterdayDate ? yesterdayDate : 'dernier relevé'} :</div>
                  <div className="text-primary-foreground text-lg">
                    <span className="text-primary font-bold">
                      {yesterdayPrice} €
                    </span>
                    {yesterdayDate && (
                      <span className="text-sm text-muted-foreground ml-2">
                        (date : {yesterdayDate})
                      </span>
                    )}
                  </div>
                </div>
              )}


              <Separator className="bg-border" />


              {/* ----- Vinted Section ----- */}
              <Collapsible open={openVinted} onOpenChange={setOpenVinted}>
                <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer font-medium text-foreground hover:text-primary transition-colors">
                  {openVinted ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  Recherche Vinted
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3 space-y-4">
                  {/* Price display + edit */}
                  {/* Utilisation de text-destructive pour l'erreur */}
                  {currentError && (
                    <div className="text-sm text-destructive">{currentError}</div>
                  )}

                    {currentMinPrice !== null && !currentError && (
                      <div 
                        className="flex items-center gap-3 text-base font-semibold bg-success-light border-l-4 border-success p-3 rounded-md shadow-md"
                      >
                      <span className="text-success">Prix minimal trouvé :</span>
                      {editingPrice ? (
                        <input
                          type="number"
                          value={currentMinPrice}
                          onChange={(e) => setCurrentMinPrice(Number(e.target.value))}
                          // Thème : Utilisation des classes d'input standard
                          className="border border-input bg-background rounded px-2 py-1 w-28 text-center font-medium text-foreground focus:ring-primary focus:border-primary"
                        />
                      ) : (
                        <span className="text-success font-bold text-lg">{currentMinPrice} €</span>
                      )}
                      <Button
                        onClick={() => setEditingPrice(!editingPrice)}
                        // Thème : Utilisation de Button (Shadcn) en variant secondary ou outline
                        variant={editingPrice ? "default" : "secondary"}
                        size="sm"
                      >
                        {editingPrice ? "Valider" : "Modifier"}
                      </Button>
                    </div>
                  )}


                  {/* Vinted results */}
                  {vintedResults?.filteredVinted?.valid?.length > 0 && (
                    <section>
                      <h3 className="font-medium mb-2 text-foreground">
                        Annonces Vinted trouvées
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vintedResults.filteredVinted.valid.map(
                          (item: any, i: number) => (
                            <Card
                              key={i}
                              // Thème : Utilisation de bg-card, border-border
                              className="bg-card border border-border hover:shadow-lg cursor-pointer transition"
                              onClick={() =>
                                item.url && window.open(item.url, "_blank")
                              }
                            >
                              <CardHeader>
                                {/* Utilisation de text-foreground */}
                                <CardTitle className="text-sm line-clamp-2 text-foreground">
                                  {item.title}
                                </CardTitle>
                              </CardHeader>

                              <CardContent className="flex flex-col items-center">
                                {item.thumbnail && (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.title}
                                    className="h-28 object-contain mb-2"
                                  />
                                )}
                                {/* Utilisation de text-primary */}
                                <span className="font-bold text-lg text-primary">
                                  {item.price} €
                                </span>
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </section>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* ----- Action Buttons ----- */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={handleSearchCurrent}
                  disabled={searchLoading}
                  // Thème : Primary button
                  variant="default"
                >
                  {searchLoading ? "Recherche…" : "Chercher prix"}
                </Button>

                <Button
                  onClick={handleInsertPrice}
                  disabled={currentMinPrice === null || saving}
                  // Thème : Success button
                  variant="success"
                >
                  {saving ? "Ajout…" : "Ajouter en prices"}
                </Button>

                <Button
                  onClick={handleNext}
                  // Thème : Secondary/Muted button
                  variant="secondary"
                >
                  Suivant
                </Button>

                <Button
                  onClick={handleDeleteItem}
                  // Thème : Destructive button
                  variant="destructive"
                >
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Aucun item à traiter.</p>
      )}
    </main>
  </div>
  );
}