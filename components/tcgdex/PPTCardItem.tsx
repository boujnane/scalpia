'use client'

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Euro, DollarSign, MapPin } from 'lucide-react'

interface PPTCard {
  id: string
  name: string
  rarity?: string
  cardType?: string
  hp?: number
  imageUrl?: string
  types?: string[]
  artist?: string
  localId?: string
  set?: { name?: string, symbol?: string }
  prices?: {
    market?: number
    lastUpdated?: string
    variants?: Record<string, Record<string, { price: number, priceString: string }>>
  }
}

export const PPTCardItem = ({ card }: { card: PPTCard }) => {
  const holofoil = card.prices?.variants?.Holofoil

  return (
    <Card className="group overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 cursor-pointer bg-card">
      <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-x-2">
        <div className="overflow-hidden">
          <CardTitle className="text-lg truncate font-extrabold text-primary group-hover:text-indigo-500 transition-colors">
            {card.name}
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-2">
            {card.rarity && <span className="bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{card.rarity}</span>}
            {card.cardType && <span>{card.cardType}</span>}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4 pt-2 flex-grow">
        {/* Image */}
        {card.imageUrl && (
          <div className="flex justify-center items-center py-2 relative">
            <img src={card.imageUrl} alt={card.name} className="rounded z-10 max-h-64 object-contain drop-shadow-md group-hover:drop-shadow-2xl transition-all" loading="lazy" />
          </div>
        )}

        {/* Prix marché général */}
        {card.prices?.market != null && (
          <div className="text-sm mb-2">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-success" />
              <span className="font-bold">Marché:</span>
            </div>
            <p className="text-xs">{card.prices.market.toFixed(2)} $</p>
            {card.prices.lastUpdated && <p className="text-[10px] text-muted-foreground mt-1">MAJ: {new Date(card.prices.lastUpdated).toLocaleDateString('fr-FR')}</p>}
          </div>
        )}

        {/* Variants Holofoil */}
        {holofoil && (
          <div className="text-sm mt-2">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="font-bold">Holofoil</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(holofoil).map(([condition, data]) => (
                <div key={condition} className="flex justify-between bg-background p-1.5 rounded border border-border text-xs">
                  <span>{condition}</span>
                  <span>${data.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Infos techniques */}
        <div className="text-xs grid grid-cols-2 gap-y-1 text-muted-foreground mt-2">
          {card.hp && <p className="flex items-center"><span className="font-bold mr-1">PV:</span>{card.hp}</p>}
          {card.types?.length && <p className="col-span-2"><span className="font-bold">Types:</span> {card.types.join(', ')}</p>}
          {card.artist && <p className="col-span-2 truncate"><span className="font-bold">Art:</span> {card.artist}</p>}
        </div>

        {/* Set info */}
        {card.set?.name && (
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-3 pt-2 border-t flex justify-between items-center">
            <span className="flex items-center gap-1 font-bold text-primary/80">
              <MapPin className="w-3 h-3"/> {card.set.name}
            </span>
            {card.localId && <span className="font-mono bg-muted px-1 rounded">#{card.localId}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
