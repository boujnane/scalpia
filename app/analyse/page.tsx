"use client";

import { useEffect, useState } from "react";
import { Item } from "@/lib/analyse/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnalyseTabs from "@/components/analyse/analyseTabs";

export default function AnalysePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      const querySnapshot = await getDocs(collection(db, "items"));
      const fetchedItems: Item[] = [];

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data() as Omit<Item, "prices">;
        const pricesSnap = await getDocs(collection(db, `items/${docSnap.id}/prices`));
        const prices = pricesSnap.docs.map(p => p.data() as { date: string; price: number });
        fetchedItems.push({ ...data, prices });
      }

      setItems(fetchedItems);
      setLoading(false);
    }

    fetchItems();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-center text-lg text-gray-600">
        Chargement des items...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <header className="mb-4">
        <h1 className="text-3xl font-bold">Analyse des Items</h1>
        <p className="text-gray-500 mt-1">
          Visualisez les prix et l’évolution des différents types d’items par bloc.
        </p>
      </header>

      <section className="bg-white p-4 rounded-lg shadow-md">
        <AnalyseTabs items={items} />
      </section>
    </div>
  );
}
