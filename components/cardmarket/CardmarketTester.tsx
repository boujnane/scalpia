'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export const CardmarketTester = () => {
  const [query, setQuery] = useState('')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const res = await fetch(`/api/cardmarket/search?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error('Request failed')
      const json = await res.json()
      setData(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ex: Pikachu 238"
          className="flex-1 border rounded-lg px-4 py-2"
        />
        <button
          onClick={search}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg"
        >
          Tester
        </button>
      </div>

      {loading && <Loader2 className="animate-spin mx-auto" />}

      {error && <p className="text-red-500">{error}</p>}

      {data && (
        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[400px]">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  )
}
