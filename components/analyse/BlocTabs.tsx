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
    <Tabs defaultValue={defaultBloc} className="space-y-4 bg-transparent">
      {/* Liste des onglets de blocs */}
      <TabsList className="gap-3 p-2 flex flex-wrap bg-transparent">
        {sortedBlocs.map(([bloc]) => (
          <TabsTrigger
            key={bloc}
            value={bloc}
            className="
              group
              p-5
              bg-transparent      /* Fond normal transparent */
              border-none
              shadow-none
              focus:outline-none
              rounded-lg
              data-[state=active]:bg-transparent
              data-[state=active]:shadow-none
              data-[state=active]:border-none
            "
          >
            <img
              src={blocImages[bloc] ?? "/default.png"}
              alt={bloc}
              className="
                h-10 w-auto object-contain transition-all duration-200
                hover:scale-105
                group-data-[state=active]:scale-125
                group-data-[state=active]:ring-2
                group-data-[state=active]:ring-indigo-500
                group-data-[state=active]:rounded-lg
                group-data-[state=active]:bg-transparent
              "
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
