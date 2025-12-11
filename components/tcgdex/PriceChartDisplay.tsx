'use client'

import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

interface PriceChartDisplayProps {
  pricing: TCGdexCardExtended['pricing']
}

// Fonction pour transformer les moyennes agrégées en une série chronologique simple
const transformDataForTrend = (cardmarket: NonNullable<TCGdexCardExtended['pricing']>['cardmarket']) => {
  const data = []
  
  // Point 1: Le point de départ le plus éloigné disponible (Moyenne 30 jours)
  if (cardmarket?.avg30 != null) {
    data.push({ name: 'J-30', price: cardmarket.avg30 })
  }
  
  // Point 2: Le point intermédiaire (Moyenne 7 jours)
  if (cardmarket?.avg7 != null) {
    // Si on a J-30, on s'assure que J-7 vient après. Si J-30 n'existe pas, J-7 est le point de départ.
    if (data.length === 0 || cardmarket.avg7 !== cardmarket.avg30) {
        data.push({ name: 'J-7', price: cardmarket.avg7 })
    }
  }

  // Point 3: Le prix le plus récent (Tendance ou Moyenne actuelle)
  const currentPrice = cardmarket?.trend ?? cardmarket?.avg;
  if (currentPrice != null) {
    // Éviter de répéter le dernier point si avg/trend est identique à avg7
    if (data.length === 0 || data[data.length - 1].price !== currentPrice) {
        data.push({ name: 'Actuel', price: currentPrice })
    }
  }

  return data.filter(d => d.price != null && d.price > 0)
}


export const PriceChartDisplay = ({ pricing }: PriceChartDisplayProps) => {
  const cardmarket = pricing?.cardmarket

  if (!cardmarket) {
    return <p className="text-xs text-gray-500 italic flex items-center"><DollarSign className="w-3 h-3 mr-1"/> Prix non disponibles.</p>
  }

  const data = transformDataForTrend(cardmarket)
  const lastPrice = data.length > 0 ? data[data.length - 1].price : null
  const firstPrice = data.length > 1 ? data[0].price : lastPrice

  // Logique pour la couleur de tendance (UX/UI)
  const isUpward = lastPrice != null && firstPrice != null ? lastPrice >= firstPrice : true
  const strokeColor = isUpward ? '#16a34a' : '#ef4444' // vert-600 ou rouge-500
  const TrendIcon = isUpward ? TrendingUp : TrendingDown

  return (
    <div className="space-y-3 p-2 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        {/* Affichage de la valeur actuelle et de la tendance */}
        <p className={`text-lg font-extrabold ${isUpward ? 'text-green-700' : 'text-red-700'} flex items-center`}>
            {lastPrice?.toFixed(2) ?? 'N/A'} €
        </p>
        <div className={`text-sm font-semibold ${isUpward ? 'text-green-600' : 'text-red-600'} flex items-center`}>
            <TrendIcon className="w-4 h-4 mr-1"/>
            {isUpward ? 'Hausse' : 'Baisse'} 
            <br></br>(30 derniers j)
        </div>
      </div>

      {/* Graphique en ligne (Sparkline) */}
      {data.length > 1 ? ( // Il faut au moins 2 points pour une ligne
        <div className="h-24 w-full -mx-2 -mb-2"> {/* On utilise des marges négatives pour que le graphique soit bien bord à bord en bas */}
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              {/* Tooltip pour afficher le prix au survol */}
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    border: '1px solid #ccc', 
                    fontSize: '12px' 
                }}
                formatter={(value, name, props) => [`${parseFloat(value as string).toFixed(2)} €`, props.payload.name]}
              />
              {/* XAxis affichant les points de repère (J-30, J-7, Actuel) */}
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" height={20} padding={{ left: 10, right: 10 }}/>
              {/* YAxis est retiré pour un look Sparkline épuré */}
              <Line 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2}
                dot={false} // Pas de points sauf le dernier
                name="Prix (€)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic text-center">Graphique non disponible (moins de 2 points de données).</p>
      )}
    </div>
  )
}