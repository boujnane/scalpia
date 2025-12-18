// app/api/ppt/sets/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Côté serveur, utilise une variable d'environnement normale (sans NEXT_PUBLIC_)
const PPT_API_KEY = process.env.POKEMON_PRICE_TRACKER_KEY
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2/sets'

export async function GET() {
  try {
    if (!PPT_API_KEY) {
      // Gestion claire si la clé n'est pas définie
      return NextResponse.json({ error: 'Server API key not defined' }, { status: 500 })
    }

    const res = await fetch(BASE_URL, {
      headers: {
        'Authorization': `Bearer ${PPT_API_KEY}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: 'Failed to fetch sets', details: text }, { status: res.status })
    }

    const data = await res.json()
    // data.data contient tous les sets
    return NextResponse.json(data.data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
