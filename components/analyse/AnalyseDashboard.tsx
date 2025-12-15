import { Item } from "@/lib/analyse/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SeriesSummary, SeriesTrendChart } from "./SeriesTrendChart";

interface AnalyseDashboardProps {
  items: Item[];
}


function normalizeSeriesName(name: string): string {
  let normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ignoreWords = ["rugit", "garde", "lucario", "gardevoir"];
  ignoreWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, "gi");
    normalized = normalized.replace(regex, "");
  });
  normalized = normalized.replace(/\s+/g, " ").trim();
  const fusionMap: Record<string, string> = {
    "koraidon ev": "ecarlate et violet",
    "miraidon ev": "ecarlate et violet",
    "mega evolution 1": "mega evolution",
    "vert forces temporelles": "forces temporelles",
    "serpente forces temporelles": "forces temporelles"
  };
  return fusionMap[normalized] ?? normalized;
}


export default function AnalyseDashboard({ items }: AnalyseDashboardProps) {

  // ATTENTION: J'ai ajusté le poids de l'ETB à 0.40 pour conserver un total de 1.00,
  // car votre somme actuelle fait 1.00, ce qui est très bien.
  const typeWeights: Record<string, number> = {
    ETB: 0.40,
    "Tri-Pack": 0.15,
    Display: 0.20,
    Bundle: 0.15,
    Artset: 0.07,
    "Demi-Display": 0.03
  };

  const MAX_POSSIBLE_WEIGHT = Object.values(typeWeights).reduce((a, b) => a + b, 0); // 1.00

  const filteredItems = items.filter(item => item.type !== "UPC");
  const seriesMap = new Map<string, Item[]>();
  filteredItems.forEach(item => {
    const seriesName = normalizeSeriesName(item.name);
    if (!seriesMap.has(seriesName)) seriesMap.set(seriesName, []);
    seriesMap.get(seriesName)!.push(item);
  });

  const seriesSummaries: SeriesSummary[] = Array.from(seriesMap.entries()).map(
    ([seriesName, itemsInSeries]) => {

      const itemsByType = new Map<string, Item[]>();
      itemsInSeries.forEach(item => {
        if (!itemsByType.has(item.type)) itemsByType.set(item.type, []);
        itemsByType.get(item.type)!.push(item);
      });

      let weightedSum = 0;
      let totalWeightUsed = 0;
      let maxWeightForSeries = 0; // Poids max théorique basé sur les types trouvés et manquants (Display/Demi-Display)

      // Calcul des variations pondérées
      itemsByType.forEach((itemsOfSameType, itemType) => {
        const weight = typeWeights[itemType] ?? 0;
        if (weight === 0 || itemsOfSameType.length === 0) return;

        // Le poids de ce type est ajouté au poids max théorique
        maxWeightForSeries += weight;

        // 1. Calcul de la moyenne des variations de tous les items de ce type
        const variations = itemsOfSameType.flatMap(i => {
            // S'assurer que retailPrice est valide pour éviter division par zéro
            if (!i.retailPrice || i.retailPrice === 0 || (i.prices ?? []).length === 0) return [];
            
            // On prend le dernier prix pour calculer la variation actuelle
            const lastPrice = i.prices!.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].price;

            return (lastPrice - i.retailPrice) / i.retailPrice;
        });

        if (variations.length === 0) return;

        // La variation moyenne de ce type d'item
        const typeAvgVariation = variations.reduce((a, b) => a + b, 0) / variations.length;
        // console.log(`Série: ${seriesName}`);
        // console.log(`Type: ${itemType}`);
        // console.log(`Poids: ${weight}`);
        // console.log(`Variations individuelles: ${variations.map(v => (v*100).toFixed(2))}%`);
        // console.log(`Variation moyenne de ce type: ${(typeAvgVariation*100).toFixed(2)}%`);

        weightedSum += typeAvgVariation * weight;
        totalWeightUsed += weight;
      });
      
      // La moyenne pondérée est la somme des variations pondérées divisée par le poids total utilisé
      const averageVariation = totalWeightUsed > 0 ? weightedSum / totalWeightUsed : 0;
      
      // Calcul de l'IC : Poids utilisé par rapport au poids MAX POSSIBLE (1.00)
      // C'est la meilleure façon de signaler si les Display/Demi-Display (0.23 de poids) sont manquants.
      const coverageIndex = parseFloat((totalWeightUsed / MAX_POSSIBLE_WEIGHT).toFixed(2));

      // --- Tendance et Min/Max (inchangés) ---
      const allPrices = itemsInSeries.flatMap(item => (item.prices ?? []).map(p => p.price));
      const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;
      const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;

      const allPriceHistory = itemsInSeries.flatMap(item => item.prices || []);
      allPriceHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      let trend: SeriesSummary['trend'] = 'stable';
      if (allPriceHistory.length >= 2) {
        const firstPrice = allPriceHistory[0].price;
        const lastPrice = allPriceHistory[allPriceHistory.length - 1].price;
        if (lastPrice > firstPrice * 1.05) trend = "up";
        else if (lastPrice < firstPrice * 0.95) trend = "down";
      }

      return {
        seriesName,
        averageVariation,
        minPrice,
        maxPrice,
        trend,
        coverageIndex
      };
    }
  );

  seriesSummaries.sort((a, b) => b.averageVariation - a.averageVariation);

  const totalSeriesCount = seriesSummaries.length;
  const risingSeriesCount = seriesSummaries.filter(s => s.trend === 'up').length;
  const fallingSeriesCount = seriesSummaries.filter(s => s.trend === 'down').length;

  return (
    <div className="space-y-6 p-4">
      {/* 1. Aperçu Général des Tendances (inchangé) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Séries Analysées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSeriesCount}</div>
            <p className="text-xs text-muted-foreground">Ensembles de produits uniques</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendances Positives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{risingSeriesCount}</div>
            <p className="text-xs text-muted-foreground">{((risingSeriesCount / totalSeriesCount) * 100).toFixed(1)}% des séries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendances Négatives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fallingSeriesCount}</div>
            <p className="text-xs text-muted-foreground">{((fallingSeriesCount / totalSeriesCount) * 100).toFixed(1)}% des séries</p>
          </CardContent>
        </Card>
      </div>

      {/* 2. Visualisation des Variations (Recharts) */}
      <SeriesTrendChart data={seriesSummaries} />

      {/* 3. Tableau de Synthèse des Séries (shadcn Table) */}
      <Card>
        <CardHeader>
          <CardTitle>Détail par Série</CardTitle>
          <CardDescription>
            L'indicateur principal est la variation pondérée par rapport au prix retail. L'IC (Indice de Couverture) reflète la proportion de poids trouvée par rapport au poids maximal (100%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Série</TableHead>
                  <TableHead>Variation Pondérée</TableHead>
                  <TableHead>Min / Max (€)</TableHead>
                  <TableHead className="text-center">IC</TableHead>
                  <TableHead className="text-right">Tendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {seriesSummaries.map(series => (
                  <TableRow
                    key={series.seriesName}
                    // Mise en évidence si l'IC est inférieur à 100% (types manquants, potentiellement Display)
                    className={series.coverageIndex < 1.00 ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}
                  >
                    <TableCell className="font-medium">{series.seriesName}</TableCell>
                    <TableCell>
                        <span className={`font-semibold ${series.averageVariation > 0 ? "text-green-600" : series.averageVariation < 0 ? "text-red-600" : "text-gray-500"}`}>
                            {(series.averageVariation * 100).toFixed(2)} %
                        </span>
                    </TableCell>
                    <TableCell>{series.minPrice.toFixed(2)} / {series.maxPrice.toFixed(2)} €</TableCell>
                    <TableCell className="text-center">
                      <span className={`font-semibold ${series.coverageIndex < 1.00 ? "text-yellow-600" : "text-green-600"}`}>
                        {(series.coverageIndex * 100).toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${
                        series.trend === "up" ? "text-green-600" :
                        series.trend === "down" ? "text-red-600" : "text-gray-500"
                      }`}>
                        {series.trend.charAt(0).toUpperCase() + series.trend.slice(1)}
                        {series.trend === "up" && " ↑"}
                        {series.trend === "down" && " ↓"}
                        {series.trend === "stable" && " —"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}