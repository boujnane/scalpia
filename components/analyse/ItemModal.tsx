"use client";

import { useState } from "react";
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

  // Filtrage pour affichage
  const filteredData = chartData.filter(
    (d) =>
      d.date >= timeFrame.start.getTime() &&
      d.date <= timeFrame.end.getTime()
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl h-[500px] flex flex-col">
        <DialogTitle className="mb-4">{item.name}</DialogTitle>

        {/* Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() =>
              setTimeFrame({
                start: new Date(chartData[0].date),
                end: new Date(chartData[chartData.length - 1].date),
              })
            }
            className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
          >
            All
          </button>

          <button
            onClick={() => setLastNDays(30)}
            className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
          >
            1M
          </button>

          <button
            onClick={() => setLastNDays(90)}
            className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
          >
            3M
          </button>

          <button
            onClick={() => setLastNDays(180)}
            className="px-3 py-1 rounded bg-indigo-100 hover:bg-indigo-200 transition"
          >
            6M
          </button>
        </div>

        {/* Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(d) =>
                  new Date(d).toLocaleDateString("fr-FR")
                }
              />

              <YAxis />

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
                dot={{ r: 3 }}
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
