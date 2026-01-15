// lib/cardMapper.ts

export const SET_MAPPING: Record<string, string> = {
  // ===================== MEGA EVOLUTION =====================
  "phantasmal-flames": "me02",
  "mega-evolution": "me01",
  "black-bolt": "sv10.5b",
  "white-flare": "sv10.5w",

  // ===================== SCARLET & VIOLET =====================
  "scarlet-violet": "sv01",
  "scarlet-violet-base-set": "sv01",
  "paldea-evolved": "sv02",
  "obsidian-flames": "sv03",
  "151": "sv03.5",
  "paradox-rift": "sv04",
  "paldean-fates": "sv04.5",
  "temporal-forces": "sv05",
  "twilight-masquerade": "sv06",
  "shrouded-fable": "sv06.5",
  "stellar-crown": "sv07",
  "surging-sparks": "sv08",
  "prismatic-evolutions": "sv08.5",
  "journey-together": "sv09",
  "destined-rivals": "sv10",
  "sv-black-star-promos": "svp",

  // ===================== SWORD & SHIELD =====================
  "sword-shield": "swsh1",
  "sword-shield-base-set": "swsh1",
  "rebel-clash": "swsh2",
  "darkness-ablaze": "swsh3",
  "champions-path": "swsh3.5",
  "champion-s-path": "swsh3.5",
  "champion's-path": "swsh3.5",
  "vivid-voltage": "swsh4",
  "shining-fates": "swsh4.5",
  "battle-styles": "swsh5",
  "chilling-reign": "swsh6",
  "evolving-skies": "swsh7",
  "fusion-strike": "swsh8",
  "brilliant-stars": "swsh9",
  "astral-radiance": "swsh10",
  "pokemon-go": "swsh10.5",
  "pok%C3%A9mon-go": "swsh10.5",
  "pokémon-go": "swsh10.5",
  "lost-origin": "swsh11",
  "silver-tempest": "swsh12",
  "crown-zenith": "swsh12.5",
  "swsh-black-star-promos": "swshp",
  "celebrations": "cel25",

  // ===================== SUN & MOON =====================
  "sun-moon": "sm1",
  "sun-moon-base-set": "sm1",
  "guardians-rising": "sm2",
  "burning-shadows": "sm3",
  "shining-legends": "sm3.5",
  "shining-legends-collection": "sm3.5",
  "crimson-invasion": "sm4",
  "ultra-prism": "sm5",
  "forbidden-light": "sm6",
  "celestial-storm": "sm7",
  "dragon-majesty": "sm7.5",
  "lost-thunder": "sm8",
  "team-up": "sm9",
  "unbroken-bonds": "sm10",
  "unified-minds": "sm11",
  "hidden-fates": "sm115",
  "cosmic-eclipse": "sm12",
  "sm-black-star-promos": "smp",
  "detective-pikachu": "det1",

  // ===================== XY =====================
  "xy": "xy1",
  "xy-base-set": "xy1",
  "flashfire": "xy2",
  "furious-fists": "xy3",
  "phantom-forces": "xy4",
  "primal-clash": "xy5",
  "roaring-skies": "xy6",
  "ancient-origins": "xy7",
  "breakthrough": "xy8",
  "breakpoint": "xy9",
  "fates-collide": "xy10",
  "steam-siege": "xy11",
  "evolutions": "xy12",
  "xy-black-star-promos": "xyp",
  "kalos-starter-set": "xy0",

  // ===================== BLACK & WHITE =====================
  "black-white": "bw1",
  "black-white-base-set": "bw1",
  "emerging-powers": "bw2",
  "noble-victories": "bw3",
  "next-destinies": "bw4",
  "dark-explorers": "bw5",
  "dragons-exalted": "bw6",
  "boundaries-crossed": "bw7",
  "plasma-storm": "bw8",
  "plasma-freeze": "bw9",
  "plasma-blast": "bw10",
  "legendary-treasures": "bw11",

   "diamond-pearl": "dp1",
  "diamond-pearl-base-set": "dp1",
  "mysterious-treasures": "dp2",
  "secret-wonders": "dp3",
  "great-encounters": "dp4",
  "majestic-dawn": "dp5",
  "legends-awakened": "dp6",
  "stormfront": "dp7",

  // ===================== PLATINUM =====================
  "platinum": "pl1",
  "platinum-base-set": "pl1",
  "rising-rivals": "pl2",
  "supreme-victors": "pl3",
  // "arceus": "pl4", // ⚠️ Set Arceus absent de TCGdex FR (pas de pl4)

  // ===================== HEARTGOLD & SOULSILVER =====================
  "heartgold-soulsilver": "hgss1",
  "heartgold-soulsilver-base-set": "hgss1",
  "hs-triumphant": "hgss4",
  "hs-undaunted": "hgss3",
  "hs-unleashed": "hgss2",
  "unleashed": "hgss2",
  "undaunted": "hgss3",
  "triumphant": "hgss4",
  "call-of-legends": "col1",
  "hgss-black-star-promos": "hgssp",

  // ===================== EX (RUBY & SAPPHIRE ERA) =====================
  "ruby-sapphire": "ex1",
  "ruby-and-sapphire": "ex1",
  "ex-ruby-sapphire": "ex1",
  "sandstorm": "ex2",
  "ex-sandstorm": "ex2",
  "dragon": "ex3",
  "ex-dragon": "ex3",
  "team-magma-vs-team-aqua": "ex4",
  "team-magma-vs-team-aqua-aqua-vs-magma": "ex4",
  "hidden-legends": "ex5",
  "ex-hidden-legends": "ex5",
  "fire-red-leaf-green": "ex6",
  "firered-leafgreen": "ex6",
  "ex-fire-red-leaf-green": "ex6",
  "team-rocket-returns": "ex7",
  "ex-team-rocket-returns": "ex7",
  "deoxys": "ex8",
  "ex-deoxys": "ex8",
  "emerald": "ex9",
  "ex-emerald": "ex9",
  "unseen-forces": "ex10",
  "ex-unseen-forces": "ex10",
  "delta-species": "ex11",
  "ex-delta-species": "ex11",
  "legend-maker": "ex12",
  "ex-legend-maker": "ex12",
  "holon-phantoms": "ex13",
  "ex-holon-phantoms": "ex13",
  "crystal-guardians": "ex14",
  "ex-crystal-guardians": "ex14",
  "dragon-frontiers": "ex15",
  "ex-dragon-frontiers": "ex15",
  "power-keepers": "ex16",
  "ex-power-keepers": "ex16",

  // ===================== POP =====================
  "pop-series-1": "pop1",
  "pop-series-2": "pop2",
  "pop-series-3": "pop3",
  "pop-series-4": "pop4",
  "pop-series-5": "pop5",
  "pop-series-6": "pop6",
  "pop-series-7": "pop7",
  "pop-series-8": "pop8",
  "pop-series-9": "pop9",

  // ===================== E-CARD =====================
  "skyridge": "ecard3",
  "aquapolis": "ecard2",
  "expedition-base-set": "ecard1",
  // ===================== NEO =====================
  "neo-destiny": "neo4",
  "neo-revelation": "neo3",
  "neo-discovery": "neo2",
  "neo-genesis": "neo1",

  // ===================== BASE SET (WOTC) =====================
  "base-set": "base1",
  "base-set-unlimited": "base1",
  "base-set-shadowless": "base1",
  "base-set-1st-edition": "base1",
  "base": "base1",

  // ===================== JUNGLE =====================
  "jungle": "base2",

  // ===================== FOSSIL =====================
  "fossil": "base3",

  // ===================== BASE SET 2 =====================
  "base-set-2": "base4",
  "base-set-two": "base4",

  // ===================== TEAM ROCKET =====================
  "team-rocket": "base5",

  // ===================== GYM HEROES =====================
  "gym-heroes": "gym1",

  // ===================== GYM CHALLENGE =====================
  "gym-challenge": "gym2",

  // ===================== PROMOS =====================
  "bw-black-star-promos": "bwp",
  "dp-black-star-promos": "dpp",
  "wizards-black-star-promos": "basep",
  "nintendo-black-star-promos": "np",

  // ===================== AUTRES / SPÉCIAUX =====================
  "dragon-vault": "dv1",
};

