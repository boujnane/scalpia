import { NextResponse } from 'next/server';
import TCGdex from '@tcgdex/sdk';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const setId = searchParams.get('id');

    if (!setId) {
      return NextResponse.json({ error: 'Missing set id' }, { status: 400 });
    }

    const tcgdex = new TCGdex('fr');
    const rawSet = await tcgdex.fetch('sets', setId);

    if (!rawSet) {
      return NextResponse.json({ error: `Set "${setId}" not found` }, { status: 404 });
    }

    // 🔹 Transformation pour correspondre à TCGdexCardExtended
    const cards = rawSet.cards.map((card: any) => ({
      id: card.id,
      localId: card.localId,
      name: card.name,
      images: card.image ? { small: `${card.image}.png`, large: `${card.image}.png` } : null,
      image: card.image ?? null,
      rarity: card.rarity ?? null,
      hp: card.hp ?? null,
      types: card.types ?? [],
      supertype: card.supertype ?? null,
      subtypes: card.subtypes ?? [],
      set: {
        name: rawSet.name,
        symbol: rawSet.symbol ?? null,
      },
      pricing: null, // tu peux remplir plus tard
    }));

    return NextResponse.json({
      id: rawSet.id,
      name: rawSet.name,
      cardCount: rawSet.cardCount,
      cards,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur TCGdex set' }, { status: 500 });
  }
}
