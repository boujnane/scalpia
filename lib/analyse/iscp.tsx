// lib/analyse/ISCP.ts
import { Point, Item } from "./types";

// ---------- Poids Fixes Manuels ----------
// Ces poids sont utilisés pour pondérer l'importance de chaque type de produit dans l'index composite.
const FIXED_WEIGHTS: Record<string, number> = {
  ETB: 0.35,
  Tripack: 0.25,
  Display: 0.20,
  Bundle: 0.10,
  Artset: 0.07,
  "Demi-Display": 0.03,
};
// Vérification simple que la somme est 1, sinon il faudra normaliser.
// Ici, 0.35 + 0.25 + 0.20 + 0.10 + 0.07 + 0.03 = 1.00

// ---------- Helpers ----------
function toDateKey(ts: number) {
  return new Date(ts).toISOString().split("T")[0];
}

function mean(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// Optional EMA smoothing (applied on final series price)
function applyEMA(values: number[], alpha: number) {
  const out: number[] = [];
  if (values.length === 0) return out;
  let s = values[0];
  out.push(s);
  for (let i = 1; i < values.length; i++) {
    const v = values[i];
    // S_t = alpha * V_t + (1 - alpha) * S_{t-1}
    s = alpha * v + (1 - alpha) * s;
    out.push(s);
  }
  return out;
}

// ---------- Core types and functions ----------

export type ISCPOptions = {
  // L'option volatilityWindowDays n'est plus pertinente car on n'utilise plus la volatilité pour les poids
  baseDate?: number | null; // timestamp used as base for base100; if null uses first date
  smoothSeriesEMA?: number | null; // if provided (0<alpha<=1) apply EMA smoothing on series price
};

// Align all item point series on a common daily calendar, forward-fill last known price.
// Returns: map itemName => Point[] (one Point per dateKey in unionDates)
export function alignAndFill(
  items: Item[],
  buildChartData: (item: Item) => Point[]
): { dates: number[]; seriesMap: Record<string, Point[]> } {
  // collect all dates
  const allDateKeys = new Set<string>();
  const rawByItem: Record<string, Map<string, number>> = {};

  for (const item of items) {
    const pts = buildChartData(item);
    const m = new Map<string, number>();
    for (const p of pts) {
      const key = toDateKey(p.date);
      m.set(key, p.price);
      allDateKeys.add(key);
    }
    rawByItem[item.name] = m;
  }

  const sortedKeys = Array.from(allDateKeys).sort(); // ISO date strings sort lexicographically
  const dates = sortedKeys.map(k => new Date(k).getTime());

  const seriesMap: Record<string, Point[]> = {};

  for (const item of items) {
    const m = rawByItem[item.name];
    const series: Point[] = [];
    let lastPrice: number | null = null;
    for (const k of sortedKeys) {
      if (m.has(k)) {
        lastPrice = m.get(k)!;
      }
      // forward fill: if never seen price yet, we keep null -> we will skip dates before first known price
      series.push({ date: new Date(k).getTime(), price: lastPrice ?? NaN });
    }
    // Forward-fill (pris en charge ci-dessous pour être sûr d'avoir les prix pour l'index)
    seriesMap[item.name] = series;
  }

  return { dates, seriesMap };
}

// Forward-fill NaNs in seriesMap per item (use last known price). If still NaN at a date (before first known price), we keep NaN.
export function forwardFillSeries(seriesMap: Record<string, Point[]>) {
  const filled: Record<string, Point[]> = {};
  for (const k of Object.keys(seriesMap)) {
    const arr = seriesMap[k];
    const out: Point[] = [];
    let last: number | null = null;
    for (const p of arr) {
      // Seulement utiliser un prix si il est fini et positif
      if (Number.isFinite(p.price) && p.price > 0) {
        last = p.price;
        out.push({ date: p.date, price: last });
      } else {
        // Sinon utiliser le dernier prix connu ou NaN
        out.push({ date: p.date, price: last ?? NaN });
      }
    }
    filled[k] = out;
  }
  return filled;
}

/**
 * Calcule les poids pour chaque item en se basant sur la table de poids fixe
 * (FIXED_WEIGHTS) et le nom du bloc de l'item.
 */
export function computeFixedWeights(items: Item[]): Record<string, number> {
  const weights: Record<string, number> = {};
  let totalFixedWeight = 0;
  let itemsFound = 0;

  for (const item of items) {
    // Supposons que le nom du bloc (ETB, Display, Tripack, etc.) est dans item.blocName ou item.type
    // J'utilise ici item.type si l'Item contient un champ "type" correspondant aux clés de FIXED_WEIGHTS
    // Sinon, vous devrez ajuster l'accès à la clé pertinente (ex: item.name pourrait contenir le type).
    const itemType = item.type; // Ajuster ceci si 'type' n'est pas le champ contenant la catégorie
    const weight = FIXED_WEIGHTS[itemType] ?? 0; // Poids fixe, 0 si non trouvé

    if (weight > 0) {
      // Si plusieurs items ont le même type (ex: 3 ETB), nous devons répartir le poids.
      // Une approche simple est de trouver d'abord le total des poids fixes utilisés, puis normaliser.
      // Une approche plus simple est de supposer que chaque item est unique et de lui attribuer le poids fixe,
      // puis de s'assurer que la somme totale n'excède pas 1.

      // Ici, on attribue le poids fixe à chaque item si son type est dans la table.
      weights[item.name] = weight;
      totalFixedWeight += weight;
      itemsFound++;
    } else {
      weights[item.name] = 0;
    }
  }

  // Normalisation si la somme des poids fixes utilisés dépasse 1, ou si des types n'ont pas été trouvés.
  // L'implémentation la plus simple si FIXED_WEIGHTS couvre TOUS les types dans items et somme à 1:
  // Si le même type apparaît N fois, on divise le poids par N.
  
  const typeCounts: Record<string, number> = {};
  for(const item of items) {
      const itemType = item.type; // Ajuster si nécessaire
      typeCounts[itemType] = (typeCounts[itemType] ?? 0) + 1;
  }

  const finalWeights: Record<string, number> = {};
  for(const item of items) {
      const itemType = item.type; // Ajuster si nécessaire
      const baseWeight = FIXED_WEIGHTS[itemType] ?? 0;
      const count = typeCounts[itemType] ?? 1;
      
      // Répartir le poids fixe du type entre toutes les instances de ce type.
      // Le poids total des items du même type reste égal au poids fixe.
      finalWeights[item.name] = baseWeight / count;
  }

  // Renormalisation globale finale (juste au cas où)
  const sumFinal = Object.values(finalWeights).reduce((s, w) => s + w, 0);
  if (sumFinal === 0) {
      const v = 1 / items.length;
      for (const item of items) finalWeights[item.name] = v; // Fallback égal
  } else if (sumFinal !== 1) {
      for (const k of Object.keys(finalWeights)) {
          finalWeights[k] /= sumFinal;
      }
  }

  return finalWeights;
}


// Main entry: compute ISCP time series for a set of items using fixed weights
export function computeISCPForSeriesByFixedWeights(
  items: Item[],
  buildChartData: (item: Item) => Point[],
  opts: ISCPOptions = {}
) {
  // 1) align and forward-fill
  const { dates, seriesMap: rawSeriesMap } = alignAndFill(items, buildChartData);
  const seriesMap = forwardFillSeries(rawSeriesMap);

  // 2) compute weights using the fixed map
  // NOTE: On suppose ici que Item a une propriété 'type' qui correspond aux clés de FIXED_WEIGHTS
  // Si ce n'est pas le cas, vous devez adapter 'computeFixedWeights' pour extraire l'information pertinente du nom.
  const weights = computeFixedWeights(items);

  // 3) produce weighted series price per day
  const n = dates.length;
  const seriesPrices: { date: number; price: number }[] = [];

  for (let i = 0; i < n; i++) {
    let weightedSum = 0;
    let weightUsed = 0;
    
    // On doit s'assurer que la somme des poids des items *présents* à la date i est 1.
    const presentItemWeights: Record<string, number> = {};
    let sumPresentWeights = 0;

    // Étape A: Identifier les poids des items présents à la date i
    for (const name of Object.keys(seriesMap)) {
        const p = seriesMap[name][i]?.price;
        if (Number.isFinite(p) && p > 0) {
            const w = weights[name] ?? 0;
            presentItemWeights[name] = w;
            sumPresentWeights += w;
        }
    }
    
    // Étape B: Calculer la moyenne pondérée normalisée
    if (sumPresentWeights > 0) {
        for (const name of Object.keys(presentItemWeights)) {
            const p = seriesMap[name][i]?.price;
            const w_norm = presentItemWeights[name] / sumPresentWeights; // Poids renormalisé
            weightedSum += w_norm * p;
        }
        weightUsed = sumPresentWeights; // Juste pour l'indicateur
    }

    const priceToday = weightedSum; // Le prix est déjà normalisé
    seriesPrices.push({ date: dates[i], price: priceToday });
  }

  // 4) Optional smoothing
  let priceArray = seriesPrices.map(s => s.price);
  if (opts.smoothSeriesEMA && opts.smoothSeriesEMA > 0 && opts.smoothSeriesEMA <= 1) {
    // On doit gérer le fait que les NaN ne doivent pas polluer la moyenne
    const cleanPrices = priceArray.map(v => (Number.isFinite(v) && v > 0 ? v : 0));
    const sm = applyEMA(cleanPrices, opts.smoothSeriesEMA);
    
    // On réinsère les NaN aux dates originales (avant le premier prix valide)
    for(let i=0; i < seriesPrices.length; i++) {
        if (!Number.isFinite(seriesPrices[i].price) || seriesPrices[i].price === 0) {
            priceArray[i] = NaN; // Garder NaN si le prix agrégé était non valide
        } else {
            priceArray[i] = sm[i];
        }
    }
  }

  const seriesFinal = seriesPrices.map((p, idx) => ({ date: p.date, price: priceArray[idx] }));

  // 5) base100 normalization
  const baseDate = opts.baseDate ?? seriesFinal.find(s => Number.isFinite(s.price) && s.price > 0)?.date;
  let baseValue = NaN;
  
  // Trouver la valeur de base
  if (baseDate != null) {
    const b = seriesFinal.find(s => s.date === baseDate);
    if (b && Number.isFinite(b.price) && b.price > 0) baseValue = b.price;
    else {
      // trouver le premier prix valide si la date de base n'est pas trouvée
      const first = seriesFinal.find(s => Number.isFinite(s.price) && s.price > 0);
      baseValue = first?.price ?? NaN;
    }
  }

  // Application de la formule Base 100: (Prix_t / Prix_base) * 100
  const ISCPSeries = seriesFinal.map(s => ({
    date: s.date,
    price: Number.isFinite(s.price) && Number.isFinite(baseValue) && baseValue > 0 ? (100 * s.price) / baseValue : NaN,
  }));

  return {
    dates,
    weights,
    // volMap n'existe plus
    seriesPrice: seriesFinal, // weighted raw price (not base100)
    ISCPSeries, // base100
  };
}