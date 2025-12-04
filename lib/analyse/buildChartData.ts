// Types
export type Point = { 
  date: number; // Timestamp (getTime())
  price: number;
};

export type Item = {
    name: string;
    releaseDate: string;
    bloc: string;
    image?: string;
    type: "ETB" | "Display" | "Demi-Display" | "Tri-Pack" | "UPC" | "Artset" | "Bundle"; // ajouter tous les types existants
    retailPrice?: number; // prix retail à la sortie en magasin
    prices?: { date: string; price: number }[]; // historique des prix
  };
  
  // Exemple de modification de buildChartData :
export function buildChartData(item: Item) {
  const dailyPrices = new Map<string, number[]>(); // Clé: 'YYYY-MM-DD'

  // 1. Regrouper les prix par jour
  (item.prices ?? []).forEach(p => {
    const dateKey = p.date.split('T')[0] || p.date; // Simplification de la date en 'YYYY-MM-DD'
    if (!dailyPrices.has(dateKey)) {
      dailyPrices.set(dateKey, []);
    }
    dailyPrices.get(dateKey)?.push(p.price);
  });

  // 2. Calculer la médiane pour chaque jour
  let aggregatedData: Point[] = Array.from(dailyPrices.entries()).map(([dateKey, prices]) => {
    // Fonction utilitaire pour calculer la médiane
    prices.sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    const median = prices.length % 2 !== 0 
        ? prices[mid] 
        : (prices[mid - 1] + prices[mid]) / 2;
        
    return {
      date: new Date(dateKey).getTime(),
      price: median, // ⬅️ On utilise la médiane agrégée
    };
  });
  
  // 3. Ajouter retailPrice si nécessaire, puis trier
  if (item.retailPrice && item.retailPrice > 0) {
      aggregatedData.push({
          date: new Date(item.releaseDate).getTime(),
          price: item.retailPrice,
      });
  }

  aggregatedData.sort((a, b) => a.date - b.date);

  // L'agrégation devrait rendre l'EPSILON inutile.
  return aggregatedData;
}
  