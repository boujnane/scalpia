// components/TCGCardItem.tsx
'use client'

import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator" 
// Assurez-vous d'avoir les fonctions utilitaires nécessaires
import { getCardImageUrl } from '@/lib/utils' 
// 💡 IMPORTANT : Assurez-vous d'importer votre nouveau composant de graphique
import { PriceChartDisplay } from './PriceChartDisplay' // Ajustez le chemin si nécessaire
import { DollarSign, Euro, MapPin } from 'lucide-react'


type TCGCardResult = TCGdexCardExtended;

/**
 * Reconstruit l'URL de l'asset (Logo ou Symbole) avec l'extension recommandée.
 */
const getAssetUrl = (baseUrl: string | null | undefined, extension: 'png' | 'webp' = 'webp'): string | null => {
    if (!baseUrl) return null;
    return `${baseUrl}.${extension}`;
};


export const TCGCardItem = ({ card }: { card: TCGCardResult }) => {
    const setSymbolUrl = getAssetUrl(card.set?.symbol);

    return (
        // Interaction visuelle au survol (UX/UI Moderne)
        <Card key={card.id} className="overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-pointer">
            <CardHeader className="p-3 pb-0 flex flex-row justify-between items-start space-x-2">
                <div>
                    <CardTitle className="text-lg truncate font-extrabold text-slate-800">
                        {card.name} 
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                        {card.rarity} - {card.category} {card.stage ? `(${card.stage})` : ''}
                    </p>
                </div>
                {setSymbolUrl && (
                    <img src={setSymbolUrl} alt={`${card.set.name} Symbol`} className="w-8 h-8 object-contain flex-shrink-0" />
                )}
            </CardHeader>

            <CardContent className="flex flex-col gap-3 p-3 pt-2 flex-grow">
                {/* Image de la carte */}
                <div className="flex justify-center items-center">
                    <img
                        src={getCardImageUrl(card.id, card.localId)}
                        alt={card.name}
                        className="rounded max-h-72 object-contain shadow-xl border-4 border-gray-100"
                    />
                </div>

                <Separator />
                
                {/* 1. Description de la carte (Remontée) */}
                {card.description && (
                    <blockquote className="text-xs italic text-gray-600 mb-1 border-l-2 pl-2">
                        {card.description}
                    </blockquote>
                )}
                
                <Separator />

                {/* 2. Bloc de Prix - Cardmarket (avec Graphique) */}
                {card.pricing && (
                    <>
                        <h3 className="text-base font-bold text-slate-700 flex items-center mb-2">
                            <Euro className="w-4 h-4 mr-1 text-green-700"/> Cardmarket (EUR)
                        </h3>
                        <PriceChartDisplay pricing={card.pricing} />
                        
                        {/* 3. Bloc de Prix - TCGPlayer (Affichage brut en dessous) */}
                        {card.pricing.tcgplayer && (
                            <div className="text-sm space-y-1 mt-4">
                                <p className="font-semibold text-blue-800 flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1 text-blue-700"/> TCGPlayer (USD)
                                </p>
                                {Object.entries(card.pricing.tcgplayer).map(([variantName, variant]) => {
                                    if (!variant || typeof variant !== 'object') return null;
                                    const v = variant as any;
                                    if (v.marketPrice == null) return null;
                                    return (
                                        <p key={variantName} className="text-xs text-gray-700 ml-2">
                                            - {variantName} : <span className="font-mono text-blue-600">${v.marketPrice.toFixed(2)}</span>
                                        </p>
                                    )
                                })}
                            </div>
                        )}
                        {(card.pricing.tcgplayer || card.pricing.cardmarket) && <Separator className="mt-4" />}
                    </>
                )}


                {/* 4. Détails Secondaires */}
                <div className="text-sm space-y-1">
                    <p>
                        <strong>PV :</strong> <span className="text-red-600 font-bold">{card.hp ?? 'N/A'}</span>
                        {card.types?.length ? <span className="ml-4"><strong>Type :</strong> {card.types.join(', ')}</span> : null}
                    </p>
                    {card.illustrator && <p><strong>Illustrateur :</strong> {card.illustrator}</p>}
                    {card.retreat && <p><strong>Retraite :</strong> {card.retreat}</p>}
                </div>

                {/* Set/LocalID en bas de carte */}
                {card.set?.name && (
                    <div className="text-xs text-gray-500 mt-auto pt-2 border-t flex justify-between">
                        <span className="flex items-center"><MapPin className="w-3 h-3 mr-1"/> Set : {card.set.name}</span>
                        <span>#{card.localId}</span>
                    </div>
                )}
            </CardContent>
        </Card>              
    )
}