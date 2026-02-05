"use client";

import { useState, useMemo, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Item } from "@/lib/analyse/types";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/useIsMobile";
import { buildChartData } from "@/lib/analyse/buildChartData";
import { Icons } from "../icons";

// Utilisation des variables du thème (chart-1 à chart-5) puis de couleurs solides
const themePalette = [
  "var(--color-chart-1)", // Vert
  "var(--color-chart-2)", // Rouge
  "var(--color-chart-3)", // Bleu
  "var(--color-chart-4)", // Jaune
  "var(--color-chart-5)", // Violet
  "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#F87171", "#22D3EE", "#FBBF24", "#4ADE80", "#A78BFA", 
  "#34D399", "#60A5FA"
];

export default function BlocChart({ items }: { items: Item[] }) {
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map(i => [i.name, true]))
  );
  const [dateRange, setDateRange] = useState<{ start: number; end: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartX, setSelectionStartX] = useState(0);
  const [selectionEndX, setSelectionEndX] = useState(0);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);

  const chartRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((item, i) => {
      map[item.name] = themePalette[i % themePalette.length];
    });
    return map;
  }, [items]);

  const allDates = useMemo(() => {
    const dates = items.flatMap(i => buildChartData(i).map(p => p.date));
    return {
      min: dates.length ? Math.min(...dates) : Date.now(),
      max: dates.length ? Math.max(...dates) : Date.now(),
    };
  }, [items]);

  const currentDateRange = dateRange ?? { start: allDates.min, end: allDates.max };

  const filteredData = useMemo(() => {
    return items
      .filter(item => visibleSeries[item.name])
      .map(item => ({
        item,
        data: buildChartData(item).filter(p => p.date >= currentDateRange.start && p.date <= currentDateRange.end),
      }))
      .filter(({ data }) => data.length > 0);
  }, [items, visibleSeries, currentDateRange]);

  const xDomain = useMemo(() => {
    const allX = filteredData.flatMap(d => d.data.map(p => p.date));
    return allX.length ? [Math.min(...allX), Math.max(...allX)] : [currentDateRange.start, currentDateRange.end];
  }, [filteredData, currentDateRange]);

  const yDomain = useMemo(() => {
    const allY = filteredData.flatMap(d => d.data.map(p => p.price));
    if (!allY.length) return [0, 100];
    const min = Math.floor(Math.min(...allY) / 10) * 10;
    const max = Math.ceil(Math.max(...allY) / 10) * 10;
    return [min, max];
  }, [filteredData]);

  const yearMarkers = useMemo(() => {
    const startYear = new Date(xDomain[0]).getFullYear();
    const endYear = new Date(xDomain[1]).getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(new Date(y, 0, 1).getTime());
    }
    return years;
  }, [xDomain]);

  // Handlers pour zoom rectangle (inchangé, fonctionne bien)
  const onMouseDown = (e: React.MouseEvent) => {
    if (!chartRef.current) return;
    setIsSelecting(true);
    const rect = chartRef.current.getBoundingClientRect();
    setSelectionStartX(e.clientX - rect.left);
    setSelectionEndX(e.clientX - rect.left);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isSelecting || !chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    setSelectionEndX(e.clientX - rect.left);
  };

  const onMouseUp = () => {
    if (!isSelecting || !chartRef.current) return;
    setIsSelecting(false);

    const rect = chartRef.current.getBoundingClientRect();
    const startX = Math.min(selectionStartX, selectionEndX);
    const endX = Math.max(selectionStartX, selectionEndX);

    if (endX - startX < 10) return;

    const [chartStart, chartEnd] = xDomain;
    const width = rect.width;
    const startTimestamp = chartStart + ((startX / width) * (chartEnd - chartStart));
    const endTimestamp = chartStart + ((endX / width) * (chartEnd - chartStart));

    setDateRange({ start: startTimestamp, end: endTimestamp });
  };

  const resetZoom = () => setDateRange({ start: allDates.min, end: allDates.max });

  return (
    <div className="w-full p-4 border border-border rounded-xl bg-card shadow space-y-4">

      {/* Contrôles du graphique */}
      <div className="flex flex-wrap gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="text-primary font-medium border-primary/50 hover:bg-primary/5">
              <Icons.check className="w-4 h-4 mr-2"/> Sélectionner les séries
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 max-h-64 overflow-auto bg-popover border border-border shadow-lg">
            <p className="text-sm font-semibold mb-2">Items visibles :</p>
            <div className="flex flex-col gap-2">
              {items.map(item => (
                <label key={item.name} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={visibleSeries[item.name]}
                    onCheckedChange={() =>
                      setVisibleSeries(prev => ({ ...prev, [item.name]: !prev[item.name] }))
                    }
                    style={{ borderColor: colorMap[item.name], backgroundColor: visibleSeries[item.name] ? colorMap[item.name] : 'transparent' }}
                  />
                  <span className="truncate">{item.name}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={resetZoom} variant="outline" className="text-muted-foreground hover:bg-secondary/50">
            <Icons.refresh className="w-4 h-4 mr-2"/>
            Réinitialiser le Zoom
        </Button>
      </div>

      {/* Graphique */}
      <div
        ref={chartRef}
        className="w-full h-[500px] md:h-[600px] relative select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {/* Rectangle de sélection (Couleur primaire du thème) */}
        {isSelecting && (
          <div
            className="absolute top-0 bottom-0 bg-primary/30 pointer-events-none"
            style={{
              left: Math.min(selectionStartX, selectionEndX),
              width: Math.abs(selectionEndX - selectionStartX),
            }}
          />
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 15, right: isMobile ? 0 : 40, left: isMobile ? -40 : 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />

            {/* Références de l'année (Utilise muted-foreground) */}
            {yearMarkers.map(y => (
              <ReferenceLine
                key={`year-${y}`}
                x={y}
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                label={{
                  value: new Date(y).getFullYear(),
                  position: "top",
                  fill: "var(--color-muted-foreground)",
                  fontSize: isMobile ? 10 : 12,
                  offset: 5,
                }}
              />
            ))}

            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={xDomain}
              interval="preserveStartEnd"
              tick={({ x, y, payload }) => {
                const date = new Date(payload.value);
                const formatted = isMobile
                  ? date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })
                  : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
                return <text x={x} y={y + 10} textAnchor={isMobile ? "end" : "middle"} fill="var(--color-muted-foreground)" fontSize={isMobile ? 10 : 12} transform={isMobile ? `rotate(-30, ${x}, ${y + 10})` : undefined}>{formatted}</text>;
              }}
            />

            <YAxis 
                allowDecimals={false} 
                domain={yDomain} 
                tickFormatter={v => `€${v}`} 
                fill="var(--color-muted-foreground)"
            />

            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;

                return (
                  <div className="p-2 rounded shadow border bg-popover border-border">
                    <div className="text-sm mb-1 text-muted-foreground">
                      {label ? new Date(label).toLocaleDateString("fr-FR") : ""}
                    </div>
                    {payload.map((entry, index) => {
                      const isSelected = selectedSeries === null || selectedSeries === entry.name;
                      return (
                        <div
                          key={index}
                          style={{
                            color: isSelected ? colorMap[entry.name] : "#aaa",
                            fontWeight: selectedSeries === entry.name ? "bold" : "normal",
                            fontSize: "12px",
                            marginBottom: 2,
                          }}
                        >
                          {entry.name}: €{entry.value?.toFixed(2) ?? "0.00"}
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            />

            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              wrapperStyle={{ fontSize: isMobile ? "0.6rem" : "0.8rem", maxHeight: 70, overflowY: "auto" }}
              formatter={(value, entry) => {
                // Si une série est sélectionnée, atténuer les autres dans la légende
                const isSelected = selectedSeries === null || selectedSeries === value;
                return (
                  <span
                    style={{
                      color: isSelected ? colorMap[value] : "#aaa",
                      cursor: "pointer",
                      fontWeight: selectedSeries === value ? "bold" : "normal",
                    }}
                    onClick={() => setSelectedSeries(prev => (prev === value ? null : value))}
                  >
                    {value}
                  </span>
                );
              }}
            />

            {filteredData.map(({ item, data }) => (
              <Line
                key={item.name}
                data={data}
                dataKey="price"
                name={item.name}
                type="monotone"
                strokeWidth={selectedSeries === item.name ? 4 : 2} // Plus épaisse si sélectionnée
                stroke={colorMap[item.name]}
                strokeOpacity={selectedSeries && selectedSeries !== item.name ? 0.3 : 0.8} // Atténuée si non sélectionnée
                dot={false}
                activeDot={{
                  r: 4,
                  onClick: () =>
                    setSelectedSeries(prev => (prev === item.name ? null : item.name)), // Clique pour sélectionner / désélectionner
                  style: { cursor: "pointer" }
                }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Slider dates */}
      <div className="flex flex-col gap-3 p-2 bg-muted/30 rounded-lg">
        <span className="text-sm text-muted-foreground">
          Plage de dates sélectionnée : <span className="font-mono font-semibold text-foreground">
            {new Date(currentDateRange.start).toLocaleDateString("fr-FR")} - {new Date(currentDateRange.end).toLocaleDateString("fr-FR")}
          </span>
        </span>
        <Slider
          value={[currentDateRange.start, currentDateRange.end]}
          min={allDates.min}
          max={allDates.max}
          step={24 * 60 * 60 * 1000}
          onValueChange={([s, e]) => setDateRange({ start: s, end: e })}
        />
      </div>
    </div>
  );
}