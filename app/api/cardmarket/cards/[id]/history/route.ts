import { NextRequest, NextResponse } from 'next/server'
import { BASE_URL, headers } from '@/app/api/cardmarket/_utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    const { id } = await params

    const res = await fetch(
      `${BASE_URL}/pokemon/cards/${id}/prices/history`,
      {
        headers: headers(apiKey),
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Price history unavailable' },
        { status: res.status }
      )
    }

    const json = await res.json()
    return NextResponse.json(json.data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
