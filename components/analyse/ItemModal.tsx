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
  const [timeFrame, setTimeFrame] = useState<{
    start: Date;
    end: Date;
  }>({
    start: new Date(chartData[0].date),
    end: new Date(chartData[chartData.length - 1].date),
  });

  const setLastNDays = (days: number) => {
    const end = new Date(chartData[chartData.length - 1].date);
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    setTimeFrame({ start, end });
  };

  // Filtrage des données
  const filteredData = useMemo(
    () =>
      chartData.filter(
        (d) =>
          d.date >= timeFrame.start.getTime() &&
          d.date <= timeFrame.end.getTime()
      ),
    [chartData, timeFrame]
  );

  // Axe Y dynamique mais arrondi
  const yDomain = useMemo(() => {
    if (filteredData.length === 0) return [0, 100];
    const min = Math.floor(Math.min(...filteredData.map(d => d.price)) / 10) * 10;
    const max = Math.ceil(Math.max(...filteredData.map(d => d.price)) / 10) * 10;
    return [min, max];
  }, [filteredData]);

  // Détection mobile
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 768 : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-full max-w-4xl ${isMobile ? "h-[60vh]" : "h-[500px]"} flex flex-col p-4`}
        showCloseButton={false}
      >
        <DialogTitle className="mb-4 text-lg font-semibold">{item.name}</DialogTitle>

        {/* Buttons filtrants scrollable sur mobile */}
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
                  : setTimeFrame({
                      start: new Date(chartData[0].date),
                      end: new Date(chartData[chartData.length - 1].date),
                    })
              }
              className="flex-shrink-0 px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
            >
              {label}
            </button>
          ))}
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
                tick={({ x, y, payload }) => {
                  const date = new Date(payload.value);
                  const formatted = new Intl.DateTimeFormat("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: isMobile ? "2-digit" : undefined,
                  }).format(date);

                  return (
                    <text
                      key={`tick-${payload.value}`}
                      x={x}
                      y={y + 10}
                      textAnchor={isMobile ? "end" : "middle"}
                      fontSize={isMobile ? 10 : 12}
                      fill="#4B5563"
                      transform={isMobile ? `rotate(-30, ${x}, ${y + 10})` : undefined}
                    >
                      {formatted}
                    </text>
                  );
                }}
              />

              <YAxis allowDecimals domain={yDomain} tickFormatter={(v) => `€${v}`} />

              <RechartsTooltip
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("fr-FR")
                }
                formatter={(value: number) => `€${value.toFixed(2)}`}
              />

              <Line
                type="monotone"
                dataKey="price"
                stroke="#6366F1"
                strokeWidth={2}
                dot={{ r: isMobile ? 2 : 3 }}
              />
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
