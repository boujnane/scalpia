import { Point, buildChartData } from './buildChartData';
import { Item } from './types';

export type ChartAnalysis = {
    data: Point[];
    lastPrice: number | null;
    trend7d: number | null;
    lastPriceUnavailable: boolean;
};

/**
 * Calcule l'analyse complète du prix, basé sur les données agrégées.
 * La tendance 7j n'est calculée que si on a un point de référence
 * dans une plage valide (entre J-14 et J-5), pour éviter de comparer
 * avec un prix retail d'il y a plusieurs années.
 */
export function getChartAnalysis(item: Item): ChartAnalysis {

    const aggregatedData = buildChartData(item);

    // Vérifier si le dernier prix enregistré (brut) est null
    const sortedRawPrices = [...(item.prices ?? [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastRawPrice = sortedRawPrices[0];
    const lastPriceUnavailable = lastRawPrice?.price === null;

    const lastPoint = aggregatedData.length > 0 ? aggregatedData[aggregatedData.length - 1] : null;
    // lastPrice reste le dernier prix valide (pour les graphiques et analyses)
    const lastPrice = lastPoint ? lastPoint.price : null;

    // VÉRIFICATION CRITIQUE : Si pas de prix ou pas assez de données
    if (lastPoint === null || aggregatedData.length < 2) {
        return { data: aggregatedData, lastPrice: lastPrice, trend7d: null, lastPriceUnavailable };
    }

    const lastDate = new Date(lastPoint.date);

    // Date de référence : il y a 7 jours à partir de la dernière date connue
    const sevenDaysAgo = new Date(lastDate);
    sevenDaysAgo.setDate(lastDate.getDate() - 7);
    const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

    // Plage de tolérance : on accepte un point entre J-14 et J-5
    // pour s'assurer qu'on a des données récentes et pas juste le prix retail
    const minValidDate = new Date(lastDate);
    minValidDate.setDate(lastDate.getDate() - 14);
    const minValidTimestamp = minValidDate.getTime();

    const maxValidDate = new Date(lastDate);
    maxValidDate.setDate(lastDate.getDate() - 5);
    const maxValidTimestamp = maxValidDate.getTime();

    let price7DaysAgo: number | null = null;
    let bestDistance = Infinity;

    // Trouver le point le plus proche de J-7 dans la plage valide [J-14, J-5]
    for (let i = aggregatedData.length - 2; i >= 0; i--) {
        const point = aggregatedData[i];

        // Le point doit être dans la plage valide
        if (point.date >= minValidTimestamp && point.date <= maxValidTimestamp) {
            const distance = Math.abs(point.date - sevenDaysAgoTimestamp);
            if (distance < bestDistance) {
                bestDistance = distance;
                price7DaysAgo = point.price;
            }
        }

        // Si on est trop loin dans le passé, on arrête
        if (point.date < minValidTimestamp) break;
    }

    // Calcul de la tendance (null si pas de point valide trouvé)
    let trend7d: number | null = null;

    if (price7DaysAgo !== null && price7DaysAgo !== 0) {
        trend7d = ((lastPrice! - price7DaysAgo) / price7DaysAgo) * 100;
    }

    return {
        data: aggregatedData,
        lastPrice: lastPrice,
        trend7d: trend7d,
        lastPriceUnavailable,
    };
}