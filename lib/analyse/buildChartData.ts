import { Item } from "./types";

// Types
export type Point = { 
  date: number; // Timestamp (getTime())
  price: number;
};
  
  // Exemple de modification de buildChartData :
  export function buildChartData(item: Item): Point[] {
    const EPSILON = 1; // empêche les collisions de dates sur l'axe X
  
    // ----------------------------
    // 1. Nettoyage & parsing sûr des prix
    // ----------------------------
    const validPrices = (item.prices ?? [])
      .map(p => {
        const t = new Date(p.date).getTime();
        if (isNaN(t) || typeof p.price !== "number") return null;
        return { date: t, price: p.price };
      })
      .filter(Boolean) as { date: number; price: number }[];
  
    // ----------------------------
    // 2. Groupement des prix par "YYYY-MM-DD"
    // ----------------------------
    const dailyPrices = new Map<string, number[]>();
  
    validPrices.forEach(p => {
      const dateKey = new Date(p.date).toISOString().split("T")[0]; // Toujours fiable
      if (!dailyPrices.has(dateKey)) dailyPrices.set(dateKey, []);
      dailyPrices.get(dateKey)!.push(p.price);
    });
  
    // ----------------------------
    // 3. Médians quotidiennes (safe)
    // ----------------------------
    let aggregatedData: Point[] = Array.from(dailyPrices.entries())
      .map(([dateKey, prices]) => {
        prices.sort((a, b) => a - b);
        const mid = Math.floor(prices.length / 2);
        const median =
          prices.length % 2 !== 0
            ? prices[mid]
            : (prices[mid - 1] + prices[mid]) / 2;
  
        const timestamp = new Date(dateKey).getTime();
        if (isNaN(timestamp)) return null;
  
        return { date: timestamp, price: median };
      })
      .filter(Boolean) as Point[];
  
    // ----------------------------
    // 4. Ajouter le prix retail (safe)
    // ----------------------------
    if (item.retailPrice && item.retailPrice > 0) {
      const releaseTimestamp = new Date(item.releaseDate).getTime();
      if (!isNaN(releaseTimestamp)) {
        aggregatedData.push({
          date: releaseTimestamp,
          price: item.retailPrice,
        });
      }
    }
  
    // ----------------------------
    // 5. Tri croissant par date
    // ----------------------------
    aggregatedData.sort((a, b) => a.date - b.date);
  
    // ----------------------------
    // 6. Correction des timestamps dupliqués via EPSILON
    // ----------------------------
    for (let i = 1; i < aggregatedData.length; i++) {
      if (aggregatedData[i].date <= aggregatedData[i - 1].date) {
        aggregatedData[i].date = aggregatedData[i - 1].date + EPSILON;
      }
    }
  
    return aggregatedData;
  }
  