"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSearch } from "@/hooks/useSearch";
import { insertPriceInDB } from "@/lib/insert-price";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const { run, loading: searchLoading } = useSearch();

  useEffect(() => {
    const fetchItems = async () => {
      const itemsCol = collection(db, "items");
      const snapshot = await getDocs(itemsCol);
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

  const handleSearchCurrent = async () => {
    if (currentIndex >= items.length) return;
    const item = items[currentIndex];
    const queryStr = `${item.type} ${item.name}`.trim();

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
      const result = await run(queryStr); // ⚡ run() retourne filteredVinted + minPrice

      if (!result) {
        setCurrentMinPrice(null);
        setCurrentError("Erreur lors de la recherche");
        return;
      }

      setCurrentMinPrice(result.minPrice ?? null);
      setVintedResults(result); // stocke les annonces Vinted pour affichage
    } catch (err: any) {
      setCurrentError(err?.message ?? "Erreur inconnue");
      setCurrentMinPrice(null);
      setVintedResults(null);
    }
  };

  const handleInsertPrice = async () => {
    if (currentMinPrice === null) return;
    const item = items[currentIndex];
    const today = new Date();
    const localDate = today.getFullYear() + '-' +
                      String(today.getMonth() + 1).padStart(2, '0') + '-' +
                      String(today.getDate()).padStart(2, '0');
    
    console.log(localDate);
  
    setSaving(true);
    try {
      await insertPriceInDB(item.id, { date: localDate, price: currentMinPrice });
      alert(`✅ Prix ajouté pour l'item ${item.name}`);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de l'ajout");
    } finally {
      setSaving(false);
    }
  };

  const handleNext = () => {
    setCurrentIndex((i) => i + 1);
    setCurrentMinPrice(null);
    setCurrentError(null);
    setVintedResults(null);
  };

  const handleDeleteItem = async () => {
    if (!currentItem) return;
  
    const confirmDelete = window.confirm(`⚠️ Voulez-vous vraiment supprimer "${currentItem.name}" ?`);
    if (!confirmDelete) return;
  
    try {
      await deleteDoc(doc(db, "items", currentItem.id));
      alert(`✅ Item "${currentItem.name}" supprimé`);
      
      // Mettre à jour la liste locale
      setItems((prev) => prev.filter((i) => i.id !== currentItem.id));
  
      // Passer à l'item suivant
      setCurrentIndex((i) => (i >= items.length - 1 ? 0 : i));
      setCurrentMinPrice(null);
      setCurrentError(null);
      setVintedResults(null);
    } catch (err) {
      console.error(err);
      alert("❌ Erreur lors de la suppression");
    }
  };

  const currentItem = items[currentIndex];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Scanner Items et récupérer prix Vinted</h1>

      {currentItem && (
        <div className="mb-3 text-gray-700 font-medium">
            Item {currentIndex + 1} / {items.length}
            <span className="ml-2 text-sm text-gray-500">
            (Restants : {items.length - currentIndex - 1})
            </span>
        </div>
        )}
      {currentItem ? (
        <div className="border rounded p-4 bg-white space-y-3">
          <div className="font-medium">{currentItem.type} {currentItem.name}</div>
          <div className="text-sm text-gray-800">Type: {currentItem.type}</div>

          {currentError && <div className="text-sm text-red-600">{currentError}</div>}

          {!currentError && currentMinPrice !== null && (
            <div className="text-sm text-gray-800 flex items-center gap-2">
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
                <Card key={i} className="hover:shadow-lg cursor-pointer" onClick={() => item.url && window.open(item.url, "_blank")}>
                <CardHeader>
                    <CardTitle className="text-sm">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-28 object-contain mb-1" />}
                    <span className="font-medium">{item.price} €</span>
                </CardContent>
                </Card>
            ))}
            </div>
        </section>
        )}

          <div className="flex gap-2 mt-3">
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
      ) : (
        <div>Aucun item à traiter.</div>
      )}
    </div>
  );
}
