// app/api/tcgdex/card/route.ts
import { NextResponse } from 'next/server'
import TCGdex, { Card } from '@tcgdex/sdk'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing card id' }, { status: 400 })
    }

    const tcgdex = new TCGdex('fr')
    const rawCard: Card | null = await tcgdex.card.get(id)

    if (!rawCard) {
      return NextResponse.json({ error: `Card "${id}" not found` }, { status: 404 })
    }

    const card = rawCard as any

    const clean = {
      id: card.id,
      localId: card.localId,
      name: card.name,

      // Images
      image: card.images?.small ?? null,
      images: card.images ?? null,

      // Détails
      rarity: card.rarity ?? null,
      hp: card.hp ?? null,
      types: card.types ?? [],
      category: card.category ?? null,
      illustrator: card.illustrator ?? null,
      description: card.description ?? null,
      stage: card.stage ?? null,
      evolveFrom: card.evolveFrom ?? null,
      retreat: card.retreat ?? null,
      regulationMark: card.regulationMark ?? null,
      legal: card.legal ?? null,
      supertype: card.supertype ?? null,
      subtypes: card.subtypes ?? [],

      // Combat
      attacks: card.attacks ?? [],
      weaknesses: card.weaknesses ?? [],

      // Pokédex
      dexId: card.dexId ?? [],
      variants: card.variants ?? null,

      // Set
      set: card.set ?? null,

      // Prix
      pricing: card.pricing ?? null,
    }

    return NextResponse.json(clean)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur TCGdex' }, { status: 500 })
  }
}
