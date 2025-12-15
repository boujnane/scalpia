"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  histogram: { min: number; max: number; count: number }[];
  soldItems?: { price: string }[]; // on ne garde que price ici
}

export default function HistogramWithStats({ histogram, soldItems }: Props) {
  const data = histogram.map((b) => ({
    range: `${b.min} - ${b.max}`,
    count: b.count,
  }));

  const totalItems = histogram.reduce((sum, b) => sum + b.count, 0);
  const averagePrice =
    histogram.reduce(
      (sum, b) => sum + ((b.min + b.max) / 2) * b.count,
      0
    ) / totalItems;

  // --- calcul du prix moyen des 12 dernières ventes ---
  let last12AveragePrice: number | null = null;
  if (soldItems && soldItems.length > 0) {
    const prices = soldItems
      .slice(0, 12)
      .map((item) =>
        Number(item.price.replace(/[^0-9.,]/g, "").replace(",", "."))
      )
      .filter((p) => !isNaN(p));
    if (prices.length > 0) {
      last12AveragePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    }
  }

  return (
    <div>
      <div style={{ width: "100%", height: 400 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 30, bottom: 50, left: 40 }}>
            <XAxis
              dataKey="range"
              angle={-45}
              textAnchor="end"
              interval={0}
              height={60}
              label={{ value: "Intervalle de prix", position: "bottom", offset: 20 }}
            />
            <YAxis
              label={{ value: "Nombre d’articles", angle: -90, position: "insideLeft", offset: 10 }}
            />
            <Tooltip
              formatter={(value?: number) => [`${value}`, "Articles"]}
            />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-sm">
        <p>
          Total d’articles : <strong>{totalItems}</strong>
        </p>
        <p>
          Prix moyen approximatif : <strong>{averagePrice.toFixed(2)} €</strong>
        </p>
        {last12AveragePrice !== null && (
          <p>
            Prix moyen des 12 dernières ventes :{" "}
            <strong>{last12AveragePrice.toFixed(2)} €</strong>
          </p>
        )}
      </div>
    </div>
  );
}
