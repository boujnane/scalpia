import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Item } from "@/lib/analyse/types";
import { groupByBloc } from "@/lib/analyse/groupByBloc";
import { blocImages } from "@/lib/analyse/blocImages";
import BlocChart from "./BlocCharts";
import ItemsGrid from "./ItemsGrid";

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
    return <div className="p-6 text-gray-500">Aucun item disponible.</div>;
  }

  return (
    <Tabs defaultValue={defaultBloc} className="space-y-4">
      {/* Liste des onglets de blocs */}
      <TabsList className="gap-3 p-2 flex flex-wrap">
        {sortedBlocs.map(([bloc]) => (
          <TabsTrigger
            key={bloc}
            value={bloc}
            className="flex items-center justify-center p-2 rounded-md border border-transparent transition-all duration-200
                      hover:scale-105 hover:shadow-md
                      data-[state=active]:scale-110
                      data-[state=active]:shadow-[0_0_15px_rgba(99,102,241,0.6)]
                      data-[state=active]:border-indigo-500"
          >
            <img
              src={blocImages[bloc] ?? "/default.png"}
              alt={bloc}
              className="h-10 w-auto object-contain transition-transform duration-200"
            />
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Contenu des blocs */}
      {sortedBlocs.map(([bloc, blocItems]) => (
        <TabsContent key={bloc} value={bloc} className="space-y-6">
          {blocItems.length === 0 ? (
            <div className="p-4 text-gray-500">Aucun item dans ce bloc.</div>
          ) : (
            <>
              <BlocChart items={blocItems} />
              <ItemsGrid items={blocItems} />
            </>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