// Set pour éviter de logger plusieurs fois le même slug manquant
const loggedMissingSlugs = new Set<string>();

export function cardmarketSlugToTCGdex(slug: string): string | null {
  const normalized = String(slug || "").toLowerCase().trim();

  if (!(normalized in SET_MAPPING) && normalized && !loggedMissingSlugs.has(normalized)) {
    loggedMissingSlugs.add(normalized);
    console.warn(`[SLUG MANQUANT] "${slug}" → pas de mapping TCGdex`);
  }

  return normalized in SET_MAPPING ? SET_MAPPING[normalized] : null;
}

export function extractLocalId(cardNumber: string | number | undefined): string | null {
  if (cardNumber === undefined || cardNumber === null) return null;
  const s = String(cardNumber).trim();
  if (!s) return null;
  return s.includes("/") ? s.split("/")[0]?.trim() || null : s;
}

function normalizeLocalIdForCompare(id: string): string {
  const s = String(id || "").trim();
  if (!s) return "";
  if (/^\d+$/.test(s)) return String(parseInt(s, 10));
  return s.toUpperCase();
}

export interface MappedCard {
  cardmarketId: number;
  cardmarketUrl?: string | null;
  tcggoUrl?: string | null;
  prices?: {
    fr?: number | null;
    avg7?: number | null;
    graded?: any;
  };

