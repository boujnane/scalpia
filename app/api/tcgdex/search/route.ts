import { NextResponse } from 'next/server'
import TCGdex, { Query } from '@tcgdex/sdk'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    if (!q) {
      return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
    }

    const tcgdex = new TCGdex('fr')

    // 🔹 Extraction du nom et du localId si présent
    const parts = q.trim().split(' ')
    const namePart = parts[0]           // ex: "Dracaufeu"
    const localIdPart = parts[1]        // ex: "4" (facultatif)

    // 🔹 Recherche laxiste sur le nom
    let query = Query.create().contains('name', namePart)
    const results = await tcgdex.card.list(query)

    // 🔹 Préfixes à exclure
    const excludePrefixes = [
      'A1', 'A1a', 'A2', 'A2a', 'A2b',
      'A3', 'A3a', 'A3b', 'A4', 'A4a', 'A4b',
      'B1', 'B1a'
    ]

    // 🔹 Filtrage après récupération
    const clean = results
      .filter((card: any) => {
        const prefix = card.id.split('-')[0]
        // Exclusion des préfixes
        if (excludePrefixes.includes(prefix)) return false

        // Si un localId est fourni, on filtre strictement
        if (localIdPart && !isNaN(Number(localIdPart))) {
          return card.localId === localIdPart
        }

        return true
      })
      .map((card: any) => ({
        id: card.id,
        localId: card.localId,
        name: card.name,
        image: card.images?.small ?? null,
        images: card.images ?? null,
        rarity: card.rarity ?? null,
        hp: card.hp ?? null,
        types: card.types ?? [],
        supertype: card.supertype ?? null,
        subtypes: card.subtypes ?? [],
        set: card.set ?? null,
      }))

    return NextResponse.json(clean)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erreur TCGdex search' }, { status: 500 })
  }
}
