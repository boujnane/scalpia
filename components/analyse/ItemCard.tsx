"use client";

import { useState } from "react";
import { Item } from "@/lib/analyse/types";
import { Badge } from "@/components/ui/badge";
import { buildChartData } from "@/lib/analyse/buildChartData";
import ItemModal from "./ItemModal";

export default function ItemCard({ item }: { item: Item }) {
  const [open, setOpen] = useState(false);

  const chartData = buildChartData(item);

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="border rounded-lg shadow-lg bg-white overflow-hidden hover:shadow-xl transition cursor-pointer p-4 flex flex-col items-center"
      >
        {/* image */}
        <div className="w-full h-40 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden mb-4">
          {item.image && (
            <img
              src={item.image}
              alt={item.name}
              className="max-h-full max-w-full object-contain hover:scale-105 transition-transform"
            />
          )}
        </div>

        {/* name */}
        <span className="font-semibold text-center">{item.name}</span>

        {/* release date */}
        <Badge variant="secondary" className="mt-2">
          {item.releaseDate}
        </Badge>
      </div>

      {/* Modal */}
      <ItemModal item={item} chartData={chartData} open={open} onOpenChange={setOpen} />
    </>
  );
}