  name: string;
  image: string | null;
  rarity?: string | null;
  card_number?: string | number | null;

  episode: { name: string | null; id?: number | null; slug?: string | null };

  tcgdexId?: string;
  mappedFromTCGdex: boolean;
}

const TCGDEX_SET_CACHE = new Map<string, any>();

async function fetchTCGdexSet(setId: string): Promise<any | null> {
  console.log(`📥 Attempting to fetch TCGdex set: "${setId}"`);

  if (TCGDEX_SET_CACHE.has(setId)) {
    console.log(`✅ Cache hit for set: "${setId}"`);
    return TCGDEX_SET_CACHE.get(setId);
  }

  try {
    const { default: TCGdex } = await import("@tcgdex/sdk");
    const tcgdex = new TCGdex("fr");

    console.log(`🌐 Fetching set "${setId}" from TCGdex SDK...`);
    const rawSet = await tcgdex.fetch("sets", setId);

    if (!rawSet) {
      console.error(`❌ TCGdex set "${setId}" not found`);
      return null;
    }

    const data = {
      id: rawSet.id,
      name: rawSet.name,
      cardCount: rawSet.cardCount,
      cards:
        rawSet.cards?.map((card: any) => ({
          id: card.id,
          localId: card.localId,
          name: card.name,
          images: card.image
            ? { small: `${card.image}/low.png`, large: `${card.image}/high.png` }
            : null,
          rarity: card.rarity ?? null,
        })) || [],
    };

    if (!data.cards.length) {
      console.error(`❌ TCGdex set "${setId}" has no cards`);
      return null;
    }

    console.log(`✅ Successfully loaded TCGdex set "${setId}": ${data.cards.length} cards`);
    TCGDEX_SET_CACHE.set(setId, data);
    return data;
  } catch (err) {
    console.error(`❌ TCGdex fetch error for set "${setId}":`, err);
    return null;
  }
}

function pickUrl(obj: any, snake: string, camel: string) {
  return obj?.[snake] ?? obj?.[camel] ?? null;
}

function toMappedFallback(cmCard: any): MappedCard {
  return {
    cardmarketId: cmCard.id,
    cardmarketUrl: pickUrl(cmCard, "cardmarket_url", "cardmarketUrl"),
    tcggoUrl: pickUrl(cmCard, "tcggo_url", "tcggoUrl"),
    prices: cmCard.prices,
    name: cmCard.name,
    image: cmCard.image || null,
    rarity: cmCard.rarity ?? null,
    card_number: cmCard.card_number ?? null,
    episode: cmCard.episode,
    mappedFromTCGdex: false,
  };
}

