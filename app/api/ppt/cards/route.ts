import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
const PPT_API_KEY = process.env.POKEMON_PRICE_TRACKER_KEY
const BASE_URL = 'https://www.pokemonpricetracker.com/api/v2/cards'

export async function GET(req: Request) {
  try {
    if (!PPT_API_KEY)
      return NextResponse.json({ error: 'Server API key not defined' }, { status: 500 })

    const { searchParams } = new URL(req.url)
    const setId = searchParams.get('setId')
    if (!setId)
      return NextResponse.json({ error: 'Missing setId' }, { status: 400 })

    const res = await fetch(`${BASE_URL}?set=${setId}&fetchAllInSet=true`, {
      headers: {
        'Authorization': `Bearer ${PPT_API_KEY}`,
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    const text = await res.text()
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch cards', details: text }, { status: res.status })

    const data = JSON.parse(text)
    return NextResponse.json(data.data)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
