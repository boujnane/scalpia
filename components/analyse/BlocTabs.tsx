"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Item } from "@/lib/analyse/types";
import { groupByBloc } from "@/lib/analyse/groupByBloc";
import { blocImages } from "@/lib/analyse/blocImages";
import BlocChart from "./BlocCharts";
import ItemsGrid from "./ItemsGrid";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { Icons } from "../icons"; // Assurez-vous d'importer Icons

type BlocTabsProps = {
  items?: Item[];
};

export default function BlocTabs({ items }: BlocTabsProps) {
  const safeItems = items ?? [];

  // Trier les items par date de sortie décroissante
  const sortedItems = [...safeItems].sort(
    (a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
  );

  // Grouper par bloc
  const blocs = groupByBloc(sortedItems);

  // Transformer en tableau trié
  const sortedBlocs = Object.entries(blocs).sort((a, b) => {
    const aMax = Math.max(...a[1].map((i) => new Date(i.releaseDate).getTime()));
    const bMax = Math.max(...b[1].map((i) => new Date(i.releaseDate).getTime()));
    return bMax - aMax;
  });

  // Valeur par défaut sécurisée pour le premier onglet
  const defaultBloc = sortedBlocs[0]?.[0] ?? "";

  // Si aucun item n'est présent
  if (sortedBlocs.length === 0) {
    // Utilisation du style thématique
    return <div className="p-6 text-muted-foreground">Aucun item disponible.</div>;
  }

  return (
    <Tabs defaultValue={defaultBloc} className="space-y-4 bg-transparent">
      
      {/* Liste des onglets de blocs (Neutralisée) */}
      <TabsList className="gap-3 p-2 flex flex-wrap bg-transparent">
        {sortedBlocs.map(([bloc]) => (
          <TabsTrigger
            key={bloc}
            value={bloc}
            className="
              group
              p-2                     
              bg-transparent           /* Fond totalement transparent */
              border-none              /* Aucune bordure */
              shadow-none              /* Aucune ombre */
              outline-none             /* Retire l'anneau de focus par défaut */
              rounded-lg
              /* Assure la neutralité de l'état actif pour le conteneur */
              data-[state=active]:bg-transparent
              data-[state=active]:shadow-none
              data-[state=active]:border-none
              data-[state=active]:ring-0
            "
          >
            <img
              src={blocImages[bloc] ?? "/default.png"}
              alt={bloc}
              className="
                h-10 w-auto object-contain transition-all duration-200
                hover:scale-105
                /* Styles appliqués UNIQUEMENT à l'image lorsque l'onglet est ACTIF */
                group-data-[state=active]:scale-115
                group-data-[state=active]:ring-2
                group-data-[state=active]:ring-primary       /* Couleur thématique */
                group-data-[state=active]:rounded-lg
                group-data-[state=active]:p-1
              "
            />
          </TabsTrigger>
        ))}
      </TabsList>


      {/* Contenu des blocs */}
      {sortedBlocs.map(([bloc, blocItems]) => (
        <TabsContent key={bloc} value={bloc} className="space-y-6 pt-4">
          {blocItems.length === 0 ? (
            // Application du style thématique
            <div className="p-4 text-muted-foreground">Aucun item dans ce bloc.</div>
          ) : (
            <>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem 
                  value="bloc-chart"
                  // Application du style thématique
                  className="border border-border rounded-xl shadow-md bg-card/70 backdrop-blur-sm transition-all"
                >
                  <AccordionTrigger
                    className="
                      px-4 py-3
                      text-lg font-medium text-foreground
                      hover:no-underline
                      flex items-center justify-between
                      [&>svg]:transition-transform
                      data-[state=open]:[&>svg]:rotate-180
                    "
                  >
                    <span className="flex items-center gap-2">
                      {/* Utilisation de l'icône thématique */}
                      <Icons.LineChart className="w-5 h-5 text-primary" />
                      Historique des variations de prix
                    </span>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4 pt-2">
                    <BlocChart items={blocItems} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <ItemsGrid items={blocItems} />
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}