export async function mapSingleCard(cmCard: any): Promise<MappedCard> {
  const localId = extractLocalId(cmCard.card_number);
  const tcgdexSetId = cardmarketSlugToTCGdex(cmCard.episode?.slug || "");

  let tcgdexCard = null;

  if (tcgdexSetId && localId) {
    const tcgdexSet = await fetchTCGdexSet(tcgdexSetId);
    if (tcgdexSet?.cards) {
      const key = normalizeLocalIdForCompare(localId);
      tcgdexCard = tcgdexSet.cards.find((c: any) => normalizeLocalIdForCompare(c.localId) === key);
    }
  }

  return {
    cardmarketId: cmCard.id,
    cardmarketUrl: pickUrl(cmCard, "cardmarket_url", "cardmarketUrl"),
    tcggoUrl: pickUrl(cmCard, "tcggo_url", "tcggoUrl"),
    prices: cmCard.prices,

    name: tcgdexCard?.name || cmCard.name,
    image: tcgdexCard?.images?.large || cmCard.image || null,
    rarity: tcgdexCard?.rarity ?? cmCard.rarity ?? null,
    card_number: cmCard.card_number ?? null,

    episode: cmCard.episode,

    tcgdexId: tcgdexCard?.id,
    mappedFromTCGdex: !!tcgdexCard,
  };
}

export async function mapCardsBatch(cmCards: any[]): Promise<MappedCard[]> {
  console.log(`\n🔄 Starting mapCardsBatch with ${cmCards.length} cards`);

  const cardsBySet = new Map<string, any[]>();
  const unmappableCards: any[] = [];

  for (const card of cmCards) {
    const slug = card.episode?.slug || "";
    const tcgdexSetId = cardmarketSlugToTCGdex(slug);

    if (!tcgdexSetId) {
      unmappableCards.push(card);
      continue;
    }

    if (!cardsBySet.has(tcgdexSetId)) cardsBySet.set(tcgdexSetId, []);
    cardsBySet.get(tcgdexSetId)!.push(card);
  }

  const fetchedSets = await Promise.all(
    Array.from(cardsBySet.keys()).map(async (setId) => ({ setId, data: await fetchTCGdexSet(setId) }))
  );

  const setDataMap = new Map<string, any>();
  fetchedSets.forEach(({ setId, data }) => data && setDataMap.set(setId, data));

  const mapped: MappedCard[] = [];
  let successfulMappings = 0;

  for (const [setId, cards] of cardsBySet) {
    const tcgdexSet = setDataMap.get(setId);

    if (!tcgdexSet) {
      for (const cmCard of cards) mapped.push(toMappedFallback(cmCard));
      continue;
    }

    const index = new Map<string, any>();
    for (const c of tcgdexSet.cards) {
      index.set(normalizeLocalIdForCompare(c.localId), c);
    }

    for (const cmCard of cards) {
      const localId = extractLocalId(cmCard.card_number);
      const key = localId ? normalizeLocalIdForCompare(localId) : "";
      const tcgdexCard = key ? index.get(key) : null;

      if (tcgdexCard) {
        successfulMappings++;
      } else if (localId) {
        console.warn(`[CARTE NON MAPPÉE] Set "${setId}" | #${localId} "${cmCard.name}" → pas trouvé dans TCGdex`);
      }

      mapped.push({
        cardmarketId: cmCard.id,
        cardmarketUrl: pickUrl(cmCard, "cardmarket_url", "cardmarketUrl"),
        tcggoUrl: pickUrl(cmCard, "tcggo_url", "tcggoUrl"),
        prices: cmCard.prices,

        name: tcgdexCard?.name || cmCard.name,
        image: tcgdexCard?.images?.large || cmCard.image || null,
        rarity: tcgdexCard?.rarity ?? cmCard.rarity ?? null,
        card_number: cmCard.card_number ?? null,

        episode: cmCard.episode,

        tcgdexId: tcgdexCard?.id,
        mappedFromTCGdex: !!tcgdexCard,
      });
    }
  }

  for (const cmCard of unmappableCards) mapped.push(toMappedFallback(cmCard));

  console.log(`\n📈 Mapping complete:`);
  console.log(`   Total cards: ${mapped.length}`);
  console.log(`   Successfully mapped: ${successfulMappings}`);
  console.log(`   Fallback to Cardmarket: ${mapped.length - successfulMappings}\n`);

  return mapped;
}

export function getMappingStats(cards: MappedCard[]) {
  const total = cards.length;
  const mapped = cards.filter((c) => c.mappedFromTCGdex).length;
  const unmapped = total - mapped;
  const percentage = total > 0 ? Math.round((mapped / total) * 100) : 0;

  return {
    total,
    mapped,
    unmapped,
    percentage,
    missingImages: cards.filter((c) => !c.image).length,
  };
}