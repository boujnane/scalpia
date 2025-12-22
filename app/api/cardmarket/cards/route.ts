import { NextResponse } from 'next/server'
import { BASE_URL, headers } from '@/app/api/cardmarket/_utils'

export async function GET(req: Request) {
  try {
    const apiKey = process.env.CARDMARKET_RAPIDAPI_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API key' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const page = searchParams.get('page') ?? '1'

    const res = await fetch(
      `${BASE_URL}/pokemon/cards?page=${page}`,
      {
        headers: headers(apiKey),
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to list cards' },
        { status: res.status }
      )
    }

    const json = await res.json()
    return NextResponse.json(json)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
