import { NextResponse } from 'next/server'
import { BASE_URL, headers } from '../../../_utils'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 60 * 60 * 1000 // 1h

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // 1. Récupérer la page depuis l'URL (ex: ?page=2)
    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') || '1'

    if (!id) {
      return NextResponse.json({ error: 'Missing set ID' }, { status: 400 })
    }

    // Le cache doit être par ID ET par PAGE
    const cacheKey = `set:${id}:page:${page}`
    const cached = CACHE.get(cacheKey)
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json(cached.data)
    }

    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    // 2. Ajouter la page à l'URL de RapidAPI
    const url = `${BASE_URL}/pokemon/episodes/${id}/cards?sort=price_highest&page=${page}`
    console.log('🌐 Fetching cards:', url)

    const res = await fetch(url, {
      headers: headers(apiKey),
      next: { revalidate: 3600 },
    })

    const text = await res.text()

    let json: any
    try {
      json = JSON.parse(text)
    } catch (err) {
      return NextResponse.json({ error: 'Invalid JSON', details: text }, { status: 500 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'API Error', details: json }, { status: res.status })
    }

    // 3. Normalisation (on garde la structure mais on formate les cartes)
    const formattedCards = json.data.map((card: any) => ({
      id: card.id,
      name: card.name,
      card_number: card.card_number,
      rarity: card.rarity,
      image: card.image,
      prices: {
        fr: card.prices?.cardmarket?.lowest_near_mint_FR ?? null,
        avg7: card.prices?.cardmarket?.['7d_average'] ?? null,
        graded: card.prices?.cardmarket?.graded ?? null,
      },
      episode: {
        name: card.episode?.name ?? null,
        id: card.episode?.id ?? null,
      },
    }))

    // 4. ON RENVOIE L'OBJET COMPLET
    const responseBody = {
      data: formattedCards,       // Vos 20 cartes formatées
      paging: json.paging,        // L'objet avec total: 12, current: 1, etc.
      results: json.results       // Le nombre total: 230
    }

    CACHE.set(cacheKey, { data: responseBody, ts: Date.now() })

    return NextResponse.json(responseBody)

  } catch (err: any) {
    console.error('❌ Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}