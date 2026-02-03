// app/api/cards/search/route.ts
// Recherche FR (TCGdex) → Match Cardmarket (IDs + prix)

import { NextResponse } from "next/server";
import TCGdex, { Query } from "@tcgdex/sdk";
import { SET_MAPPING } from "@/lib/cardMapper";

const CARDMARKET_API_KEY = process.env.CARDMARKET_RAPIDAPI_KEY;
const CARDMARKET_BASE = "https://cardmarket-api-tcg.p.rapidapi.com";

const CM_EPISODE_MAP_CACHE = new Map<string, { map: Record<string, number>; ts: number }>();
const CM_EPISODE_MAP_TTL = 60 * 60 * 1000;

function mapSlugToTCGdex(slug: string | null | undefined): string | null {
  const normalized = String(slug || "").toLowerCase().trim();
  if (!normalized) return null;
  return normalized in SET_MAPPING ? SET_MAPPING[normalized] : null;
}

async function fetchCardmarketEpisodeMap(): Promise<Record<string, number>> {
  const cacheKey = "cm-episode-map:v1";
  const cached = CM_EPISODE_MAP_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CM_EPISODE_MAP_TTL) {
    return cached.map;
  }

  if (!CARDMARKET_API_KEY) return {};

  const episodes: any[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await fetch(`${CARDMARKET_BASE}/pokemon/episodes?page=${page}`, {
      headers: {
        "x-rapidapi-host": "cardmarket-api-tcg.p.rapidapi.com",
        "x-rapidapi-key": CARDMARKET_API_KEY,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      break;
    }

    const data = await res.json().catch(() => null);
    const batch = data?.data || [];
    episodes.push(...batch);

    if (page === 1) {
      totalPages = data?.paging?.total || 1;
    }
    page++;
  }

  episodes.sort((a, b) => {
    const aDate = a?.released_at ? new Date(a.released_at).getTime() : 0;
    const bDate = b?.released_at ? new Date(b.released_at).getTime() : 0;
    return bDate - aDate;
  });

  const map: Record<string, number> = {};
  for (const ep of episodes) {
    const tcgdexId = mapSlugToTCGdex(ep?.slug);
    if (!tcgdexId) continue;
    if (!(tcgdexId in map) && typeof ep?.id === "number") {
      map[tcgdexId] = ep.id;
    }
  }

  CM_EPISODE_MAP_CACHE.set(cacheKey, { map, ts: Date.now() });
  return map;
}

// Mapping inverse : TCGdex set ID → Cardmarket episode ID
const TCGDEX_TO_CARDMARKET_EPISODE: Record<string, number> = {
  // Mega Evolution
  "me01": 4901,
  "me02": 4938,
  // Scarlet & Violet
  "sv01": 4471,
  "sv02": 4559,
  "sv03": 4628,
  "sv03.5": 4683,
  "sv04": 4706,
  "sv04.5": 4791,
  "sv05": 4810,
  "sv06": 4851,
  "sv06.5": 4897,
  "sv07": 4911,
  "sv08": 4948,
  "sv08.5": 5003,
  "sv09": 5050,
  "sv10": 5105,
  "svp": 4472,
  // Sword & Shield
  "swsh1": 3647,
  "swsh2": 3700,
  "swsh3": 3766,
  "swsh3.5": 3817,
  "swsh4": 3839,
  "swsh4.5": 3922,
  "swsh5": 3945,
  "swsh6": 3985,
  "swsh7": 4024,
  "swsh8": 4103,
  "swsh9": 4145,
  "swsh10": 4203,
  "swsh10.5": 4261,
  "swsh11": 4278,
  "swsh12": 4345,
  "swsh12.5": 4433,
  "swshp": 3648,
  "cel25": 4066,
  // Sun & Moon
  "sm1": 2848,
  "sm2": 2922,
  "sm3": 2987,
  "sm3.5": 3040,
  "sm4": 3056,
  "sm5": 3117,
  "sm6": 3178,
  "sm7": 3235,
  "sm7.5": 3281,
  "sm8": 3300,
  "sm9": 3382,
  "sm10": 3442,
  "sm11": 3502,
  "sm115": 3567,
  "sm12": 3588,
  "smp": 2849,
  // XY
  "xy1": 2193,
  "xy2": 2268,
  "xy3": 2324,
  "xy4": 2379,
  "xy5": 2451,
  "xy6": 2517,
  "xy7": 2573,
  "xy8": 2635,
  "xy9": 2703,
  "xy10": 2759,
  "xy11": 2815,
  "xy12": 2847,
  "xyp": 2194,
  // Black & White
  "bw1": 1681,
  "bw2": 1751,
  "bw3": 1817,
  "bw4": 1883,
  "bw5": 1949,
  "bw6": 2015,
  "bw7": 2067,
  "bw8": 2119,
  "bw9": 2171,
  "bw10": 2192,
  "bw11": 2267,
  "bwp": 1682,
  // HGSS
  "hgss1": 1451,
  "hgss2": 1517,
  "hgss3": 1569,
  "hgss4": 1621,
  "hgssp": 1452,
  "col1": 1680,
  // Platinum
  "pl1": 1275,
  "pl2": 1341,
  "pl3": 1393,
  "pl4": 1450,
  // Diamond & Pearl
  "dp1": 1043,
  "dp2": 1109,
  "dp3": 1161,
  "dp4": 1213,
  "dp5": 1274,
  "dp6": 1340,
  "dp7": 1392,
  "dpp": 1044,
  // EX Ruby & Sapphire
  "ex1": 499,
  "ex2": 565,
  "ex3": 617,
  "ex4": 669,
  "ex5": 721,
  "ex6": 773,
  "ex7": 825,
  "ex8": 877,
  "ex9": 929,
  "ex10": 981,
  "ex11": 1033,
  "ex12": 1085,
  "ex13": 1137,
  "ex14": 1189,
  "ex15": 1241,
  "ex16": 1293,
  // Base sets
  "base1": 67,
  "base2": 133,
  "base3": 185,
  "base4": 237,
  "base5": 289,
  "basep": 68,
  // Neo
  "neo1": 341,
  "neo2": 393,
  "neo3": 445,
  "neo4": 497,
  // E-Card
  "ecard1": 549,
  "ecard2": 601,
  "ecard3": 653,
  // Gym
  "gym1": 393,
  "gym2": 445,
};

// Mapping TCGdex set ID → nom FR
const TCGDEX_SET_NAMES_FR: Record<string, string> = {
  "me01": "Méga-Évolution",
  "me02": "Flammes Fantasmagoriques",
  "sv01": "Écarlate et Violet",
  "sv02": "Évolutions à Paldea",
  "sv03": "Flammes Obsidiennes",
  "sv03.5": "151",
  "sv04": "Faille Paradoxe",
  "sv04.5": "Destinées de Paldea",
  "sv05": "Forces Temporelles",
  "sv06": "Mascarade Crépusculaire",
  "sv06.5": "Fable Nébuleuse",
  "sv07": "Couronne Stellaire",
  "sv08": "Étincelles Déferlantes",
  "sv08.5": "Évolutions Prismatiques",
  "sv09": "Aventures Ensemble",
  "sv10": "Rivalités Destinées",
  "svp": "Promos SV",
  "swsh1": "Épée et Bouclier",
  "swsh2": "Clash des Rebelles",
  "swsh3": "Ténèbres Embrasées",
  "swsh3.5": "La Voie du Maître",
  "swsh4": "Voltage Éclatant",
  "swsh4.5": "Destinées Radieuses",
  "swsh5": "Styles de Combat",
  "swsh6": "Règne de Glace",
  "swsh7": "Évolution Céleste",
  "swsh8": "Poing de Fusion",
  "swsh9": "Stars Étincelantes",
  "swsh10": "Astres Radieux",
  "swsh10.5": "Pokémon GO",
  "swsh11": "Origine Perdue",
  "swsh12": "Tempête Argentée",
  "swsh12.5": "Zénith Suprême",
  "swshp": "Promos SWSH",
  "cel25": "Célébrations",
  "sm1": "Soleil et Lune",
  "sm2": "Gardiens Ascendants",
  "sm3": "Ombres Ardentes",
  "sm3.5": "Légendes Brillantes",
  "sm4": "Invasion Carmin",
  "sm5": "Ultra-Prisme",
  "sm6": "Lumière Interdite",
  "sm7": "Tempête Céleste",
  "sm7.5": "Majesté des Dragons",
  "sm8": "Tonnerre Perdu",
  "sm9": "Duo de Choc",
  "sm10": "Alliance Infaillible",
  "sm11": "Harmonie des Esprits",
  "sm115": "Destinées Occultes",
  "sm12": "Éclipse Cosmique",
  "smp": "Promos SM",
  "xy1": "XY",
  "xy2": "Étincelles",
  "xy3": "Poings Furieux",
  "xy4": "Vigueur Spectrale",
  "xy5": "Primo-Choc",
  "xy6": "Ciel Rugissant",
  "xy7": "Origines Antiques",
  "xy8": "Impact des Destins",
  "xy9": "Rupture Turbo",
  "xy10": "Impulsion Turbo",
  "xy11": "Offensive Vapeur",
  "xy12": "Évolutions",
  "xyp": "Promos XY",
  "bw1": "Noir et Blanc",
  "bw2": "Pouvoirs Émergents",
  "bw3": "Nobles Victoires",
  "bw4": "Destinées Futures",
  "bw5": "Explorateurs Obscurs",
  "bw6": "Dragons Exaltés",
  "bw7": "Frontières Franchies",
  "bw8": "Tempête Plasma",
  "bw9": "Glaciation Plasma",
  "bw10": "Explosion Plasma",
  "bw11": "Trésors Légendaires",
  "bwp": "Promos BW",
  "hgss1": "HeartGold SoulSilver",
  "hgss2": "Déchaînement",
  "hgss3": "Indomptable",
  "hgss4": "Triomphe",
  "col1": "L'Appel des Légendes",
  "pl1": "Platine",
  "pl2": "Rivaux Émergeants",
  "pl3": "Vainqueurs Suprêmes",
  "pl4": "Arceus",
  "dp1": "Diamant et Perle",
  "dp2": "Trésors Mystérieux",
  "dp3": "Merveilles Secrètes",
  "dp4": "Duels au Sommet",
  "dp5": "Aube Majestueuse",
  "dp6": "L'Éveil des Légendes",
  "dp7": "Tempête",
  "base1": "Set de Base",
  "base2": "Jungle",
  "base3": "Fossile",
  "base4": "Set de Base 2",
  "base5": "Team Rocket",
  "neo1": "Neo Genesis",
  "neo2": "Neo Discovery",
  "neo3": "Neo Revelation",
  "neo4": "Neo Destiny",
};

// Cache
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

// Cache pour les cartes Cardmarket par set
const cmSetCache = new Map<number, { cards: any[]; ts: number }>();
const CM_SET_CACHE_TTL = 30 * 60 * 1000;

async function fetchCardmarketSetCards(episodeId: number): Promise<any[]> {
  const cached = cmSetCache.get(episodeId);
  if (cached && Date.now() - cached.ts < CM_SET_CACHE_TTL) {
    return cached.cards;
  }

  if (!CARDMARKET_API_KEY) return [];

  try {
    // Fetch toutes les pages du set
    let allCards: any[] = [];
    let page = 1;
    let totalPages = 1;

    do {
      const url = `${CARDMARKET_BASE}/pokemon/episodes/${episodeId}/cards?sort=price_highest&page=${page}`;
      const res = await fetch(url, {
        headers: {
          "x-rapidapi-host": "cardmarket-api-tcg.p.rapidapi.com",
          "x-rapidapi-key": CARDMARKET_API_KEY,
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) break;

      const data = await res.json();
      const cards = data.data || [];
      allCards = [...allCards, ...cards];

      if (page === 1) {
        totalPages = data.paging?.total || 1;
      }
      page++;
    } while (page <= totalPages && page <= 5); // Max 5 pages pour éviter trop d'appels

    cmSetCache.set(episodeId, { cards: allCards, ts: Date.now() });
    return allCards;
  } catch (err) {
    console.error(`[cards/search] Error fetching CM set ${episodeId}:`, err);
    return [];
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q || q.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const cacheKey = `search:v4:${q.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data);
    }

    // 1. Recherche TCGdex en français
    const tcgdex = new TCGdex("fr");
    const query = Query.create().contains("name", q.trim());
    const tcgResults = await tcgdex.card.list(query);

    // Filtrer les sets Pocket et autres exclus
    const excludePrefixes = [
      "A1", "A1a", "A2", "A2a", "A2b",
      "A3", "A3a", "A3b", "A4", "A4a", "A4b",
      "B1", "B1a",
    ];

    const filteredTcg = tcgResults.filter((card: any) => {
      const prefix = card.id?.split("-")[0];
      return !excludePrefixes.includes(prefix);
    });

    // Limiter à 30 résultats
    const limitedResults = filteredTcg.slice(0, 30);

    if (limitedResults.length === 0) {
      return NextResponse.json({
        query: q,
        results: [],
        count: 0,
      });
    }

    // 2. Grouper par set TCGdex
    const bySet = new Map<string, any[]>();
    for (const card of limitedResults) {
      const setId = card.id?.split("-")[0];
      if (!bySet.has(setId)) bySet.set(setId, []);
      bySet.get(setId)!.push(card);
    }

    // 3. Fetch les cartes Cardmarket pour chaque set
    const cmCardsBySet = new Map<string, any[]>();
    const sets = Array.from(bySet.keys());
    const missingSets = sets.filter(
      (tcgSetId) => !TCGDEX_TO_CARDMARKET_EPISODE[tcgSetId]
    );

    const dynamicEpisodeMap: Record<string, number> = missingSets.length > 0
      ? await fetchCardmarketEpisodeMap()
      : {};

    const episodeIdBySet = new Map<string, number>();
    for (const tcgSetId of sets) {
      const staticId = TCGDEX_TO_CARDMARKET_EPISODE[tcgSetId];
      const dynamicId = dynamicEpisodeMap[tcgSetId];
      if (staticId) {
        episodeIdBySet.set(tcgSetId, staticId);
      } else if (dynamicId) {
        episodeIdBySet.set(tcgSetId, dynamicId);
      }
    }

    await Promise.all(
      sets.map(async (tcgSetId) => {
        const cmEpisodeId = episodeIdBySet.get(tcgSetId);
        if (!cmEpisodeId) return;
        const cmCards = await fetchCardmarketSetCards(cmEpisodeId);
        cmCardsBySet.set(tcgSetId, cmCards);
      })
    );

    const setsNeedingFallback = sets.filter((tcgSetId) => {
      const cmEpisodeId = episodeIdBySet.get(tcgSetId);
      if (!cmEpisodeId) return false;
      const cards = cmCardsBySet.get(tcgSetId);
      return !cards || cards.length === 0;
    });

    if (setsNeedingFallback.length > 0) {
      const fallbackMap = Object.keys(dynamicEpisodeMap).length > 0
        ? dynamicEpisodeMap
        : await fetchCardmarketEpisodeMap();

      await Promise.all(
        setsNeedingFallback.map(async (tcgSetId) => {
          const fallbackId = fallbackMap[tcgSetId];
          const currentId = episodeIdBySet.get(tcgSetId);
          if (!fallbackId || fallbackId === currentId) return;
          const cmCards = await fetchCardmarketSetCards(fallbackId);
          if (cmCards.length > 0) {
            cmCardsBySet.set(tcgSetId, cmCards);
          }
        })
      );
    }

    // 4. Matcher chaque carte TCGdex avec Cardmarket
    const results = limitedResults.map((tcgCard: any) => {
      const setId = tcgCard.id?.split("-")[0];
      const localId = String(tcgCard.localId);
      const cmCards = cmCardsBySet.get(setId) || [];

      // Trouver la carte Cardmarket correspondante par numéro
      const cmMatch = cmCards.find((c: any) => {
        const cmNum = String(c.card_number).split("/")[0];
        // Exact match
        if (cmNum === localId) return true;
        // Numeric match (handles leading zeros: "095" vs "95")
        const cmNumInt = parseInt(cmNum, 10);
        const localIdInt = parseInt(localId, 10);
        if (!isNaN(cmNumInt) && !isNaN(localIdInt) && cmNumInt === localIdInt) return true;
        // Normalize and compare (lowercase, trim)
        if (cmNum.toLowerCase().trim() === localId.toLowerCase().trim()) return true;
        return false;
      });

      // Construire l'URL image TCGdex
      let imageUrl = null;
      if (tcgCard.image) {
        imageUrl = `${tcgCard.image}/high.png`;
      }

      // Nom du set en français
      const setNameFR = TCGDEX_SET_NAMES_FR[setId] || setId;

      // Si on a un match Cardmarket, utiliser ses données
      if (cmMatch) {
        const cmPrices = cmMatch.prices?.cardmarket ?? {};

        return {
          id: cmMatch.id,
          cardmarketId: cmMatch.id,
          name: tcgCard.name, // Nom FR de TCGdex
          rarity: cmMatch.rarity || tcgCard.rarity,
          card_number: cmMatch.card_number,
          image: cmMatch.image || imageUrl,
          prices: {
            fr: cmPrices?.lowest_near_mint_FR ?? null,
            avg7: cmPrices?.["7d_average"] ?? null,
            graded: cmPrices?.graded ?? null,
          },
          episode: {
            name: setNameFR,
            id: cmMatch.episode?.id,
            slug: cmMatch.episode?.slug,
          },
          cardmarket_url: cmMatch.cardmarket_url ?? null,
          tcggo_url: cmMatch.tcggo_url ?? null,
          matched: true,
        };
      }

      // Sinon, retourner les données TCGdex sans ID Cardmarket
      return {
        id: null,
        cardmarketId: null,
        name: tcgCard.name,
        rarity: tcgCard.rarity,
        card_number: localId,
        image: imageUrl,
        prices: null,
        episode: { name: setNameFR },
        cardmarket_url: null,
        tcggo_url: null,
        matched: false,
      };
    });

    // Trier : cartes avec match Cardmarket en premier
    results.sort((a, b) => {
      if (a.matched && !b.matched) return -1;
      if (!a.matched && b.matched) return 1;
      return 0;
    });

    const response = {
      query: q,
      results,
      count: results.length,
      matchedCount: results.filter((c) => c.matched).length,
    };

    cache.set(cacheKey, { data: response, ts: Date.now() });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("[cards/search] Error:", err);
    return NextResponse.json(
      { error: err.message || "Search failed" },
      { status: 500 }
    );
  }
}
