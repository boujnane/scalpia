// app/api/cardmarket/sets/[id]/cards/mapped/route.ts
import { NextResponse } from "next/server";
import { BASE_URL, headers } from "@/app/api/cardmarket/_utils";
import { cardmarketSlugToTCGdex, fetchTCGdexSet, mapCardsBatch } from "@/lib/cardMapper";

export const runtime = "nodejs";

const CACHE = new Map<string, { data: any; ts: number }>();
const TTL = 60 * 60 * 1000;

function makeReqId() {
  return `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}
function log(reqId: string, payload: any) {
  console.log("[mapped-route]", { reqId, ...payload });
}

function hashToId(value: string, fallback: number) {
  if (!value) return fallback;
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  const abs = Math.abs(hash);
  return abs > 0 ? abs : fallback;
}

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const reqId = makeReqId();
  const t0 = Date.now();

  try {
    const { id } = await ctx.params;
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "1";
    const force = searchParams.get("force") === "1";

    log(reqId, { step: "start", id, page });

    if (!id) return NextResponse.json({ error: "Missing set ID" }, { status: 400 });

    const cacheKey = `mapped:v3:${id}:${page}`;
    const cached = CACHE.get(cacheKey);
    if (!force && cached && Date.now() - cached.ts < TTL) {
      log(reqId, { step: "cache-hit", ageMs: Date.now() - cached.ts });
      return NextResponse.json(cached.data);
    }

    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API key" }, { status: 500 });

    // Fetch episode details once to get slug
    const epRes = await fetch(`${BASE_URL}/pokemon/episodes/${id}`, {
      headers: headers(apiKey),
      next: { revalidate: 3600 },
    });

    let episodeSlug: string | null = null;
    let episodeName: string | null = null;

    if (epRes.ok) {
      const epJson = await epRes.json();
      episodeSlug = epJson?.slug ?? epJson?.data?.slug ?? null;
      episodeName = epJson?.name ?? epJson?.data?.name ?? null;
    }

    // Fetch cards page
    const url = `${BASE_URL}/pokemon/episodes/${id}/cards?sort=price_highest&page=${page}`;
    const res = await fetch(url, {
      headers: headers(apiKey),
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: "Cardmarket API error", details: text }, { status: res.status });
    }

    const json = await res.json();

    const rawCards = json.data || [];
    if (!rawCards.length) {
      const tcgdexSetId = episodeSlug ? cardmarketSlugToTCGdex(episodeSlug) : null;
      if (tcgdexSetId) {
        const tcgdexSet = await fetchTCGdexSet(tcgdexSetId);
        if (tcgdexSet?.cards?.length) {
          const fallbackCards = tcgdexSet.cards.map((card: any, index: number) => ({
            id: hashToId(card.id ?? `${tcgdexSetId}-${card.localId ?? index}`, index + 1),
            cardmarketId: undefined,
            name: card.name,
            rarity: card.rarity ?? null,
            card_number: card.localId ?? null,
            image: card.images?.large ?? null,
            prices: { fr: null, avg7: null, graded: null },
            episode: {
              name: episodeName ?? tcgdexSet.name ?? null,
              id: Number(id) || null,
              slug: episodeSlug ?? null,
            },
            cardmarket_url: null,
            tcggo_url: null,
            tcgdexId: card.id ?? null,
            mappedFromTCGdex: true,
          }));

          const response = {
            data: fallbackCards,
            paging: { current: 1, total: 1, per_page: fallbackCards.length },
            results: fallbackCards.length,
            mapping_stats: {
              total: fallbackCards.length,
              mapped_from_tcgdex: fallbackCards.length,
              using_cardmarket_fallback: 0,
              cardmarket_urls_present: 0,
              fallback_source: "tcgdex-only",
            },
          };

          CACHE.set(cacheKey, { data: response, ts: Date.now() });
          log(reqId, {
            step: "tcgdex-fallback",
            total: fallbackCards.length,
            setId: tcgdexSetId,
          });
          return NextResponse.json(response);
        }
      }
    }

    // Normalize
    const cmCards = rawCards.map((card: any) => ({
      id: card.id,
      name: card.name,
      card_number: card.card_number,
      rarity: card.rarity,
      image: card.image,
      prices: {
        fr: card.prices?.cardmarket?.lowest_near_mint_FR ?? null,
        avg7: card.prices?.cardmarket?.["7d_average"] ?? null,
        graded: card.prices?.cardmarket?.graded ?? null,
      },
      episode: {
        name: card.episode?.name ?? episodeName ?? null,
        id: card.episode?.id ?? null,
        slug: card.episode?.slug ?? episodeSlug ?? null,
      },
      // IMPORTANT: on conserve ce que l’API donne, mais pas de scraping ici
      cardmarket_url: card.cardmarket_url ?? null,
      tcggo_url: card.tcggo_url ?? null,
    }));

    // Map FR via TCGdex
    const mappedCards = await mapCardsBatch(cmCards);
    const mappedCount = mappedCards.filter((c) => c.mappedFromTCGdex).length;

    const uiCards = mappedCards.map((c: any) => {
      const cardmarketId = Number(c.cardmarketId ?? c.id);
      return {
        id: cardmarketId,
        cardmarketId,
        name: c.name,
        rarity: c.rarity,
        card_number: c.card_number,
        image: c.image,
        prices: c.prices,
        episode: c.episode,
        // keep urls from cm payload
        cardmarket_url: c.cardmarketUrl ?? c.cardmarket_url ?? null,
        tcggo_url: c.tcggoUrl ?? c.tcggo_url ?? null,
        tcgdexId: c.tcgdexId ?? null,
        mappedFromTCGdex: !!c.mappedFromTCGdex,
      };
    });

    const response = {
      data: uiCards,
      paging: json.paging,
      results: json.results,
      mapping_stats: {
        total: uiCards.length,
        mapped_from_tcgdex: mappedCount,
        using_cardmarket_fallback: uiCards.length - mappedCount,
        cardmarket_urls_present: uiCards.filter((c: any) => !!c.cardmarket_url).length,
      },
    };

    CACHE.set(cacheKey, { data: response, ts: Date.now() });

    log(reqId, {
      step: "final",
      total: uiCards.length,
      hasCardmarket: uiCards.filter((c: any) => !!c.cardmarket_url).length,
      tookMs: Date.now() - t0,
    });

    return NextResponse.json(response);
  } catch (err: any) {
    console.error("❌ Error in mapped route:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
