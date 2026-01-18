"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Icons } from "@/components/icons"; 
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Item } from "@/lib/analyse/types";
import CustomDot from "./CustomDot";
import { Button } from "@/components/ui/button";

type Point = { date: number; price: number };

export default function ItemModal({
  item,
  chartData,
  open,
  onOpenChange,
  showImage = false,
}: {
  item: Item;
  chartData: Point[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  showImage?: boolean;
}) {
  const initialTimeFrame = chartData.length > 0 ? {
    start: new Date(chartData[0].date),
    end: new Date(chartData[chartData.length - 1].date),
  } : { start: new Date(), end: new Date() };
  
  const [timeFrame, setTimeFrame] = useState<{ start: Date; end: Date }>(initialTimeFrame);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<null | number>(null); // null = All, sinon 30/90/180
  const [showMA, setShowMA] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showTrend, setShowTrend] = useState(true);
  
  const setLastNDays = (days: number | null) => {
    if (chartData.length === 0) return;

    if (days === null) {
      setTimeFrame(initialTimeFrame);
    } else {
      const end = new Date(chartData[chartData.length - 1].date);
      const start = new Date(end);
      start.setDate(end.getDate() - days);
      setTimeFrame({ start, end });
    }

    setSelectedTimeFrame(days); // met à jour le bouton actif
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
        minDate: new Date(filteredData.find(p => p.price === min)?.date || 0).toLocaleDateString("fr-FR"),
        maxDate: new Date(filteredData.find(p => p.price === max)?.date || 0).toLocaleDateString("fr-FR"),
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

  const timeFrameButtonStyle = (isActive: boolean) => (
    isActive 
      ? "flex-shrink-0 px-3 py-1 rounded bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition"
      : "flex-shrink-0 px-3 py-1 rounded bg-muted text-muted-foreground hover:bg-secondary transition"
  );

  const indicatorButtonStyle = (isActive: boolean, colorClass: string) => (
    `px-3 py-1 rounded text-xs font-medium transition-all flex items-center gap-1 uppercase 
    ${isActive ? `${colorClass} text-white shadow-md shadow-current/30` : "bg-muted text-muted-foreground hover:bg-secondary/70"}`
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-4xl ${isMobile ? "h-[85vh]" : "h-[700px]"} flex flex-col p-4 bg-card border-border shadow-2xl`}
        showCloseButton={false}
      >
        <DialogTitle className="mb-2 text-lg font-semibold text-foreground border-b border-border/50 pb-2">
          {item.name}
        </DialogTitle>

        {showImage && item.image && (
          <div className="flex items-center gap-4 border border-border/60 rounded-lg p-3 bg-muted/30">
            <div className="relative h-20 w-20 rounded-md bg-muted/60 border border-border/60 overflow-hidden">
              <Image
                src={item.image}
                alt={item.name}
                fill
                sizes="80px"
                className="object-contain"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <div className="font-semibold text-foreground">{item.type} {item.name}</div>
              <div>{item.bloc} · {item.releaseDate}</div>
            </div>
          </div>
        )}

        {/* Boutons de timeframe */}
        <div className="flex gap-2 mb-2 overflow-x-auto">
          {[
            { label: "All", days: null },
            { label: "1M", days: 30 },
            { label: "3M", days: 90 },
            { label: "6M", days: 180 },
          ].map(({ label, days }) => {
            const isActive = selectedTimeFrame === days;
            return (
              <button
                key={label}
                onClick={() => setLastNDays(days)}
                className={timeFrameButtonStyle(isActive)}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Statistiques Clés */}
        <div className="grid grid-cols-3 gap-4 p-3 border border-border rounded-lg bg-muted/50 mb-2">
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase">Min Prix ({periodStats.minDate})</p>
            <p className="font-bold text-destructive text-lg sm:text-xl">{periodStats.min} €</p>
          </div>
          <div className="text-center border-l border-r border-border">
            <p className="text-xs text-muted-foreground uppercase">Moy. Période</p>
            <p className="font-bold text-foreground text-lg sm:text-xl">{periodStats.avg} €</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase">Max Prix ({periodStats.maxDate})</p>
            <p className="font-bold text-success text-lg sm:text-xl">{periodStats.max} €</p>
          </div>
        </div>

        {/* Boutons indicateurs */}
        <div className="flex gap-2 mb-2 flex-wrap items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={indicatorButtonStyle(showMA, "bg-chart-3")}
                onClick={() => setShowMA(!showMA)}
              >
                MA30
                <Icons.info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm bg-popover border-border text-primary">
              Moyenne mobile (MA) sur 30 jours.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={indicatorButtonStyle(showBB, "bg-chart-4")}
                onClick={() => setShowBB(!showBB)}
              >
                Bollinger
                <Icons.info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm bg-popover border-border text-primary">
              Elles mesurent la volatilité du prix.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className={indicatorButtonStyle(showTrend, "bg-chart-5")}
                onClick={() => setShowTrend(!showTrend)}
              >
                Trend
                <Icons.info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-sm bg-popover border-border text-primary">
              Indicateur de variation du prix jour par jour.
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Chart */}
        <div className="flex-1 min-h-0"> 
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <Legend wrapperStyle={{ color: "var(--color-foreground)", fontSize: isMobile ? "0.6rem" : "0.8rem" }} />

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
                fill="var(--color-muted-foreground)"
              />
              <YAxis 
                allowDecimals 
                domain={yDomain} 
                tickFormatter={(v) => `€${v}`} 
                fill="var(--color-muted-foreground)"
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'var(--color-popover)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius)',
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  padding: "8px 12px",
                  fontSize: isMobile ? 10 : 12,
                  color: 'var(--color-popover-foreground)'
                }}
                labelFormatter={(label) => new Date(label).toLocaleDateString("fr-FR")}
                formatter={(value?: number, name?: string) => [`€${value?.toFixed(2)}`, name]}
              />

              <Line 
                type="monotone" 
                dataKey="price" 
                stroke="var(--color-primary)" 
                strokeWidth={2} 
                dot={showTrend ? (props) => <CustomDot {...props} data={filteredData} /> : { r: isMobile ? 2 : 3 }} 
              />
              
              {showMA && <Line type="monotone" data={ma30} dataKey="price" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} name="MA30" />}
              
              {showBB && bollinger.length > 0 && (
                <>
                  <Line type="monotone" data={bollinger} dataKey="upper" stroke="var(--color-chart-1)" dot={false} strokeDasharray="5 5" name="Bande Supérieure"/>
                  <Line type="monotone" data={bollinger} dataKey="mid" stroke="var(--color-chart-4)" dot={false} strokeDasharray="3 3" name="Bande Médiane"/>
                  <Line type="monotone" data={bollinger} dataKey="lower" stroke="var(--color-chart-2)" dot={false} strokeDasharray="5 5" name="Bande Inférieure"/>
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <DialogClose asChild>
          <Button variant="ghost" className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:bg-secondary">
            <Icons.close className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
