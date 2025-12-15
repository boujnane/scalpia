// file: components/SearchPage.tsx
'use client';
import { useState } from 'react';
import SearchBar from '@/components/ui/SearchBar';
import { useProgress } from '@/hooks/useProgress';
import { useSearch } from '@/hooks/useSearch';
import HistogramWithStats from '@/components/HistogramStats';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@radix-ui/react-tooltip';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProgressBar from './ui/ProgressBar';
import { LBCOffer } from '@/types';
import LBCItemCard from './leboncoin/LBCItemCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { progress, start, stop, set } = useProgress();
  // 💡 J'AJOUTE 'leboncoin' ici, suppose qu'il est retourné par useSearch
  const { run, loading, error, cleaned, vinted, soldItems, leboncoin } = useSearch();

  const handleSearch = async () => {
    if (!query) return;
    start();
    set(5);
    await run(query, (p) => set(p));
    stop();
  };

  const handleCardClick = (url: string | undefined | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-background">
      {/* Header (Utilise bg-card et text-foreground) */}
      <header className="flex justify-between items-center p-6 shadow-md bg-card border-b border-border z-10 sticky top-0">
        <h1 className="text-3xl font-bold text-foreground">Pokémon Price Tracker</h1>
      </header>

      {/* Section de Recherche (Utilise un fond thématique) */}
      <section className="flex flex-col items-center justify-center p-12 bg-muted/20 border-b border-border space-y-4 w-full">
        <h2 className="text-2xl font-semibold text-foreground">Rechercher vos cartes/items Pokémon</h2>
        <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} loading={loading} />
        {loading && <ProgressBar value={progress} />}
      </section>

      {/* Messages d'erreur */}
      {error && <div className="text-destructive text-center my-4">{error}</div>}

      {cleaned && (
        <section className="p-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Résultats eBay (Actif)</h3>
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Filtres de Prix (Badges) */}
            <div className="flex-1 flex flex-wrap gap-2">
              <TooltipProvider>
                {cleaned.priceFilters.slice(2).map((item: any, i: number) => {
                  const match = item.label.match(/^([^(]+)\s*(\([^)]+\))?\s*(\([0-9]+\))?.*$/);
                  const mainText = match?.[1]?.trim() ?? item.label;
                  const textParens = match?.[2]?.trim() ?? '';
                  const numberParens = match?.[3]?.trim() ?? '';

                  let badgeText = `${mainText} ${numberParens}`;
                  const badgeIndex = i + 2;

                  if ((badgeIndex === 2 || badgeIndex === 3) && (mainText === 'Oui' || mainText === 'Non')) {
                    badgeText = `${mainText} gradée ${numberParens}`;
                  }

                  return (
                    <Tooltip key={i}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          // Thème : hover:bg-primary/10 et text-primary pour l'effet de survol
                          className="cursor-pointer hover:bg-primary/10 transition text-sm px-3 py-2 rounded-full whitespace-nowrap text-primary"
                          onClick={() => item.url && window.open(item.url, '_blank')}
                        >
                          {badgeText} {textParens}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent 
                        // Thème : Utilisation de bg-popover/border-border
                        className="bg-popover border border-border text-popover-foreground p-2 rounded-md shadow-lg"
                      >
                        <span>{mainText} {textParens}</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>

            {/* Histogramme */}
            <div 
              // Thème : Utilisation de bg-card, border-border et text-foreground
              className="flex-1 p-4 border border-border rounded-lg bg-card shadow-lg"
            >
              <h2 className="font-bold text-xl mb-2 text-foreground">Histogramme d’inventaire</h2>
              <HistogramWithStats histogram={cleaned.histogram} soldItems={soldItems?.valid || []} />
            </div>
          </div>
        </section>
      )}

      {/* Ventes réussies eBay */}
      {(soldItems?.valid?.length ?? 0) > 0 && (
        <section className="p-8 mt-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Ebay: Ventes réussies</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {soldItems?.valid?.map((item: any, i: number) => (
              <Card 
                key={i} 
                // Thème : Utilisation de bg-card, border-border et hover:shadow-2xl
                className="bg-card border border-border hover:shadow-2xl transition cursor-pointer" 
                onClick={() => item.url && window.open(item.url, '_blank')}
              >
                <CardHeader>
                  <CardTitle className="text-foreground text-base line-clamp-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-32 object-contain mb-2" />}
                  <span className="font-bold text-lg text-primary">{item.price} €</span>
                  {item.soldDate && <span className="text-sm text-muted-foreground">{item.soldDate}</span>}
                  {item.condition && <span className="text-sm text-muted-foreground">{item.condition}</span>}
                  {item.seller && <span className="text-sm text-muted-foreground">Vendu par : {item.seller}</span>}
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="text-xl font-semibold mt-6 text-foreground">
            Prix minimal validé IA :{' '}
            {/* Thème : Utilisation de text-success */}
            <span className="text-success font-bold ml-2">
              {soldItems?.minPrice ? `${soldItems.minPrice} €` : 'Aucun item valide'}
            </span>
          </h3>

          <details className="mb-4 cursor-pointer mt-4">
            <summary className="text-muted-foreground hover:text-foreground transition">Annonces rejetées (IA)</summary>
            <ul className="mt-2 text-sm text-muted-foreground">
              {soldItems?.rejected?.map((r: any, i: number) => (
                <li key={i}>• {r.title} — {r.reason}</li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* Annonces Vinted */}
      {vinted && (
        <section className="p-8 mt-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Vinted: En vente actuellement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vinted.valid?.map((item: any, i: number) => (
              <Card 
                key={i} 
                // Thème : Utilisation de bg-card, border-border et hover:shadow-2xl
                className="bg-card border border-border hover:shadow-2xl transition cursor-pointer" 
                onClick={() => item.url && window.open(item.url, '_blank')}
              >
                <CardHeader>
                  <CardTitle className="text-foreground text-base line-clamp-2">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-32 object-contain mb-2" />}
                  <span className="font-bold text-lg text-primary">{item.price} €</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="text-xl font-semibold mt-6 text-foreground">
            Résultats Vinted — Prix minimal validé IA :
            {/* Thème : Utilisation de text-success */}
            <span className="text-success font-bold ml-2">
              {vinted.minPrice ? `${vinted.minPrice} €` : 'Aucun item valide'}
            </span>
          </h3>

          <details className="mb-4 cursor-pointer mt-4">
            <summary className="text-muted-foreground hover:text-foreground transition">Annonces rejetées (IA)</summary>
            <ul className="mt-2 text-sm text-muted-foreground">
              {vinted.rejected?.map((r: any, i: number) => (
                <li key={i}>• {r.title} — {r.reason}</li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {/* 🚀 SECTION : Annonces Le Bon Coin (LBC) utilisant LBCItemCard */}
      {leboncoin && leboncoin.valid.length > 0 && (
        <section className="p-8 mt-8">
          <h3 className="text-xl font-semibold mb-4 text-foreground">Le Bon Coin: En vente actuellement</h3>
          <div className="flex flex-col gap-6"> {/* Utilisation de flex-col pour que LBCItemCard prenne toute la largeur */}
            {leboncoin.valid?.map((offer: LBCOffer, i: number) => (
              // 💡 UTILISATION DU COMPOSANT LBCITEMCARD
              <LBCItemCard 
                key={i} 
                offer={offer} 
                // La gestion du clic pour ouvrir l'URL est interne à LBCItemCard
                onClick={() => handleCardClick(offer.link)}
              />
            ))}
          </div>

          <h3 className="text-xl font-semibold mt-6 text-foreground">
            Résultats Le Bon Coin — Prix minimal validé IA :
            <span className="text-success font-bold ml-2">
              {leboncoin.minPrice ? `${leboncoin.minPrice} €` : 'Aucun item valide'}
            </span>
          </h3>

          <details className="mb-4 cursor-pointer mt-4">
            <summary className="text-muted-foreground hover:text-foreground transition">Annonces rejetées (IA)</summary>
            <ul className="mt-2 text-sm text-muted-foreground">
              {leboncoin.rejected?.map((r: any, i: number) => (
                <li key={i}>• {r.title} — {r.reason}</li>
              ))}
            </ul>
          </details>
        </section>
      )}
      
      {/* Message si leboncoin est vide */}
      {leboncoin && leboncoin.valid.length === 0 && !loading && (
        <section className="p-8 mt-8">
            <div className="text-muted-foreground">
                ⚠️ Aucune annonce Le Bon Coin validée par l'IA.
            </div>
        </section>
      )}
    </main>
  );
}