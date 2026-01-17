"use client";

import React, { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Target, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface RiskReturnScatterProps {
  series: SeriesFinanceSummary[];
  onSeriesClick?: (series: SeriesFinanceSummary) => void;
  className?: string;
}

interface DataPoint {
  name: string;
  risk: number; // volatility (x-axis)
  return: number; // return 30d (y-axis)
  score: number; // for bubble size
  sharpe: number | null;
  series: SeriesFinanceSummary;
}

export function RiskReturnScatter({ series, onSeriesClick, className }: RiskReturnScatterProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const { data, avgRisk, avgReturn } = useMemo(() => {
    const validSeries = series.filter(
      (s) => s.metrics.vol30d != null && s.metrics.return30d != null
    );

    const dataPoints: DataPoint[] = validSeries.map((s) => ({
      name: s.seriesName,
      risk: (s.metrics.vol30d ?? 0) * 100, // Convert to percentage
      return: (s.metrics.return30d ?? 0) * 100, // Convert to percentage
      score: s.metrics.score ?? 50,
      sharpe: s.metrics.sharpeRatio,
      series: s,
    }));

    const avgRisk = dataPoints.reduce((sum, d) => sum + d.risk, 0) / (dataPoints.length || 1);
    const avgReturn = dataPoints.reduce((sum, d) => sum + d.return, 0) / (dataPoints.length || 1);

    return { data: dataPoints, avgRisk, avgReturn };
  }, [series]);

  // Color based on Sharpe ratio (matching legend colors)
  const getPointColor = (point: DataPoint) => {
    if (point.sharpe == null) return "hsl(var(--muted-foreground))";
    if (point.sharpe > 1) return "#10b981"; // Emerald-500 (Excellent)
    if (point.sharpe > 0.5) return "#34d399"; // Emerald-400
    if (point.sharpe > 0) return "#eab308"; // Yellow-500 (Correct)
    if (point.sharpe > -0.5) return "#f97316"; // Orange-500
    return "#ef4444"; // Red-500 (Faible)
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as DataPoint;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold capitalize text-sm mb-2">{point.name}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Rendement 30j:</span>
              <span className={cn("font-medium", point.return > 0 ? "text-success" : "text-destructive")}>
                {point.return > 0 ? "+" : ""}{point.return.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Volatilité:</span>
              <span className="font-medium">{point.risk.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Sharpe:</span>
              <span className="font-medium">
                {point.sharpe != null ? point.sharpe.toFixed(2) : "N/A"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Score:</span>
              <span className="font-medium">{point.score.toFixed(0)}/100</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Quadrant labels
  const quadrants = [
    { label: "Rendement élevé\nRisque faible", x: 2, y: 8, color: "text-success" },
    { label: "Rendement élevé\nRisque élevé", x: 10, y: 8, color: "text-yellow-500" },
    { label: "Rendement faible\nRisque faible", x: 2, y: -5, color: "text-muted-foreground" },
    { label: "Rendement faible\nRisque élevé", x: 10, y: -5, color: "text-destructive" },
  ];

  return (
    <TooltipProvider>
      <Card className={cn("border-border/50 shadow-sm", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Risque / Rendement
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/50 hover:text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Chaque point représente une série. L'idéal est en haut à gauche
                  (rendement élevé, risque faible). La couleur indique le ratio de Sharpe.
                </p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {data.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-muted-foreground">
              <p className="text-sm">Données insuffisantes</p>
            </div>
          ) : (
            <>
              <div className="h-[280px] -mx-2 text-muted-foreground">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 30, left: 0 }}>
                    <XAxis
                      type="number"
                      dataKey="risk"
                      name="Volatilité"
                      unit="%"
                      domain={[0, "auto"]}
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      tickLine={false}
                      stroke="currentColor"
                      strokeOpacity={0.3}
                      label={{
                        value: "Volatilité 30j (%)",
                        position: "bottom",
                        offset: 10,
                        fontSize: 11,
                        fill: "currentColor",
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="return"
                      name="Rendement"
                      unit="%"
                      domain={["auto", "auto"]}
                      tick={{ fontSize: 10, fill: "currentColor" }}
                      tickLine={false}
                      stroke="currentColor"
                      strokeOpacity={0.3}
                      label={{
                        value: "Rendement 30j (%)",
                        angle: -90,
                        position: "insideLeft",
                        fontSize: 11,
                        fill: "currentColor",
                      }}
                    />
                    <ZAxis type="number" dataKey="score" range={[40, 200]} />

                    {/* Reference lines for averages */}
                    <ReferenceLine
                      x={avgRisk}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                    <ReferenceLine
                      y={avgReturn}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      strokeOpacity={0.4}
                    />
                    <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.2} />

                    <RechartsTooltip content={<CustomTooltip />} />

                    <Scatter
                      data={data}
                      onClick={(data) => onSeriesClick?.(data.series)}
                      cursor="pointer"
                    >
                      {data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getPointColor(entry)}
                          fillOpacity={0.8}
                          stroke={getPointColor(entry)}
                          strokeWidth={1}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-3 border-t border-border/50 text-[11px]">
                <span className="text-muted-foreground font-medium">Ratio de Sharpe :</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-foreground">&gt; 1 (Excellent)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-foreground">0 - 1 (Correct)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-foreground">&lt; 0 (Faible)</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
