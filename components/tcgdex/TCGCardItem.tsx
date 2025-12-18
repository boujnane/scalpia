'use client'

import { TCGdexCardExtended } from '@/lib/tcgdex/types'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getCardImageUrl } from '@/lib/utils' 
import { PriceChartDisplay } from './PriceChartDisplay'
import { DollarSign, Euro, MapPin, Sparkles } from 'lucide-react'

type TCGCardResult = TCGdexCardExtended;

const getAssetUrl = (baseUrl: string | null | undefined, extension: 'png' | 'webp' = 'webp'): string | null => {
    if (!baseUrl) return null;
    return `${baseUrl}.${extension}`;
};

export const TCGCardItem = ({ card }: { card: TCGCardResult }) => {
    const setSymbolUrl = getAssetUrl(card.set?.symbol);
    const ebayFr = card.pricing?.['ebay-fr']
    console.log('PRICING', card.pricing)
    console.log('EBAY FR', card.pricing?.['ebay-fr'])
    return (
        <Card key={card.id} className="group overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/50 cursor-pointer bg-card">
            <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-x-2">
                <div className="overflow-hidden">
                    <CardTitle className="text-lg truncate font-extrabold text-primary group-hover:text-indigo-500 transition-colors">
                        {card.name} 
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium mt-1 flex items-center gap-2">
                        <span className="bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">{card.rarity}</span>
                        <span>{card.category}</span>
                    </p>
                </div>
                {setSymbolUrl && (
                    <div className="bg-white/50 p-1 rounded-full dark:bg-white/10">
                        <img src={setSymbolUrl} alt={`${card.set.name} Symbol`} className="w-6 h-6 object-contain" />
                    </div>
                )}
            </CardHeader>

            <CardContent className="flex flex-col gap-4 p-4 pt-2 flex-grow">
                {/* Image de la carte avec effet Glow au survol */}
                <div className="flex justify-center items-center py-2 relative">
                    <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img
                        src={getCardImageUrl(card.id, card.localId)}
                        alt={card.name}
                        className="rounded z-10 max-h-64 object-contain drop-shadow-md group-hover:drop-shadow-2xl transition-all"
                        loading="lazy"
                    />
                </div>
                
                {card.description && (
                    <div className="text-xs text-muted-foreground italic border-l-2 border-primary/20 pl-3 py-1">
                        "{card.description}"
                    </div>
                )}
                
                {/* Section Trading */}
                <div className="bg-muted/30 -mx-4 px-4 py-3 border-y border-border">
                    {card.pricing && (
                        <>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1 bg-success-light rounded-full">
                                    <Euro className="w-4 h-4 text-success"/> 
                                </div>
                                <span className="font-bold text-sm text-foreground">Cardmarket Trend</span>
                            </div>
                            
                            <PriceChartDisplay pricing={card.pricing} />
                            
                            {/* eBay France */}
                            {ebayFr && (
                            <div className="mt-4 pt-3 border-t border-dashed border-border">
                                <div className="flex items-center gap-2 mb-2">
                                <div className="p-1 bg-blue-500/10 rounded-full">
                                    <Euro className="w-4 h-4 text-blue-500"/>
                                </div>
                                <span className="font-bold text-sm">eBay France</span>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-xs">
                                {ebayFr.avg1 != null && (
                                    <div className="bg-background p-2 rounded border text-center">
                                    <p className="text-muted-foreground">24h</p>
                                    <p className="font-mono font-semibold">{ebayFr.avg1.toFixed(2)} €</p>
                                    </div>
                                )}

                                {ebayFr.avg7 != null && (
                                    <div className="bg-background p-2 rounded border text-center">
                                    <p className="text-muted-foreground">7j</p>
                                    <p className="font-mono font-semibold">{ebayFr.avg7.toFixed(2)} €</p>
                                    </div>
                                )}

                                {ebayFr.avg28 != null && (
                                    <div className="bg-background p-2 rounded border text-center">
                                    <p className="text-muted-foreground">28j</p>
                                    <p className="font-mono font-semibold">{ebayFr.avg28.toFixed(2)} €</p>
                                    </div>
                                )}
                                </div>

                                <p className="text-[10px] text-muted-foreground mt-2">
                                Source eBay • MAJ {new Date(ebayFr.updated).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            )}

                            {card.pricing.tcgplayer && (
                                <div className="mt-4 pt-3 border-t border-dashed border-border">
                                    <p className="font-semibold text-xs text-chart-3 flex items-center mb-2">
                                        <DollarSign className="w-3 h-3 mr-1"/> TCGPlayer (USD)
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(card.pricing.tcgplayer).map(([variantName, variant]) => {
                                            if (!variant || typeof variant !== 'object') return null;
                                            const v = variant as any;
                                            if (v.marketPrice == null) return null;
                                            return (
                                                <div key={variantName} className="text-xs flex justify-between bg-background p-1.5 rounded border border-border">
                                                    <span className="text-muted-foreground capitalize">{variantName}</span>
                                                    <span className="font-mono font-medium text-foreground">${v.marketPrice.toFixed(2)}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Détails Techniques (Footer) */}
                <div className="text-xs grid grid-cols-2 gap-y-1 text-muted-foreground mt-auto">
                    {card.hp && (
                         <p className="flex items-center">
                            <span className="font-bold mr-1">PV:</span> 
                            <span className="text-destructive font-bold">{card.hp}</span>
                         </p>
                    )}
                     {card.types?.length ? <p className="col-span-2"><span className="font-bold">Types:</span> {card.types.join(', ')}</p> : null}
                    {card.illustrator && <p className="col-span-2 truncate"><span className="font-bold">Art:</span> {card.illustrator}</p>}
                </div>

                {card.set?.name && (
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mt-3 pt-2 border-t flex justify-between items-center">
                        <span className="flex items-center gap-1 font-bold text-primary/80">
                            <MapPin className="w-3 h-3"/> {card.set.name}
                        </span>
                        <span className="font-mono bg-muted px-1 rounded">#{card.localId}</span>
                    </div>
                )}
            </CardContent>
        </Card>              
    )
}