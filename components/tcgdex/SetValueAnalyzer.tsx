import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, Euro, Crown, Package } from 'lucide-react'
import { getCardImageUrl } from '@/lib/utils'

interface SetValueAnalyzerProps {
  cards: TCGdexCardExtended[]
  setName?: string
}

// Fonction utilitaire pour obtenir le prix Cardmarket d'une carte
const getCardmarketPrice = (card: TCGdexCardExtended): number => {
  const cm = card.pricing?.cardmarket
  if (!cm) return 0
  
  // Priorité: trend > avg (on prend le plus élevé entre normal et holo)
  const normalPrice = cm.trend || cm.avg || 0
  const holoPrice = cm['trend-holo'] || cm['avg-holo'] || 0
  
  return Math.max(normalPrice, holoPrice)
}

// Fonction utilitaire pour calculer la valeur totale du set
const calculateSetValue = (cards: TCGdexCardExtended[]): number => {
  return cards.reduce((total, card) => total + getCardmarketPrice(card), 0)
}

// Fonction utilitaire pour obtenir les top N cartes par valeur
const getTopValueCards = (cards: TCGdexCardExtended[], limit: number = 10): TCGdexCardExtended[] => {
  return [...cards]
    .filter(card => getCardmarketPrice(card) > 0)
    .sort((a, b) => getCardmarketPrice(b) - getCardmarketPrice(a))
    .slice(0, limit)
}

// Composant pour une carte compacte
const CompactCardItem = ({ card, rank }: { card: TCGdexCardExtended; rank: number }) => {
  const price = getCardmarketPrice(card)
  const setSymbolUrl = card.set?.symbol ? `${card.set.symbol}.webp` : null
  
  return (
    <div className="group relative bg-card rounded-lg border border-border/50 overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all">
      {/* Badge de rang */}
      <div className="absolute top-2 left-2 z-10 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow-lg">
        {rank}
      </div>
      
      <div className="flex gap-3 p-3">
        {/* Image */}
        <div className="relative flex-shrink-0">
          <img
            src={getCardImageUrl(card.id, card.localId)}
            alt={card.name}
            className="w-20 h-28 object-contain rounded group-hover:scale-105 transition-transform"
            loading="lazy"
          />
        </div>
        
        {/* Informations */}
        <div className="flex-grow flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-bold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {card.name}
              </h4>
              {setSymbolUrl && (
                <img src={setSymbolUrl} alt="" className="w-4 h-4 flex-shrink-0 opacity-60" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              #{card.localId} • {card.rarity}
            </p>
          </div>
          
          {/* Prix */}
          <div className="mt-2 pt-2 border-t border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Euro className="w-3 h-3" />
                Cardmarket
              </span>
              <span className="text-lg font-bold text-primary">
                €{price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SetValueAnalyzer({ cards, setName }: SetValueAnalyzerProps) {
  const totalValue = calculateSetValue(cards)
  const topCards = getTopValueCards(cards, 10)
  const cardsWithPrice = cards.filter(card => getCardmarketPrice(card) > 0).length
  const averageValue = cardsWithPrice > 0 ? totalValue / cardsWithPrice : 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="lg"
          className="gap-2 font-bold shadow-md hover:shadow-lg hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <TrendingUp className="w-5 h-5" />
          Analyser la valeur du set
        </Button>
      </DialogTrigger>
      
      <DialogContent className="
        w-[95vw]                     // Largeur par défaut (mobile) à 95% de la vue
        max-w-none                   // Annule toutes les limites de largeur (mobile)
        max-h-[90vh] 
        overflow-y-auto 
        p-6 
        
        md:w-[95vw]                  // Sur tablette/desktop, on garde 95vw
        md:max-w-[50vw]              // Mais on limite la largeur max à 50% de la vue
        ">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Analyse de valeur {setName && `- ${setName}`}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {/* Statistiques globales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Euro className="w-4 h-4" />
                  Valeur totale du set
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  €{totalValue.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {cardsWithPrice} cartes avec prix
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Prix moyen
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">
                  €{averageValue.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  par carte
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  Carte la plus chère
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  €{topCards[0] ? getCardmarketPrice(topCards[0]).toFixed(2) : '0.00'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {topCards[0]?.name || 'N/A'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top 10 des cartes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-5 h-5 text-amber-500" />
              <h3 className="text-xl font-bold">Top 10 des cartes les plus chères</h3>
            </div>
            
            {topCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topCards.map((card, index) => (
                  <CompactCardItem key={card.id} card={card} rank={index + 1} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Aucune carte avec prix disponible dans ce set
              </div>
            )}
          </div>

          {/* Note informative */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border border-border/50">
            <p className="font-medium mb-1">ℹ️ À propos de cette analyse</p>
            <p>
              Les prix affichés proviennent de l'API TCG DEX et représentent le prix moyen cardmarket. Cette analyse est basée sur {cardsWithPrice} cartes 
              sur {cards.length} au total. Il peut y avoir des erreurs, les informations sont données à titre indicatif.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}