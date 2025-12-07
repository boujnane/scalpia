/**
 * BlocSeriesChart Component
 * A functional component for displaying a single line chart representing
 * the global ISCP (Index Synthétique de Stabilité des Prix) for a collection of items.
 * It includes drag-to-zoom functionality and a date range slider.
 */

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
// The following imports are retained even if Checkbox/Popover are not used in this specific file,
// as they are typically part of the component ecosystem/toolkit used.
// import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
// import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/lib/utils";
import { computeISCPForSeriesByFixedWeights } from "@/lib/analyse/iscp";
import { buildChartData } from "@/lib/analyse/buildChartData";

// Define the color palette (single color for the global ISS)
const palette = ["#6366F1"];

// Define the shape of the date range state
interface DateRange {
  start: number;
  end: number;
}

export default function BlocSeriesChart({ items }: { items: Item[] }) {
  const isMobile = useIsMobile();
  const chartRef = useRef<HTMLDivElement | null>(null);

  // --- ISS global for all items in the block ---
  const seriesData = useMemo(() => {
    // Compute the global ISCP by passing all items
    const iss = computeISCPForSeriesByFixedWeights(items, buildChartData);
    return { ISS: iss.ISCPSeries };
  }, [items]);

  // --- Global min/max dates ---
  const allDates = useMemo(() => {
    const dates = Object.values(seriesData).flatMap((d) => d.map((p: { date: any; }) => p.date));
    return {
      min: dates.length ? Math.min(...dates) : Date.now(),
      max: dates.length ? Math.max(...dates) : Date.now(),
    };
  }, [seriesData]);

  const [dateRange, setDateRange] = useState<DateRange | null>({
        start: new Date("2025-11-14").getTime(), // date de début par défaut
        end: new Date().getTime(),   // date de fin par défaut
    });
  
  // Use the local dateRange state or the global range if no zoom is active
  const currentDateRange = dateRange ?? { start: allDates.min, end: allDates.max };

  // --- Data filtering by date range ---
  const filteredData = useMemo(() => {
    return Object.entries(seriesData).map(([name, data]) => ({
      name,
      data: data.filter(
        (p: { date: number; }) => p.date >= currentDateRange.start && p.date <= currentDateRange.end,
      ),
    }));
  }, [seriesData, currentDateRange]);

  // Calculate the domain for the X-axis (date)
  const xDomain = useMemo(() => {
    const allX = filteredData.flatMap((d) => d.data.map((p: { date: any; }) => p.date));
    return allX.length
      ? [Math.min(...allX), Math.max(...allX)]
      : [currentDateRange.start, currentDateRange.end];
  }, [filteredData, currentDateRange]);

  // Calculate the domain for the Y-axis (price/ISCP)
  const yDomain = useMemo(() => {
    const allY = filteredData.flatMap((d) => d.data.map((p: { price: any; }) => p.price));
    if (!allY.length) return [0, 100];
    // Adjust domain to be multiples of 10 for cleaner ticks
    return [Math.floor(Math.min(...allY) / 10) * 10, Math.ceil(Math.max(...allY) / 10) * 10];
  }, [filteredData]);

  // Generate timestamps for year markers to use as ReferenceLines
  const yearMarkers = useMemo(() => {
    const startYear = new Date(xDomain[0]).getFullYear();
    const endYear = new Date(xDomain[1]).getFullYear();
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(new Date(y, 0, 1).getTime());
    }
    return years;
  }, [xDomain]);

  // --- States and handlers for drag-to-zoom feature ---
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStartX, setSelectionStartX] = useState(0);
  const [selectionEndX, setSelectionEndX] = useState(0);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    setIsSelecting(true);
    const rect = chartRef.current.getBoundingClientRect();
    setSelectionStartX(e.clientX - rect.left);
    setSelectionEndX(e.clientX - rect.left);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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

    // Ignore small drags
    if (endX - startX < 10) return;

    const [chartStart, chartEnd] = xDomain;
    const width = rect.width;

    // Calculate the corresponding timestamps for the selection range
    const startTimestamp = chartStart + ((startX / width) * (chartEnd - chartStart));
    const endTimestamp = chartStart + ((endX / width) * (chartEnd - chartStart));

    setDateRange({ start: startTimestamp, end: endTimestamp });
  };

  const resetZoom = () => setDateRange({ start: allDates.min, end: allDates.max });

  return (
    <div className="p-4">
      <Button onClick={resetZoom} variant="outline" className="mb-4">
        Reset Zoom
      </Button>

      {/* Graphique */}
      <div
        ref={chartRef}
        className="w-full h-[500px] md:h-[600px] relative select-none"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        role="presentation"
      >
        {/* Selection Area Overlay for drag-to-zoom */}
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
          <LineChart
            margin={{ top: 15, right: isMobile ? 0 : 40, left: isMobile ? -40 : 0, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" />

            {/* Year Reference Lines */}
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

            {/* X-Axis (Date) */}
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={xDomain}
              interval="preserveStartEnd"
              tick={({ x, y, payload }) => {
                const date = new Date(payload.value);
                // Format date differently for mobile
                const formatted = isMobile
                  ? date.toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "2-digit",
                    })
                  : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
                return (
                  <text
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

            {/* Y-Axis (Price/ISCP) */}
            <YAxis allowDecimals={false} domain={yDomain} tickFormatter={(v) => v.toFixed(2)} />

            {/* Tooltip on hover */}
            <RechartsTooltip
              labelFormatter={(d) => new Date(d).toLocaleDateString("fr-FR")}
              formatter={(v: number) => v.toFixed(2)}
            />

            {/* Legend for series names */}
            <Legend
              verticalAlign="bottom"
              align="center"
              layout="horizontal"
              wrapperStyle={{
                fontSize: isMobile ? "0.45rem" : "0.8rem",
                maxHeight: 50,
                overflowY: "auto",
              }}
            />

            {/* Line for the global ISS series */}
            {filteredData.map(({ name, data }) => (
              <Line
                key={name}
                data={data}
                dataKey="price"
                name={name}
                type="monotone"
                strokeWidth={2}
                stroke={palette[0]}
                strokeOpacity={0.8}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Slider dates for fine-tuning the date range */}
      <div className="mb-4 mt-4 flex flex-col gap-2">
        <span className="text-sm text-gray-600">
          Plage de dates : {new Date(currentDateRange.start).toLocaleDateString()} -{" "}
          {new Date(currentDateRange.end).toLocaleDateString()}
        </span>
        <Slider
          value={[currentDateRange.start, currentDateRange.end]}
          min={allDates.min}
          max={allDates.max}
          // Step set to one day in milliseconds
          step={24 * 60 * 60 * 1000}
          onValueChange={([s, e]) => setDateRange({ start: s, end: e })}
          className="w-full"
        />
      </div>
    </div>
  );
}