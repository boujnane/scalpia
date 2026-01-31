// lib/seriesNameMapper.ts

// Dictionnaire complet des séries Pokémon TCG
const SERIES_FR: Record<string, string> = {
  // Séries récentes
  "Ascended Heroes": "Héros Transcendants",
  "Mega Evolution": "Méga-Évolution",
  "Scarlet & Violet": "Écarlate et Violet",
  "Sword & Shield": "Épée et Bouclier",
  "Sun & Moon": "Soleil et Lune",
  "XY": "XY",
  "Black & White": "Noir et Blanc",
  // Séries classiques
  "HeartGold & SoulSilver": "HeartGold & SoulSilver",
  "Platinum": "Platine",
  "Diamond & Pearl": "Diamant et Perle",
  "EX": "EX",
  "E-Card": "E-Card",
  "Neo": "Neo",
  "Gym": "Gym",
  "Base": "Base",
};

// 2) Normalisation (évite les mismatch sur espaces/casse)
export function normSeriesKey(s: string) {
  return s.trim().replace(/\s+/g, " ").toLowerCase();
}

const SERIES_FR_NORM = Object.fromEntries(
  Object.entries(SERIES_FR).map(([k, v]) => [normSeriesKey(k), v])
);

// Set pour éviter de logger plusieurs fois le même nom manquant
const loggedMissingSeries = new Set<string>();

export function mapSeriesNameToFR(seriesName?: string | null) {
  if (!seriesName) return "Autres";
  const hit = SERIES_FR_NORM[normSeriesKey(seriesName)];

  if (!hit && !loggedMissingSeries.has(seriesName)) {
    loggedMissingSeries.add(seriesName);
    console.warn(`[SERIES MANQUANTE] "${seriesName}" → pas de traduction FR`);
  }

  return hit ?? seriesName; // fallback = anglais si inconnu
}