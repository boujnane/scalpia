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
} from "recharts";
import { Item } from "@/lib/analyse/types";
import { buildChartData } from "@/lib/analyse/buildChartData";

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider"; // Shadcn Slider

// Palette de couleurs distinctes
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

  // Calculer les bornes globales des dates
  const allDates = useMemo(() => {
    const dates = items.flatMap(i => buildChartData(i).map(p => p.date));
    return { min: Math.min(...dates), max: Math.max(...dates) };
  }, [items]);

  const [dateRange, setDateRange] = useState<{ start: number; end: number }>({
    start: allDates.min,
    end: allDates.max,
  });

  return (
    <div className="w-full p-4 border rounded-lg bg-white shadow space-y-4">
      {/* Toggle Normalisation */}
      <Button
        variant="outline"
        onClick={() => setNormalize(!normalize)}
      >
        {normalize ? "Afficher Prix Réels" : "Normaliser (Base 100)"}
      </Button>

      {/* Popover pour sélectionner les séries */}
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

      {/* Slider de sélection des dates */}
      <div className="flex flex-col gap-2">
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

      {/* Graphique */}
      <div className="w-full h-[500px] md:h-[600px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart margin={{ top: 10, right: 40, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={[dateRange.start, dateRange.end]}
              tickFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")}
            />

            <YAxis allowDecimals />

            <RechartsTooltip
              labelFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")}
              formatter={(v: number) =>
                normalize ? `${v.toFixed(1)} index` : `€${v.toFixed(2)}`
              }
            />

            <Legend
              wrapperStyle={{ maxHeight: 500, overflowY: "auto" }}
              verticalAlign="top"
              align="left"
              layout="vertical"
            />

            {items.map((item, idx) => {
              if (!visibleSeries[item.name]) return null;

              const data = buildChartData(item)
                .filter(p => p.date >= dateRange.start && p.date <= dateRange.end);

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
                  stroke={palette[idx % palette.length]}
                  strokeOpacity={0.8}
                  dot={false}
                  activeDot={{ r: 4 }}
                  strokeDasharray={idx % 2 === 0 ? "5 2" : undefined} // différencier visuellement
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
