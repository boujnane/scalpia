'use client'

import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, YAxis } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'

interface PriceChartDisplayProps {
  pricing: TCGdexCardExtended['pricing']
}

const pickAvg = (cm: any, key: string) => {
  if (!cm) return undefined
  const nonFoil = cm[key]
  const foil = cm[`${key}-holo`]
  const values: number[] = []
  if (typeof nonFoil === 'number' && nonFoil > 0) values.push(nonFoil)
  if (typeof foil === 'number' && foil > 0) values.push(foil)
  if (!values.length) return undefined
  return values.reduce((a, b) => a + b, 0) / values.length
}

const transformData = (cm: any) => {
  const data: Array<{ name: string; price: number }> = []
  const avg30 = pickAvg(cm, 'avg30')
  const avg7 = pickAvg(cm, 'avg7')
  const avg1 = pickAvg(cm, 'avg1')

  if (typeof avg30 === 'number') data.push({ name: 'J-30', price: avg30 })
  if (typeof avg7 === 'number' && avg7 !== avg30) data.push({ name: 'J-7', price: avg7 })
  if (typeof avg1 === 'number' && avg1 !== avg7) data.push({ name: 'J-1', price: avg1 })

  return data
}

const computeTrend = (data: Array<{ name: string; price: number }>) => {
  if (data.length < 2) return { isUp: true }
  const first = data[0].price
  const last = data[data.length - 1].price
  return { isUp: last >= first }
}

export const PriceChartDisplay = ({ pricing }: PriceChartDisplayProps) => {
  const cm = pricing?.cardmarket
  if (!cm) return (
    <p className="text-xs text-muted-foreground italic flex items-center">
      <DollarSign className="w-3 h-3 mr-1" /> Prix non disponibles.
    </p>
  )

  const data = transformData(cm)
  const { isUp } = computeTrend(data)
  
  // Utilisation des variables CSS du thème pour le graphique
  const strokeColor = isUp ? 'var(--color-success)' : 'var(--color-destructive)'
  const TrendIcon = isUp ? TrendingUp : TrendingDown
  const lastPrice = data.length ? data[data.length - 1].price : null

  return (
    <div className="space-y-3 p-3 border border-border rounded-lg bg-muted/30">
      <div className="flex items-center justify-between">
        <div>
           <p className="text-xs text-muted-foreground font-medium mb-1">Dernier prix connu</p>
           <p className={`text-xl font-extrabold ${isUp ? 'text-success' : 'text-destructive'} flex items-center`}>
            {lastPrice != null ? `${lastPrice.toFixed(2)} €` : 'N/A'}
           </p>
        </div>
        
        <div className={`px-2 py-1 rounded text-xs font-bold flex items-center ${isUp ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
          <TrendIcon className="w-4 h-4 mr-1"/>
          {isUp ? 'HAUSSE' : 'BAISSE'}
        </div>
      </div>

      {data.length > 1 ? (
        <div className="h-24 w-full -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Tooltip
                contentStyle={{ 
                    backgroundColor: 'var(--color-popover)', 
                    borderColor: 'var(--color-border)', 
                    color: 'var(--color-popover-foreground)',
                    borderRadius: 'var(--radius)',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ color: 'var(--color-foreground)' }}
                formatter={(value) => [`${parseFloat(value as string).toFixed(2)} €`, 'Prix']}
                labelStyle={{ color: 'var(--color-muted-foreground)', marginBottom: '0.25rem' }}
              />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }} 
                interval="preserveStartEnd" 
                height={20}
              />
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
            <Activity className="w-6 h-6 mb-1 opacity-20"/>
            <p className="text-xs italic">Données insuffisantes</p>
        </div>
      )}
    </div>
  )
}