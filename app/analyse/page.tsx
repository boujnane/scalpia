"use client";

import { useEffect, useState } from "react";
import { Item } from "@/lib/analyse/types";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AnalyseTabs from "@/components/analyse/AnalyseTabs";
import { Icons } from "@/components/icons";
import AnalyseDashboard from "@/components/analyse/AnalyseDashboard";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Constante pour gérer la valeur par défaut de l'accordéon (ouvert sur desktop, fermé sur mobile si préféré)
// Ici, nous le gardons ouvert par défaut pour l'importance de la synthèse.
const DEFAULT_ACCORDION_VALUE = "dashboard"; 

export default function AnalysePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // --- Logique de récupération de données ---
  useEffect(() => {
    async function fetchItems() {
      // ... (Votre logique de récupération Firebase)
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
    // Application du thème au chargement (pas de changement nécessaire ici)
    return (
      <div className="p-4 sm:p-6 text-center text-lg text-muted-foreground flex flex-col items-center justify-center space-y-2 min-h-screen">
        <Icons.spinner className="w-6 h-6 animate-spin text-primary" />
        <p>Chargement des items...</p>
      </div>
    );
  }

  return (
    // Utilisation de `p-4` sur mobile et `sm:p-6` sur desktop, et `space-y-4` sur mobile
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      
      {/* 1. ACCORDION (Synthèse/Dashboard) - Toujours en haut pour l'importance */}
      <Accordion
        type="single"
        collapsible
        defaultValue={DEFAULT_ACCORDION_VALUE}
        className="w-full"
      >
        <AccordionItem value="dashboard" className="border-b-0">
          {/* Trigger optimisé pour mobile : padding horizontal léger, texte mieux centré */}
          <AccordionTrigger className="text-left py-3 sm:py-4 px-2 sm:px-4 hover:bg-muted/50 rounded-xl transition-colors bg-card shadow-sm border border-border">
            <div className="flex items-start space-x-3 w-full">
              {/* Icône */}
              <Icons.activity className="w-5 h-5 mt-3 text-primary shrink-0" /> 
              
              <div className="flex flex-col flex-grow min-w-0">
                {/* Titre principal */}
                <span className="font-extrabold text-base sm:text-lg text-foreground truncate">
                  Synthèse et Tendances Globales
                </span>
                
                {/* Description secondaire - Masquée sur les petits mobiles (< sm) pour gagner de la place */}
                <span className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block"> 
                  Vue consolidée (Variation Pondérée, Indice de Confiance, Tendance)
                </span>
                 {/* Version très courte pour les petits mobiles */}
                 <span className="text-xs text-muted-foreground mt-0.5 block sm:hidden"> 
                  Analyse consolidée (Variation, IC, Tendance)
                </span>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pt-2 pb-0 sm:pt-4">
            {/* Le Dashboard lui-même, qui gérera son propre responsive */}
            <AnalyseDashboard items={items} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 2. HEADER - Réduction de la taille H1 sur mobile si nécessaire */}
      <header className="mb-2 sm:mb-4 pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Détail des produits scellés Pokémon</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Visualisez les prix et l’évolution des différents types d’items par bloc.
        </p>
      </header>

      {/* 3. SECTION PRINCIPALE (Onglets) */}
      <section className="bg-card p-2 sm:p-4 rounded-xl shadow-lg border border-border">
        {/* Les onglets eux-mêmes doivent être responsive (souvent géré par la librairie d'onglets) */}
        <AnalyseTabs items={items} />
      </section>
    </div>
  );
}