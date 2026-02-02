import { NextRequest, NextResponse } from "next/server";
import { BASE_URL, headers } from "@/app/api/cardmarket/_utils";

const CACHE = new Map<string, { data: any; ts: number }>();
const TTL = 10 * 60 * 1000;

function normalizeId(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const id = String(value).trim();
  return id.length > 0 ? id : null;
}

function mapCard(card: any) {
  const prices = card?.prices?.cardmarket ?? {};
  return {
    id: card?.id ?? null,
    cardmarketId: card?.cardmarketId ?? card?.id ?? null,
    name: card?.name ?? "",
    rarity: card?.rarity ?? null,
    card_number: card?.card_number ?? null,
    image: card?.image ?? null,
    episode: {
      name: card?.episode?.name ?? card?.set?.name ?? "Unknown",
    },
    prices: {
      fr:
        prices?.lowest_near_mint_FR ??
        prices?.lowest_near_mint ??
        prices?.["30d_average"] ??
        null,
      avg7: prices?.["7d_average"] ?? null,
      graded: prices?.graded ?? null,
    },
    cardmarket_url: card?.cardmarket_url ?? card?.cardmarketUrl ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const body = await req.json().catch(() => ({}));
    const rawIds: unknown[] = Array.isArray(body?.cardIds) ? body.cardIds : [];

    const ids = Array.from(
      new Set(rawIds.map(normalizeId).filter((id): id is string => !!id))
    ).slice(0, 50);

    if (ids.length === 0) {
      return NextResponse.json({ cards: [] });
    }

    const cards = await Promise.all(
      ids.map(async (id) => {
        const cached = CACHE.get(id);
        if (cached && Date.now() - cached.ts < TTL) {
          return cached.data;
        }

        const res = await fetch(`${BASE_URL}/pokemon/cards/${id}`, {
          headers: headers(apiKey),
          next: { revalidate: 1800 },
        });

        if (!res.ok) {
          return null;
        }

        const json = await res.json();
        const cardData = json?.data ?? null;
        if (!cardData) return null;

        const mapped = mapCard(cardData);
        CACHE.set(id, { data: mapped, ts: Date.now() });
        return mapped;
      })
    );

    return NextResponse.json({ cards: cards.filter(Boolean) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
