import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarProps
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export interface SeriesSummary {
  seriesName: string;
  averageVariation: number;
  minPrice: number;
  maxPrice: number;
  trend: "up" | "down" | "stable";
  coverageIndex: number;
}

// Typage pour la fonction shape
type CustomBarProps = BarProps & { payload: SeriesSummary };

export const SeriesTrendChart = ({ data }: { data: SeriesSummary[] }) => {
  const sortedData = [...data].sort((a, b) => b.averageVariation - a.averageVariation);
  const chartHeight = Math.min(sortedData.length * 40, 600);

  // Fonction shape : toujours retourne un ReactElement
  const renderCustomBar = (props: any) => {
    const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  
    const color =
      payload?.trend === "up"
        ? "var(--color-success)"
        : payload?.trend === "down"
        ? "var(--color-destructive)"
        : "var(--color-primary)";
  
    // Toujours retourner un ReactElement
    return <rect x={x} y={y} width={width} height={height} fill={color} />;
  };

  // Formatter pour LabelList / Tooltip : gère undefined
  const formatValue = (value?: number) => `${((value ?? 0) * 100).toFixed(1)}%`;
  const tooltipFormatter = (value?: number) => [formatValue(value), "Variation Moyenne"] as [string, string];

  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props;
  
    if (value == null) return null;
  
    return (
      <text
        x={x + width + 6}
        y={y + 14}
        fontSize={12}
        fill="var(--color-foreground)"
        textAnchor="start"
      >
        {(value * 100).toFixed(1)}%
      </text>
    );
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse de la Tendance des Variations</CardTitle>
        <CardDescription>
          Comparaison visuelle de la variation pondérée par série (%).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 180, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="averageVariation"
                tickFormatter={formatValue}
                domain={["dataMin - 0.05", "dataMax + 0.05"]}
              />
              <YAxis
                type="category"
                dataKey="seriesName"
                width={180}
                tick={{ fontSize: 12 }}
                tickFormatter={(name: string) => (name.length > 25 ? name.slice(0, 22) + "…" : name)}
              />
              <Tooltip formatter={tooltipFormatter} cursor={{ fill: "rgba(0,0,0,0.05)" }} />
              <Bar
                dataKey="averageVariation"
                shape={renderCustomBar}
                background={{ fill: "var(--color-secondary)" }}
              >
                  <LabelList content={CustomLabel} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
