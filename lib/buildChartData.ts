// Types
type Item = {
    name: string;
    releaseDate: string;
    bloc: string;
    image?: string;
    type: "ETB" | "Display" | "Demi-Display" | "Tri-Pack" | "UPC" | "Artset" | "Bundle"; // ajouter tous les types existants
    retailPrice?: number; // prix retail à la sortie en magasin
    prices?: { date: string; price: number }[]; // historique des prix
  };
  
  export function buildChartData(item: Item) {
    const EPSILON = 1; // 1 ms pour éviter doublons sur l'axe X
  
    // Tous les prix historiques
    const pricesData = (item.prices ?? []).map(p => ({
      date: new Date(p.date).getTime(),
      price: p.price,
    }));
  
    // Ajouter retailPrice comme point initial
    const initialPoint = {
      date: new Date(item.releaseDate).getTime(),
      price: item.retailPrice ?? 0,
    };
  
    let fullData = [initialPoint, ...pricesData];
  
    // Trier par date croissante
    fullData.sort((a, b) => a.date - b.date);
  
    // Corriger doublons sur X (dates identiques)
    for (let i = 1; i < fullData.length; i++) {
      if (fullData[i].date <= fullData[i - 1].date) {
        fullData[i].date = fullData[i - 1].date + EPSILON;
      }
    }
  
    return fullData;
  }
  