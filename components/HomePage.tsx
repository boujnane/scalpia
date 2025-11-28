// file: components/HomePage.tsx
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

export default function HomePage() {
  const [query, setQuery] = useState('');
  const { progress, start, stop, set } = useProgress();
  const { run, loading, error, cleaned, vinted, soldItems } = useSearch();

  const handleSearch = async () => {
    if (!query) return;
    start();
    set(5);
    await run(query, (p) => set(p));
    stop();
  };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex justify-between items-center p-6 shadow-md bg-white z-10 sticky top-0">
        <h1 className="text-3xl font-bold">Pokémon Price Tracker</h1>
      </header>

      <section className="flex flex-col items-center justify-center p-12 bg-gradient-to-r from-indigo-50 to-purple-50 space-y-4 w-full">
        <h2 className="text-2xl font-semibold">Rechercher vos cartes/items Pokémon</h2>
        <SearchBar value={query} onChange={setQuery} onSearch={handleSearch} loading={loading} />
        {loading && <ProgressBar value={progress} />}
      </section>

      {error && <div className="text-red-500 text-center my-4">{error}</div>}

      {cleaned && (
        <section className="p-8">
          <h3 className="text-xl font-semibold mb-4">Résultats eBay</h3>
          <div className="flex flex-col lg:flex-row gap-6">
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
                          className="cursor-pointer hover:bg-indigo-100 transition text-sm px-3 py-2 rounded-full whitespace-nowrap"
                          onClick={() => item.url && window.open(item.url, '_blank')}
                        >
                          {badgeText} {textParens}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span>{mainText} {textParens}</span>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>

            <div className="flex-1 p-4 border rounded-md bg-gray-50">
              <h2 className="font-bold text-xl mb-2">Histogramme d’inventaire</h2>
              <HistogramWithStats histogram={cleaned.histogram} soldItems={soldItems?.valid || []} />
            </div>
          </div>
        </section>
      )}

      {(soldItems?.valid?.length ?? 0) > 0 && (
        <section className="p-8 mt-8">
          <h3 className="text-xl font-semibold mb-4">Ebay: Ventes réussies</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {soldItems?.valid?.map((item: any, i: number) => (
              <Card key={i} className="hover:shadow-xl transition cursor-pointer" onClick={() => item.url && window.open(item.url, '_blank')}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-32 object-contain mb-2" />}
                  <span className="font-medium">{item.price} €</span>
                  {item.soldDate && <span className="text-sm text-gray-500">{item.soldDate}</span>}
                  {item.condition && <span className="text-sm text-gray-500">{item.condition}</span>}
                  {item.seller && <span className="text-sm text-gray-500">Vendu par : {item.seller}</span>}
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="text-xl font-semibold mt-4">
            Prix minimal validé IA :{' '}
            <span className="text-green-600 font-bold ml-2">
              {soldItems?.minPrice ? `${soldItems.minPrice} €` : 'Aucun item valide'}
            </span>
          </h3>

          <details className="mb-4 cursor-pointer">
            <summary className="text-gray-600 underline">Annonces rejetées (IA)</summary>
            <ul className="mt-2 text-sm text-gray-500">
              {soldItems?.rejected?.map((r: any, i: number) => (
                <li key={i}>• {r.title} — {r.reason}</li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {vinted && (
        <section className="p-8">
          <h3 className="text-xl font-semibold mb-4">Vinted: En vente actuellement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vinted.valid?.map((item: any, i: number) => (
              <Card key={i} className="hover:shadow-xl transition cursor-pointer" onClick={() => item.url && window.open(item.url, '_blank')}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {item.thumbnail && <img src={item.thumbnail} alt={item.title} className="h-32 object-contain mb-2" />}
                  <span className="font-medium">{item.price} €</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <h3 className="text-xl font-semibold mb-4">
            Résultats Vinted — Prix minimal validé IA :
            <span className="text-green-600 font-bold ml-2">
              {vinted.minPrice ? `${vinted.minPrice} €` : 'Aucun item valide'}
            </span>
          </h3>

          <details className="mb-4 cursor-pointer">
            <summary className="text-gray-600 underline">Annonces rejetées (IA)</summary>
            <ul className="mt-2 text-sm text-gray-500">
              {vinted.rejected?.map((r: any, i: number) => (
                <li key={i}>• {r.title} — {r.reason}</li>
              ))}
            </ul>
          </details>
        </section>
      )}
    </main>
  );
}
