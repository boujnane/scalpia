"use client";
import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { Icons } from "@/components/icons"; 
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Item } from "@/lib/analyse/types";
import CustomDot from "./CustomDot"; // Assurez-vous que CustomDot est correctement importé
// Type Point doit être importé si non dans ce fichier, mais je le redéfinis ici pour l'exhaustivité
type Point = { date: number; price: number };

export default function ItemModal({
  item,
  chartData,
  open,
  onOpenChange,
}: {
  item: Item;
  chartData: Point[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const initialTimeFrame = chartData.length > 0 ? {
    start: new Date(chartData[0].date),
    end: new Date(chartData[chartData.length - 1].date),
  } : { start: new Date(), end: new Date() };
  
  const [timeFrame, setTimeFrame] = useState<{ start: Date; end: Date }>(initialTimeFrame);
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  
  const setLastNDays = (days: number) => {
    if (chartData.length === 0) return;
    const end = new Date(chartData[chartData.length - 1].date);
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    setTimeFrame({ start, end });
  };
  
  const filteredData = useMemo(
    () => chartData.filter(d => d.date >= timeFrame.start.getTime() && d.date <= timeFrame.end.getTime()),
    [chartData, timeFrame]
  );
  
  const ma30 = useMemo(() => {
    if (!showMA) return [];
    const windowSize = 30;
    const ma: Point[] = [];
    for (let i = 0; i < filteredData.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const slice = filteredData.slice(start, i + 1);
      const avg = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
      ma.push({ date: filteredData[i].date, price: avg });
    }
    return ma;
  }, [filteredData, showMA]);
  
  const bollinger = useMemo(() => {
    if (!showBB) return [];
    const windowSize = 20;
    const bb: { date: number; mid: number; upper: number; lower: number }[] = [];
    for (let i = 0; i < filteredData.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const slice = filteredData.slice(start, i + 1);
      const mid = slice.reduce((sum, p) => sum + p.price, 0) / slice.length;
      const std = Math.sqrt(slice.reduce((sum, p) => sum + Math.pow(p.price - mid, 2), 0) / slice.length);
      bb.push({ date: filteredData[i].date, mid, upper: mid + 2 * std, lower: mid - 2 * std });
    }
    return bb;
  }, [filteredData, showBB]);

  const periodStats = useMemo(() => {
    if (filteredData.length === 0) return { 
        min: "0.00", max: "0.00", avg: "0.00", 
        minDate: "N/A", maxDate: "N/A" 
    };
    
    const prices = filteredData.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    return { 
        min: min.toFixed(2), 
        max: max.toFixed(2), 
        avg: avg.toFixed(2),
        minDate: new Date(filteredData.find(p => p.price === min)?.date || 0).toLocaleDateString(),
        maxDate: new Date(filteredData.find(p => p.price === max)?.date || 0).toLocaleDateString(),
    };
  }, [filteredData]);
  
  const yDomain = useMemo(() => {
    const allPrices = filteredData.map(p => p.price)
      .concat(showMA ? ma30.map(p => p.price) : [])
      .concat(showBB ? bollinger.flatMap(b => [b.upper, b.lower]) : []);
    if (allPrices.length === 0) return [0, 100];
    const min = Math.floor(Math.min(...allPrices) / 10) * 10;
    const max = Math.ceil(Math.max(...allPrices) / 10) * 10;
    return [min, max];
  }, [filteredData, ma30, bollinger, showMA, showBB]);
  
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // 1. Hauteur augmentée pour donner plus d'espace au graphique
        className={`w-full max-w-4xl ${isMobile ? "h-[85vh]" : "h-[700px]"} flex flex-col p-4`}
        showCloseButton={false}
      >
        <DialogTitle className="mb-2 text-lg font-semibold">{item.name}</DialogTitle>

        {/* Boutons de timeframe */}
        <div className="flex gap-2 mb-2 overflow-x-auto"> {/* Marges réduites ici */}
          {[
            { label: "All", days: null },
            { label: "1M", days: 30 },
            { label: "3M", days: 90 },
            { label: "6M", days: 180 },
          ].map(({ label, days }) => (
            <button
              key={label}
              onClick={() =>
                days
                  ? setLastNDays(days)
                  : setTimeFrame(initialTimeFrame) 
              }
              className="flex-shrink-0 px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Statistiques Clés */}
        <div className="grid grid-cols-3 gap-4 p-3 border rounded-lg bg-gray-50 mb-2"> {/* Marges réduites ici */}
            <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Min Prix ({periodStats.minDate})</p>
                <p className="font-bold text-red-600 text-lg sm:text-xl">{periodStats.min} €</p>
            </div>
            <div className="text-center border-l border-r">
                <p className="text-xs text-gray-500 uppercase">Moy. Période</p>
                <p className="font-bold text-gray-800 text-lg sm:text-xl">{periodStats.avg} €</p>
            </div>
            <div className="text-center">
                <p className="text-xs text-gray-500 uppercase">Max Prix ({periodStats.maxDate})</p>
                <p className="font-bold text-green-600 text-lg sm:text-xl">{periodStats.max} €</p>
            </div>
        </div>

        {/* Boutons pour afficher/cacher indicateurs */}
        <div className="flex gap-2 mb-2 flex-wrap items-center"> {/* Marges réduites ici */}
        {/* MA30 */}
            <Tooltip>
                <TooltipTrigger asChild>
                <button
                    className={`px-3 py-1 rounded flex items-center gap-1 ${showMA ? "bg-blue-400 text-white" : "bg-gray-300"}`}
                    onClick={() => setShowMA(!showMA)}
                >
                    MA30
                    <Icons.info className="w-4 h-4 text-white" />
                </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                Moyenne mobile (MA) sur 30 jours.
                </TooltipContent>
            </Tooltip>
            {/* Bollinger */}
            <Tooltip>
                <TooltipTrigger asChild>
                <button
                    className={`px-3 py-1 rounded flex items-center gap-1 ${showBB ? "bg-yellow-500 text-white" : "bg-gray-300"}`}
                    onClick={() => setShowBB(!showBB)}
                >
                    Bollinger
                    <Icons.info className="w-4 h-4 text-white" />
                </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                Elles mesurent la volatilité du prix.
                </TooltipContent>
            </Tooltip>
            {/* Trend */}
            <Tooltip>
                <TooltipTrigger asChild>
                <button
                    className={`px-3 py-1 rounded flex items-center gap-1 ${showTrend ? "bg-red-400 text-white" : "bg-gray-300"}`}
                    onClick={() => setShowTrend(!showTrend)}
                >
                    Trend
                    <Icons.info className="w-4 h-4 text-white" />
                </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                Indicateur de variation du prix jour par jour.
                </TooltipContent>
            </Tooltip>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0"> 
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: isMobile ? "2-digit" : undefined,
                  })
                }
              />
              <YAxis allowDecimals domain={yDomain} tickFormatter={(v) => `€${v}`} />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  padding: "8px 12px",
                  fontSize: isMobile ? 10 : 12,
                }}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("fr-FR")
                }
                formatter={(value: number) => `€${value.toFixed(2)}`}
              />


              {/* Prix réel */}
              <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#6366F1" 
                  strokeWidth={2} 
                  // Utilisation de CustomDot pour la tendance jour/jour
                  dot={showTrend ? (props) => <CustomDot {...props} data={filteredData} /> : { r: isMobile ? 2 : 3 }} 
              />
              
              {/* Moyenne mobile */}
              {showMA && <Line type="monotone" data={ma30} dataKey="price" stroke="#EC4899" strokeWidth={2} dot={false} name="MA30" />}
              
              {/* Bollinger Bands */}
              {showBB && bollinger.length > 0 && (
                <>
                  <Line type="monotone" data={bollinger} dataKey="upper" stroke="#34D399" dot={false} strokeDasharray="5 5" name="Bande Supérieure"/>
                  <Line type="monotone" data={bollinger} dataKey="mid" stroke="#FBBF24" dot={false} strokeDasharray="3 3" name="Bande Médiane"/>
                  <Line type="monotone" data={bollinger} dataKey="lower" stroke="#F87171" dot={false} strokeDasharray="5 5" name="Bande Inférieure"/>
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Amélioration de la fermeture du Modal (icône standard) */}
        <DialogClose className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition p-1 rounded hover:bg-gray-100">
          <Icons.close className="h-6 w-6" />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}