"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearch } from "@/hooks/useSearch";
import { insertPriceInDB } from "@/lib/insert-price";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CardmarketButton from "@/components/CardmarketButton";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const [openVinted, setOpenVinted] = useState(true); // ✅ Collapsible Vinted
  const [openCardmarket, setOpenCardmarket] = useState(true); // ✅ Collapsible Cardmarket

  const { run, loading: searchLoading } = useSearch();

  useEffect(() => {
    const fetchItems = async () => {
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
    };
    fetchItems();
  }, []);

  const currentItem = items[currentIndex] || null;

  useEffect(() => {
    if (!currentItem) return;

    const fetchCardmarketUrl = async () => {
      try {
        const res = await fetch(
          `/api/google-search?q=${encodeURIComponent(`${currentItem.type} ${currentItem.name} cardmarket`)}`
        );
        const data = await res.json();
        const itemsArray = data.items ?? [];
        for (let i = 0; i < itemsArray.length; i++) {
          const link = itemsArray[i].link;
          if (/\/Products\/(?!Singles\/)/i.test(link)) {
            setCardmarketUrl(link + "?sellerCountry=12&language=2");
            return;
          }
        }
        setCardmarketUrl(null);
      } catch (err) {
        console.error(err);
        setCardmarketUrl(null);
      }
    };

    setCardmarketUrl(null);
    fetchCardmarketUrl();
  }, [currentIndex, currentItem]);

  const handleSearchCurrent = async () => {
    if (!currentItem) return;
    const queryStr = `${currentItem.type} ${currentItem.name}`.trim();
    if (!queryStr) {
      setCurrentMinPrice(null);
      setCurrentError("Type ou nom manquant");
      setVintedResults(null);
      return;
    }

    setCurrentMinPrice(null);
    setCurrentError(null);
    setVintedResults(null);

    try {
      const result = await run(queryStr);
      if (!result) {
        setCurrentMinPrice(null);
        setCurrentError("Erreur lors de la recherche");
        return;
      }

      setCurrentMinPrice(result.minPrice ?? null);
      setVintedResults(result);
    } catch (err: any) {
      setCurrentError(err?.message ?? "Erreur inconnue");
      setCurrentMinPrice(null);
      setVintedResults(null);
    }
  };

  const handleInsertPrice = async () => {
    if (!currentItem || currentMinPrice === null) return;

    const today = new Date();
    const localDate =
      today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

    setSaving(true);
    try {
      await insertPriceInDB(currentItem.id, { date: localDate, price: currentMinPrice });
      alert(`✅ Prix ajouté pour l'item ${currentItem.name}`);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'ajout");
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
    const confirmDelete = window.confirm(`⚠️ Supprimer "${currentItem.name}" ?`);
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "items", currentItem.id));
      alert(`✅ Item "${currentItem.name}" supprimé`);
      setItems((prev) => prev.filter((i) => i.id !== currentItem.id));
      handleNext();
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scanner Items et récupérer prix Vinted</h1>

      {currentItem ? (
        <>
          <div className="mb-3 text-gray-700 font-medium">
            Item {currentIndex + 1} / {items.length}
            <span className="ml-2 text-sm text-gray-500">
              (Restants : {items.length - currentIndex - 1})
            </span>
          </div>

          <div className="border rounded p-4 bg-white space-y-4">
            <div className="font-medium text-lg">{currentItem.type} {currentItem.name}</div>
            <div className="text-sm text-gray-800">Type: {currentItem.type}</div>

            {/* 🔹 Cardmarket Link */}
            {cardmarketUrl && (
              <Collapsible open={openCardmarket} onOpenChange={setOpenCardmarket}>
                <CollapsibleTrigger className="text-blue-700 font-medium cursor-pointer flex items-center gap-1">
                  {openCardmarket ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Recherche Cardmarket
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <a href={cardmarketUrl} target="_blank" className="underline break-all">
                    {cardmarketUrl}
                  </a>
                  <CardmarketButton url={cardmarketUrl} />
                </CollapsibleContent>
              </Collapsible>
            )}

            <Separator />

            {/* 🔹 Vinted */}
            <Collapsible open={openVinted} onOpenChange={setOpenVinted}>
              <CollapsibleTrigger className="font-medium cursor-pointer flex items-center gap-1">
                {openVinted ? <ChevronUp size={16} /> : <ChevronDown size={16} />} Recherche Vinted
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                {currentError && <div className="text-sm text-red-600">{currentError}</div>}
                {!currentError && currentMinPrice !== null && (
                  <div className="flex items-center gap-2 text-gray-800 text-sm">
                    Prix minimal Vinted:
                    {editingPrice ? (
                      <input
                        type="number"
                        value={currentMinPrice}
                        onChange={(e) => setCurrentMinPrice(Number(e.target.value))}
                        className="border rounded px-2 py-1 w-24"
                        min={0}
                        step={0.01}
                      />
                    ) : (
                      <span className="font-bold">{currentMinPrice} €</span>
                    )}
                    <button
                      className="px-2 py-1 bg-yellow-400 text-black rounded text-sm"
                      onClick={() => setEditingPrice(!editingPrice)}
                    >
                      {editingPrice ? "Valider" : "Modifier"}
                    </button>
                  </div>
                )}

                {vintedResults?.filteredVinted?.valid?.length > 0 && (
                  <section className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Annonces Vinted :</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vintedResults.filteredVinted.valid.map((item: any, i: number) => (
                        <Card
                          key={i}
                          className="hover:shadow-lg cursor-pointer"
                          onClick={() => item.url && window.open(item.url, "_blank")}
                        >
                          <CardHeader>
                            <CardTitle className="text-sm">{item.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col items-center">
                            {item.thumbnail && (
                              <img src={item.thumbnail} alt={item.title} className="h-28 object-contain mb-1" />
                            )}
                            <span className="font-medium">{item.price} €</span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="flex gap-2 mt-4">
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
                onClick={handleSearchCurrent}
                disabled={searchLoading}
              >
                {searchLoading ? "Recherche..." : "Chercher prix"}
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={handleInsertPrice}
                disabled={currentMinPrice === null || saving}
              >
                {saving ? "Ajout..." : "Ajouter en prices"}
              </button>
              <button
                className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
                onClick={handleNext}
              >
                Suivant
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
                onClick={handleDeleteItem}
              >
                Supprimer
              </button>
            </div>
          </div>
        </>
      ) : (
        <div>Aucun item à traiter.</div>
      )}
    </div>
  );
}
