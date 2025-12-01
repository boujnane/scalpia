"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useSearch } from "@/hooks/useSearch";
import { insertPriceInDB } from "@/lib/insert-price";

import { Icons } from "@/components/icons";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import CardmarketButton from "@/components/CardmarketButton";

type ItemEntry = {
  id: string;
  name?: string;
  type?: string;
  series?: string;
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

  const { run, loading: searchLoading } = useSearch();

  const [itemsWithPriceToday, setItemsWithPriceToday] = useState<Set<string>>(new Set());

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

  // Load Cardmarket URL
  useEffect(() => {
    if (!currentItem) return;
  
    const fetchCardmarketUrl = async () => {
      try {
        const res = await fetch(
          `/api/google-search?q=${encodeURIComponent(
            `${currentItem.type} ${currentItem.name} cardmarket`
          )}`
        );
        const data = await res.json();
        const itemsArray = data.items ?? [];
  
        for (let i = 0; i < itemsArray.length; i++) {
          const link = itemsArray[i].link;
  
          // Vérifier que le lien est bien Cardmarket et pas Singles
          if (/www\.cardmarket\.com/i.test(link) && /\/Products\/(?!Singles\/)/i.test(link)) {
            setCardmarketUrl(`${link}?sellerCountry=12&language=2`);
            return;
          }
        }
  
        setCardmarketUrl(null);
      } catch (err) {
        setCardmarketUrl(null);
      }
    };
  
    setCardmarketUrl(null);
    fetchCardmarketUrl();
  }, [currentIndex, currentItem]);
  
  // ------- Actions -------

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
      const result = await run(queryStr);
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
    <div className="flex h-screen">
    {/* Sidebar */}
    <aside className="w-64 border-r overflow-y-auto p-4 hidden md:block">
      <h2 className="font-semibold mb-3">Liste des items</h2>

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
            ${idx === currentIndex ? "bg-indigo-100 font-semibold" : "hover:bg-gray-100"}
            ${itemsWithPriceToday.has(it.id) ? "bg-green-200 border-l-4 border-green-500" : ""}
          `}
        >
          <div className="flex items-center gap-1">
            {it.type} {it.name}
            {itemsWithPriceToday.has(it.id) && (
              <span className="text-green-700 font-bold text-sm">✔</span>
            )}
          </div>
          {it.series && <div className="text-xs text-gray-500">{it.series}</div>}
        </div>
        
        ))}
      </div>
    </aside>
    <main className="flex-1 overflow-y-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Gestion des Items • Prix Vinted/Cardmarket</h1>

      {currentItem ? (
        <>
          <div className="text-gray-600 text-sm">
            Item {currentIndex + 1} / {items.length} —{" "}
            <span className="text-gray-400">
              restants : {items.length - currentIndex - 1}
            </span>
          </div>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
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
                  <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer font-medium">
                    {openCardmarket ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                    Recherche Cardmarket
                  </CollapsibleTrigger>

                  <CollapsibleContent className="mt-3 space-y-2">
                    <a
                      href={cardmarketUrl}
                      target="_blank"
                      className="underline break-all"
                    >
                      {cardmarketUrl}
                    </a>
                    <CardmarketButton url={cardmarketUrl} />
                  </CollapsibleContent>
                </Collapsible>
              )}

              <Separator />

              {/* ----- Vinted Section ----- */}
              <Collapsible open={openVinted} onOpenChange={setOpenVinted}>
                <CollapsibleTrigger className="flex items-center gap-2 cursor-pointer font-medium">
                  {openVinted ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                  Recherche Vinted
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-3 space-y-4">
                  {/* Price display + edit */}
                  {currentError && (
                    <div className="text-sm text-red-600">{currentError}</div>
                  )}

                  {currentMinPrice !== null && !currentError && (
                    <div className="flex items-center gap-3 text-base font-semibold bg-yellow-100 border-l-4 border-yellow-400 p-3 rounded-md shadow-md">
                      <span className="text-yellow-800">Prix minimal :</span>
                      {editingPrice ? (
                        <input
                          type="number"
                          value={currentMinPrice}
                          onChange={(e) => setCurrentMinPrice(Number(e.target.value))}
                          className="border rounded px-2 py-1 w-28 text-center font-medium text-yellow-900"
                        />
                      ) : (
                        <span className="text-yellow-900 text-lg">{currentMinPrice} €</span>
                      )}
                      <button
                        onClick={() => setEditingPrice(!editingPrice)}
                        className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-white rounded-md text-sm font-medium shadow"
                      >
                        {editingPrice ? "Valider" : "Modifier"}
                      </button>
                    </div>
                  )}


                  {/* Vinted results */}
                  {vintedResults?.filteredVinted?.valid?.length > 0 && (
                    <section>
                      <h3 className="font-medium mb-2">
                        Annonces Vinted trouvées
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {vintedResults.filteredVinted.valid.map(
                          (item: any, i: number) => (
                            <Card
                              key={i}
                              className="hover:shadow-md cursor-pointer transition"
                              onClick={() =>
                                item.url && window.open(item.url, "_blank")
                              }
                            >
                              <CardHeader>
                                <CardTitle className="text-sm line-clamp-2">
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
                                <span className="font-medium">
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
                <button
                  onClick={handleSearchCurrent}
                  disabled={searchLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                  {searchLoading ? "Recherche…" : "Chercher prix"}
                </button>

                <button
                  onClick={handleInsertPrice}
                  disabled={currentMinPrice === null || saving}
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                >
                  {saving ? "Ajout…" : "Ajouter en prices"}
                </button>

                <button
                  onClick={handleNext}
                  className="bg-gray-500 text-white px-4 py-2 rounded text-sm"
                >
                  Suivant
                </button>

                <button
                  onClick={handleDeleteItem}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm"
                >
                  Supprimer
                </button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <p>Aucun item à traiter.</p>
      )}
    </main>
  </div>
  );
}
