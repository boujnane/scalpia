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
  ReferenceDot,
} from "recharts";
import { Icons } from "@/components/icons";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Item } from "@/lib/analyse/types";

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
  const [timeFrame, setTimeFrame] = useState<{ start: Date; end: Date }>({
    start: new Date(chartData[0].date),
    end: new Date(chartData[chartData.length - 1].date),
  });

  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  const setLastNDays = (days: number) => {
    const end = new Date(chartData[chartData.length - 1].date);
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    setTimeFrame({ start, end });
  };

  // Filtrage des données
  const filteredData = useMemo(
    () => chartData.filter(d => d.date >= timeFrame.start.getTime() && d.date <= timeFrame.end.getTime()),
    [chartData, timeFrame]
  );

  // Moyenne mobile 30 jours
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

  // Bollinger Bands (20 jours, 2 écarts-types)
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

  // Trend dots
  const trendDots = useMemo(() => {
    const windowSize = 3;
    if (filteredData.length <= windowSize) return [];
    return filteredData.slice(windowSize).map((p, i) => {
      const prev = filteredData[i]; // i décalé
      return {
        date: p.date,
        price: p.price,
        slope: p.price - prev.price,
      };
    });
  }, [filteredData]);

  // Axe Y dynamique
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
        className={`w-full max-w-4xl ${isMobile ? "h-[60vh]" : "h-[500px]"} flex flex-col p-4`}
        showCloseButton={false}
      >
        <DialogTitle className="mb-4 text-lg font-semibold">{item.name}</DialogTitle>

        {/* Boutons de timeframe */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
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
                  : setTimeFrame({ start: new Date(chartData[0].date), end: new Date(chartData[chartData.length - 1].date) })
              }
              className="flex-shrink-0 px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Boutons pour afficher/cacher indicateurs */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
        {/* MA30 */}
            <Tooltip>
                <TooltipTrigger asChild>
                <button
                    className={`px-3 py-1 rounded flex items-center gap-1 ${showMA ? "bg-pink-400 text-white" : "bg-gray-200"}`}
                    onClick={() => setShowMA(!showMA)}
                >
                    MA30
                    <Icons.info className="w-4 h-4 text-white" />
                </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                Moyenne mobile (MA) sur 30 jours. Cet indicateur lisse le bruit des variations de prix journalières pour déterminer la tendance générale à court/moyen terme. Si la ligne monte, la tendance est haussière.
                </TooltipContent>
            </Tooltip>

            {/* Bollinger */}
            <Tooltip>
                <TooltipTrigger asChild>
                <button
                    className={`px-3 py-1 rounded flex items-center gap-1 ${showBB ? "bg-green-400 text-white" : "bg-gray-200"}`}
                    onClick={() => setShowBB(!showBB)}
                >
                    Bollinger
                    <Icons.info className="w-4 h-4 text-white" />
                </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                Elles mesurent la volatilité du prix. Lorsque le prix touche la bande supérieure, l'objet peut être suracheté. Lorsqu'il touche la bande inférieure, il peut être sous-vendu.
                </TooltipContent>
            </Tooltip>

            {/* Trend */}
            <Tooltip>
                <TooltipTrigger asChild>
                <button
                    className={`px-3 py-1 rounded flex items-center gap-1 ${showTrend ? "bg-red-400 text-white" : "bg-gray-200"}`}
                    onClick={() => setShowTrend(!showTrend)}
                >
                    Trend
                    <Icons.info className="w-4 h-4 text-white" />
                </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-sm">
                Cet indicateur très visuel montre la variation du prix par rapport à la clôture du jour précédent.
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
                labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR")}
                formatter={(value: number) => `€${value.toFixed(2)}`}
              />

              {/* Prix réel */}
              <Line type="monotone" dataKey="price" stroke="#6366F1" strokeWidth={1} dot={showTrend ? false : { r: isMobile ? 2 : 3 }} />
              

              {/* Moyenne mobile */}
              {showMA && <Line type="monotone" data={ma30} dataKey="price" stroke="#EC4899" strokeWidth={2} dot={false} name="MA30" />}

              {/* Bollinger Bands */}
              {showBB && bollinger.length > 0 && (
                <>
                  <Line type="monotone" data={bollinger} dataKey="upper" stroke="#34D399" dot={false} strokeDasharray="5 5"/>
                  <Line type="monotone" data={bollinger} dataKey="mid" stroke="#FBBF24" dot={false} strokeDasharray="3 3"/>
                  <Line type="monotone" data={bollinger} dataKey="lower" stroke="#F87171" dot={false} strokeDasharray="5 5"/>
                </>
              )}

              {/* Trend dots */}
              {showTrend && filteredData.map((p, idx) => {
                if (idx === 0) return null;
                const slope = p.price - filteredData[idx - 1].price;
                return (
                    <ReferenceDot
                    key={idx}
                    x={p.date}
                    y={p.price}
                    r={4}
                    fill={slope > 0 ? "green" : "red"}
                    stroke="#000"
                    strokeWidth={1}
                    />
                );
                })}

            </LineChart>
          </ResponsiveContainer>
        </div>

        <DialogClose className="absolute top-2 right-2 px-2 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition">
          Fermer
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
