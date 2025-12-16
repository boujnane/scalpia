'use client';
import { useEffect, useState } from 'react';
import { TCGCardItem } from './TCGCardItem';
import { TCGdexCardExtended } from '@/lib/tcgdex/types';
import { SetValueAnalyzer } from './SetValueAnalyzer';
import { Loader2 } from 'lucide-react';

export const TCGSetViewer = ({ setId }: { setId: string }) => {
  const [cards, setCards] = useState<TCGdexCardExtended[]>([]);
  const [setName, setSetName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (!setId) return;
    
    const loadSetWithPricing = async () => {
      setLoading(true);
      setError(null);
      setCards([]);
      
      try {
        // 1. Récupérer la liste des cartes du set
        const setRes = await fetch(`/api/tcgdex/set?id=${setId}`);
        if (!setRes.ok) throw new Error('Erreur lors du chargement du set');
        
        const setData = await setRes.json();
        const basicCards = setData.cards || [];
        setSetName(setData.name || '');
        
        if (basicCards.length === 0) {
          setLoading(false);
          return;
        }

        setLoadingProgress({ current: 0, total: basicCards.length });

        // 2. Enrichir chaque carte avec ses détails complets (pricing inclus)
        const enrichedCards: TCGdexCardExtended[] = [];
        
        // Charger les cartes par batch de 5 pour éviter de surcharger l'API
        const batchSize = 5;
        for (let i = 0; i < basicCards.length; i += batchSize) {
          const batch = basicCards.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (basicCard: any) => {
            try {
              const cardRes = await fetch(`/api/tcgdex/card?id=${basicCard.id}`);
              if (cardRes.ok) {
                return await cardRes.json();
              }
              return basicCard; // Fallback sur les données basiques
            } catch {
              return basicCard;
            }
          });

          const batchResults = await Promise.all(batchPromises);
          enrichedCards.push(...batchResults);
          
          // Mettre à jour la progression et afficher les cartes au fur et à mesure
          setLoadingProgress({ current: enrichedCards.length, total: basicCards.length });
          setCards([...enrichedCards]);
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadSetWithPricing();
  }, [setId]);

  if (loading && cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-lg text-muted-foreground">Chargement des cartes du set...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-center">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">
          {cards.length} carte{cards.length > 1 ? 's' : ''} dans ce set
        </h2>
        
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Chargement des prix... {loadingProgress.current}/{loadingProgress.total}</span>
            </div>
          )}
          
          {cards.length > 0 && !loading && (
            <SetValueAnalyzer cards={cards} setName={setName} />
          )}
        </div>
      </div>
      
      {cards.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune carte trouvée dans ce set
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(card => (
            <TCGCardItem key={card.id} card={card} />
          ))}
        </div>
      )}
    </div>
  );
};