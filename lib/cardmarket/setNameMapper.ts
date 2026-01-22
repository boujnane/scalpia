// lib/setNameMapper.ts

/**
 * Mapping OFFICIEL des noms de sets Pokémon TCG
 * Anglais (API / Cardmarket / TCGGO) → Français (produits FR)
 * Couverture exhaustive : Mega Evolution → Ruby & Sapphire
 */

const SETS_FR: Record<string, string> = {
  // =======================
  // MEGA EVOLUTION
  // =======================
  "Mega Evolution": "Méga-Évolution",
  "Phantasmal Flames": "Flammes Fantasmagoriques",

  // =======================
  // SCARLET & VIOLET
  // =======================
  "Scarlet & Violet": "Écarlate et Violet",
  "Paldea Evolved": "Évolutions à Paldea",
  "Obsidian Flames": "Flammes Obsidiennes",
  "Paradox Rift": "Faille Paradoxe",
  "Temporal Forces": "Forces Temporelles",
  "Twilight Masquerade": "Mascarade Crépusculaire",
  "Stellar Crown": "Couronne Stellaire",
  "Surging Sparks": "Étincelles Déferlantes",
  "Journey Together": "Aventures Ensemble",
  "Destined Rivals": "Rivalités Destinées",
  "White Flare": "Flamme Blanche",
  "Black Bolt" : "Foudre Noire",

  // Special sets SV
  "Paldean Fates": "Destinées de Paldea",
  "Shrouded Fable": "Fable Nébuleuse",
  "Prismatic Evolutions": "Évolutions Prismatiques",

  // =======================
  // SWORD & SHIELD
  // =======================
  "Sword & Shield": "Épée et Bouclier",
  "Rebel Clash": "Clash des Rebelles",
  "Darkness Ablaze": "Ténèbres Embrasées",
  "Vivid Voltage": "Voltage Éclatant",
  "Battle Styles": "Styles de Combat",
  "Chilling Reign": "Règne de Glace",
  "Evolving Skies": "Évolution Céleste",
  "Fusion Strike": "Poing de Fusion",
  "Brilliant Stars": "Stars Étincelantes",
  "Astral Radiance": "Astres Radieux",
  "Lost Origin": "Origine Perdue",
  "Silver Tempest": "Tempête Argentée",

  // Special sets SWSH
  "Champion's Path": "La Voie du Maître",
  "Shining Fates": "Destinées Radieuses",
  "Pokémon GO": "Pokémon GO",
  "Crown Zenith": "Zénith Suprême",

  // =======================
  // SUN & MOON
  // =======================
  "Sun & Moon": "Soleil et Lune",
  "Guardians Rising": "Gardiens Ascendants",
  "Burning Shadows": "Ombres Ardentes",
  "Crimson Invasion": "Invasion Carmin",
  "Ultra Prism": "Ultra-Prisme",
  "Forbidden Light": "Lumière Interdite",
  "Celestial Storm": "Tempête Céleste",
  "Lost Thunder": "Tonnerre Perdu",
  "Team Up": "Duo de Choc",
  "Unbroken Bonds": "Alliance Infaillible",
  "Unified Minds": "Harmonie des Esprits",
  "Cosmic Eclipse": "Éclipse Cosmique",

  // Special sets SM
  "Shining Legends": "Légendes Brillantes",
  "Dragon Majesty": "Majesté des Dragons",
  "Hidden Fates": "Destinées Occultes",

  // =======================
  // XY
  // =======================
  "XY": "XY",
  "Flashfire": "Étincelles",
  "Furious Fists": "Poings Furieux",
  "Phantom Forces": "Vigueur Spectrale",
  "Primal Clash": "Primo-Choc",
  "Roaring Skies": "Ciel Rugissant",
  "Ancient Origins": "Origines Antiques",
  "BREAKthrough": "Impact des Destins",
  "BREAKpoint": "Rupture Turbo",
  "Fates Collide": "Impulsion Turbo",
  "Steam Siege": "Offensive Vapeur",
  "Evolutions": "Évolutions",

  // Special sets XY
  "Double Crisis": "Double Danger",
  "Generations": "Générations",

  // =======================
  // BLACK & WHITE
  // =======================
  "Black & White": "Noir et Blanc",
  "Emerging Powers": "Pouvoirs Émergents",
  "Noble Victories": "Nobles Victoires",
  "Next Destinies": "Destinées Futures",
  "Dark Explorers": "Explorateurs Obscurs",
  "Dragons Exalted": "Dragons Exaltés",
  "Boundaries Crossed": "Frontières Franchies",
  "Plasma Storm": "Tempête Plasma",
  "Plasma Freeze": "Glaciation Plasma",
  "Plasma Blast": "Explosion Plasma",
  "Legendary Treasures": "Trésors Légendaires",

  // =======================
  // HEARTGOLD & SOULSILVER
  // =======================
  "HeartGold & SoulSilver": "HeartGold et SoulSilver",
  "Unleashed": "Déchaînement",
  "Undaunted": "Indomptable",
  "Triumphant": "Triomphe",
  "Call of Legends": "L’Appel des Légendes",

  // =======================
  // PLATINUM
  // =======================
  "Platinum": "Platine",
  "Rising Rivals": "Rivaux Émergeants",
  "Supreme Victors": "Vainqueurs Suprêmes",
  "Arceus": "Arceus",

  // =======================
  // DIAMOND & PEARL
  // =======================
  "Diamond & Pearl": "Diamant et Perle",
  "Mysterious Treasures": "Trésors Mystérieux",
  "Secret Wonders": "Merveilles Secrètes",
  "Great Encounters": "Duels au Sommet",
  "Majestic Dawn": "Aube Majestueuse",
  "Legends Awakened": "L'Éveil des Légendes",
  "Stormfront": "Tempête",

  // =======================
  // EX – RUBY & SAPPHIRE
  // =======================
  "Ruby & Sapphire": "EX Rubis & Saphir",
  "Sandstorm": "EX Tempête de Sable",
  "Dragon": "EX Dragon",
  "Team Magma vs Team Aqua": "EX Team Magma contre Team Aqua",
  "Hidden Legends": "EX Légendes Oubliées",
  "FireRed & LeafGreen": "EX Rouge Feu & Vert Feuille",
  "Team Rocket Returns": "EX Team Rocket Le Retour",
  "Deoxys": "EX Deoxys",
  "Emerald": "EX Émeraude",
  "Unseen Forces": "EX Forces Cachées",
  "Delta Species": "EX Espèces Delta",
  "Legend Maker": "EX Créateurs de Légendes",
  "Holon Phantoms": "EX Fantômes Holon",
  "Crystal Guardians": "EX Gardiens de Cristal",
  "Dragon Frontiers": "EX Île des Dragons",
  "Power Keepers": "EX Gardiens du Pouvoir",
};

/* =======================
   Normalisation & API
======================= */

function norm(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

const SETS_FR_NORM = Object.fromEntries(
  Object.entries(SETS_FR).map(([k, v]) => [norm(k), v])
);

// Set pour éviter de logger plusieurs fois le même nom manquant
const loggedMissingSets = new Set<string>();

export function mapSetNameToFR(name?: string | null) {
  if (!name) return "Set inconnu";
  const hit = SETS_FR_NORM[norm(name)];

  if (!hit && !loggedMissingSets.has(name)) {
    loggedMissingSets.add(name);
    console.warn(`[SET MANQUANT] "${name}" → pas de traduction FR`);
  }

  return hit ?? name; // fallback EN safe
}