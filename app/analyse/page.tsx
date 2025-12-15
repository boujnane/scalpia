"use client";

import { useEffect, useState } from "react";
import { Item } from "@/lib/analyse/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnalyseTabs from "@/components/analyse/AnalyseTabs";
import { Icons } from "@/components/icons"; // Ajouté pour le spinner
import AnalyseDashboard from "@/components/analyse/AnalyseDashboard";

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
    // Application du thème au chargement
    return (
      <div className="p-6 text-center text-lg text-muted-foreground flex flex-col items-center justify-center space-y-2">
        <Icons.spinner className="w-6 h-6 animate-spin text-primary" />
        <p>Chargement des items...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      <AnalyseDashboard items={items} />
      <header className="mb-4">
        {/* Application du thème au titre */}
        <h1 className="text-3xl font-bold text-foreground">Analyse des Items</h1>
        <p className="text-muted-foreground mt-1">
          Visualisez les prix et l’évolution des différents types d’items par bloc.
        </p>
      </header>

      <section className="bg-card p-4 rounded-xl shadow-lg border border-border">
        <AnalyseTabs items={items} />
      </section>
    </div>
  );
}