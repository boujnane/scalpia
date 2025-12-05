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
import { useIsMobile } from "@/lib/utils";
import { buildChartData } from "@/lib/analyse/buildChartData";

const palette = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#F87171", "#22D3EE", "#FBBF24", "#4ADE80", "#A78BFA", "#F472B6",
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

  const chartRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((item, i) => {
      map[item.name] = palette[i % palette.length];
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

  // initial dateRange
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
    return [Math.floor(Math.min(...allY) / 10) * 10, Math.ceil(Math.max(...allY) / 10) * 10];
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

  // Handlers pour zoom rectangle
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

    if (endX - startX < 10) return; // minimum drag distance

    // conversion pixels -> timestamp
    const [chartStart, chartEnd] = xDomain;
    const width = rect.width;
    const startTimestamp = chartStart + ((startX / width) * (chartEnd - chartStart));
    const endTimestamp = chartStart + ((endX / width) * (chartEnd - chartStart));

    setDateRange({ start: startTimestamp, end: endTimestamp });
  };

  const resetZoom = () => setDateRange({ start: allDates.min, end: allDates.max });

  return (
    <div className="w-full p-4 border rounded-lg bg-white shadow space-y-4">

      {/* Sélection des séries */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Sélectionner les séries</Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 max-h-64 overflow-auto">
          <div className="flex flex-col gap-2">
            {items.map(item => (
              <label key={item.name} className="flex items-center gap-2">
                <Checkbox
                  checked={visibleSeries[item.name]}
                  onCheckedChange={() =>
                    setVisibleSeries(prev => ({ ...prev, [item.name]: !prev[item.name] }))
                  }
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <Button onClick={resetZoom} variant="outline" className="mb-2">Reset Zoom</Button>

      {/* Graphique */}
      <div
        ref={chartRef}
        className="w-full h-[500px] md:h-[600px] relative select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
      >
        {/* Rectangle de sélection */}
        {isSelecting && (
          <div
            className="absolute top-0 bottom-0 bg-blue-400/30 pointer-events-none"
            style={{
              left: Math.min(selectionStartX, selectionEndX),
              width: Math.abs(selectionEndX - selectionStartX),
            }}
          />
        )}

        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 15, right: isMobile ? 0 : 40, left: isMobile ? -40 : 0, bottom: 50 }}>
            <CartesianGrid strokeDasharray="3 3" />

            {yearMarkers.map(y => (
              <ReferenceLine
                key={`year-${y}`}
                x={y}
                stroke="#d1d5db"
                strokeDasharray="3 3"
                label={{
                  value: new Date(y).getFullYear(),
                  position: "top",
                  fill: "#6b7280",
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
                return <text x={x} y={y + 10} textAnchor={isMobile ? "end" : "middle"} fill="#4B5563" fontSize={isMobile ? 10 : 12} transform={isMobile ? `rotate(-30, ${x}, ${y + 10})` : undefined}>{formatted}</text>;
              }}
            />

            <YAxis allowDecimals={false} domain={yDomain} tickFormatter={v => `€${v}`} />

            <RechartsTooltip
              labelFormatter={d => new Date(d).toLocaleDateString("fr-FR")}
              formatter={(v: number) => `€${v.toFixed(2)}`}
            />

            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              wrapperStyle={{ fontSize: isMobile ? "0.45rem" : "0.8rem", maxHeight: 50, overflowY: "auto" }}
            />

            {filteredData.map(({ item, data }) => (
              <Line
                key={item.name}
                data={data}
                dataKey="price"
                name={item.name}
                type="monotone"
                strokeWidth={2}
                stroke={colorMap[item.name]}
                strokeOpacity={0.8}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Slider dates */}
      <div className="mb-4 flex flex-col gap-2">
        <span className="text-sm text-gray-600">
          Plage de dates : {new Date(currentDateRange.start).toLocaleDateString()} - {new Date(currentDateRange.end).toLocaleDateString()}
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
