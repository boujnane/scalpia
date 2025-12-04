import { Point, Item, buildChartData } from './buildChartData';

export type ChartAnalysis = {
    data: Point[];
    lastPrice: number | null;
    trend7d: number | null;
};

/**
 * Calcule l'analyse complète du prix, basé sur les données agrégées.
 */
export function getChartAnalysis(item: Item): ChartAnalysis {
    
    const aggregatedData = buildChartData(item);

    const lastPoint = aggregatedData.length > 0 ? aggregatedData[aggregatedData.length - 1] : null;
    const lastPrice = lastPoint ? lastPoint.price : null; // ✅ lastPrice est géré ici

    // VÉRIFICATION CRITIQUE : Si pas de prix ou pas assez de données (ex: juste le prix retail)
    if (lastPoint === null || aggregatedData.length < 2) {
        return { data: aggregatedData, lastPrice: lastPrice, trend7d: null };
    }
    
    // À partir d'ici, lastPoint est garanti non-null et nous avons au moins deux points.

    // ✅ lastDate est maintenant basé sur lastPoint (garanti non-null)
    const lastDate = new Date(lastPoint.date); 
    
    // Date de référence : il y a 7 jours à partir de la dernière date connue
    const sevenDaysAgo = new Date(lastDate);
    sevenDaysAgo.setDate(lastDate.getDate() - 7);
    const sevenDaysAgoTimestamp = sevenDaysAgo.getTime();

    let price7DaysAgo: number | null = null;
    
    // 2. Trouver le prix de référence (le point le plus proche avant ou à J-7)
    for (let i = aggregatedData.length - 1; i >= 0; i--) {
        const point = aggregatedData[i];
        
        if (point.date <= sevenDaysAgoTimestamp) {
            price7DaysAgo = point.price;
            break;
        }
    }

    // 3. Calcul de la tendance
    let trend7d: number | null = null;
    
    if (price7DaysAgo !== null && price7DaysAgo !== 0) {
        trend7d = ((lastPrice! - price7DaysAgo) / price7DaysAgo) * 100; 
        // ⚠️ Utilisation de '!' car nous savons que lastPrice n'est pas null ici
    }
    
    return {
        data: aggregatedData,
        lastPrice: lastPrice,
        trend7d: trend7d,
    };
}