"use client";

import { useState, useMemo } from "react";
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
import { buildChartData } from "@/lib/analyse/buildChartData";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/lib/utils";

const palette = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6",
  "#F87171", "#22D3EE", "#FBBF24", "#4ADE80", "#A78BFA", "#F472B6",
  "#34D399", "#60A5FA"
];

export default function BlocChart({ items }: { items: Item[] }) {
  const [normalize, setNormalize] = useState(false);
  const [visibleSeries, setVisibleSeries] = useState<Record<string, boolean>>(
    Object.fromEntries(items.map((i) => [i.name, true]))
  );
  const isMobile = useIsMobile();

  // Mapping stable des couleurs par item
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    items.forEach((item, i) => {
      map[item.name] = palette[i % palette.length];
    });
    return map;
  }, [items]);

  // Toutes les dates
  const allDates = useMemo(() => {
    const dates = items.flatMap(i => buildChartData(i).map(p => p.date));
    return { min: Math.min(...dates), max: Math.max(...dates) };
  }, [items]);

  const [dateRange, setDateRange] = useState<{ start: number; end: number }>({
    start: allDates.min,
    end: allDates.max,
  });

  // Filtrage selon date et visibilité des séries
  const filteredData = useMemo(() => {
    return items
      .filter(item => visibleSeries[item.name])
      .map(item => ({
        item,
        data: buildChartData(item)
          .filter(p => p.date >= dateRange.start && p.date <= dateRange.end)
      }))
      .filter(({ data }) => data.length > 0);
  }, [items, dateRange, visibleSeries]);

  // Domaine X dynamique
  const xDomain = useMemo(() => {
    const allX = filteredData.flatMap(d => d.data.map(p => p.date));
    if (allX.length === 0) return [dateRange.start, dateRange.end];
    return [Math.min(...allX), Math.max(...allX)];
  }, [filteredData, dateRange]);

  // Domaine Y dynamique
  const yDomain = useMemo(() => {
    const allY = filteredData.flatMap(d => d.data.map(p => p.price));
    if (allY.length === 0) return [0, 100];
    const min = Math.floor(Math.min(...allY) / 10) * 10;
    const max = Math.ceil(Math.max(...allY) / 10) * 10;
    return [min, max];
  }, [filteredData]);

  // Délimiteurs d'années
  const yearMarkers = useMemo(() => {
    const startYear = new Date(xDomain[0]).getFullYear();
    const endYear = new Date(xDomain[1]).getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(new Date(y, 0, 1).getTime());
    }
    return years;
  }, [xDomain]);

  return (
    <div className="w-full p-4 border rounded-lg bg-white shadow space-y-4">
      {/* Toggle normalisation */}
      <Button variant="outline" onClick={() => setNormalize(!normalize)}>
        {normalize ? "Afficher Prix Réels" : "Normaliser (Base 100)"}
      </Button>

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
                    setVisibleSeries(prev => ({
                      ...prev,
                      [item.name]: !prev[item.name],
                    }))
                  }
                />
                <span>{item.name}</span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Graphique */}
      <div className="w-full h-[500px] md:h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            margin={{
              top: 15,
              right: isMobile ? 0 : 40,
              left: isMobile ? -40 : 0,
              bottom: 50,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            {/* Délimiteurs d'années */}
            {yearMarkers.map((y) => (
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
                return (
                  <text
                    key={`tick-${payload.value}`}
                    x={x}
                    y={y + 10}
                    textAnchor={isMobile ? "end" : "middle"}
                    fill="#4B5563"
                    fontSize={isMobile ? 10 : 12}
                    transform={isMobile ? `rotate(-30, ${x}, ${y + 10})` : undefined}
                  >
                    {formatted}
                  </text>
                );
              }}
            />

            <YAxis
              allowDecimals={false}
              domain={yDomain}
              tickFormatter={(v) => `€${v}`}
            />

            <RechartsTooltip
              labelFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")}
              formatter={(v: number) =>
                normalize ? `${v.toFixed(1)} index` : `€${v.toFixed(2)}`
              }
            />

            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              wrapperStyle={{ fontSize: isMobile ? "0.45rem" : "0.8rem", maxHeight: 50, overflowY: "auto" }}
            />

            {items[0]?.retailPrice && (
              <ReferenceLine
                y={items[0].retailPrice}
                stroke="red"
                strokeWidth={2} 
                label={{
                  value: `Prix Retail: €${items[0].retailPrice}`,
                  position: "top",
                  fill: "red",
                  fontSize: isMobile ? 10 : 12,
                }}
              />
            )}

            {filteredData.map(({ item, data }) => {
              const normalizedData = normalize
                ? data.map(p => ({ ...p, price: (p.price / data[0].price) * 100 }))
                : data;

              return (
                <Line
                  key={item.name}
                  data={normalizedData}
                  dataKey="price"
                  name={item.name}
                  type="monotone"
                  strokeWidth={2}
                  stroke={colorMap[item.name]}
                  strokeOpacity={0.8}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeDasharray={0}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Slider des dates (en bas) */}
      <div className="mb-4 flex flex-col gap-2">
        <span className="text-sm text-gray-600">
          Plage de dates : {new Date(dateRange.start).toLocaleDateString()} - {new Date(dateRange.end).toLocaleDateString()}
        </span>
        <Slider
          value={[dateRange.start, dateRange.end]}
          min={allDates.min}
          max={allDates.max}
          step={24 * 60 * 60 * 1000} // 1 jour
          onValueChange={(val: [number, number]) => setDateRange({ start: val[0], end: val[1] })}
        />
      </div>
    </div>
  );
}
