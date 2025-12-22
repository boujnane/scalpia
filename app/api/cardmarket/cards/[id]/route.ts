import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, headers } from '@/app/api/cardmarket/_utils'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 30 * 60 * 1000 // 30 min

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    const cached = CACHE.get(id)
    if (cached && Date.now() - cached.ts < TTL) {
      return NextResponse.json(cached.data)
    }

    const res = await fetch(`${BASE_URL}/pokemon/cards/${id}`, {
      headers: headers(apiKey),
      next: { revalidate: 1800 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: res.status }
      )
    }

    const json = await res.json()

    CACHE.set(id, { data: json.data, ts: Date.now() })

    return NextResponse.json(json.data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
