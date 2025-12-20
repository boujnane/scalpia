import React, { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SeriesFinanceSummary } from "@/lib/analyse/finance/series";

interface SeriesTrendChartProps {
  data: SeriesFinanceSummary[];
}

const SERIES_IMAGE_MAP: Record<string, string> = {
  "zenith supreme": "/EB/EB12.5.png",
  "tempete argentee": "/EB/EB12.png",
  "origine perdue": "/EB/EB11.png",
  "astres radieux": "/EB/EB10.png",
  "stars etincelantes": "/EB/EB9.png",
  "poing de fusion": "/EB/EB8.png",
  "celebrations": "/EB/EB7.5.png",
  "evolution celeste": "/EB/EB7.png",
  "regne de glace": "/EB/EB6.png",
  "foudre noire": "/EV/BLK.png",
  "rivalité destinées": "/EV/DRI.png",
  "rivalites destinees": "/EV/DRI.png",
  "aventures ensemble": "/EV/JTG.png",
  "151": "/EV/MEW.png",
  "flammes obsidiennes": "/EV/OBF.png",
  "destinées de paldea": "/EV/PAF.png",
  "destinees de paldea": "/EV/PAF.png",
  "évolutions à paldea": "/EV/PAL.png",
  "evolutions a paldea": "/EV/PAL.png",
  "faille paradoxe": "/EV/PAR.png",
  "évolutions prismatiques": "/EV/PRE.png",
  "evolutions prismatiques": "/EV/PRE.png",
  "couronne stellaire": "/EV/SCR.png",
  "fable nébuleuse": "/EV/SFA.png",
  "fable nebuleuse": "/EV/SFA.png",
  "étincelles déferlantes": "/EV/SSP.png",
  "etincelles deferlantes": "/EV/SSP.png",
  "écarlate et violet": "/EV/SVI.png",
  "ecarlate et violet": "/EV/SVI.png",
  "forces temporelles": "/EV/TEF.png",
  "mascarade crépusculaire": "/EV/TWM.png",
  "mascarade crepusculaire": "/EV/TWM.png",
  "flamme blanche": "/EV/WHT.png",
  "mega evolution": "/MEG/MEG.png",
  "flammes fantasmagoriques": "/MEG/PFL.png",
};

const getSeriesImage = (seriesName: string): string | null => {
  const normalized = seriesName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
  return SERIES_IMAGE_MAP[normalized] || null;
};

export const SeriesTrendChart: React.FC<SeriesTrendChartProps> = ({ data }) => {
  const [activeIndex, setActiveIndex] = useState<number | string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const sortedData = [...data]
    .sort((a, b) => (b.metrics.premiumNow ?? -999) - (a.metrics.premiumNow ?? -999))
    .slice(0, 30);

  const baseHeight = 50;
  const minHeight = 300;
  const maxHeight = 800;
  const calculatedHeight = Math.max(minHeight, Math.min(sortedData.length * baseHeight, maxHeight));

  const handleImageError = (seriesName: string) => {
    setImageErrors((prev) => new Set(prev).add(seriesName));
  };

  const getBarColor = (variation: number) => {
    const CYAN_GREEN = "rgba(0, 180, 150, ";
    const LIME_GREEN = "rgba(100, 220, 100, ";
    const RED = "rgba(239,68,68,";
    const GRAY = "rgba(148,163,184,";

    if (variation > 2) return CYAN_GREEN + "1)";
    if (variation > 1) return CYAN_GREEN + "0.95)";
    if (variation > 0.5) return LIME_GREEN + "0.8)";
    if (variation > 0) return LIME_GREEN + "0.6)";

    if (variation < -0.5) return RED + "1)";
    if (variation < -0.25) return RED + "0.85)";

    return GRAY + "0.7)";
  };

  const formatPct = (value?: number | null) => {
    if (value == null) return "0.0%";
    const formatted = (value * 100).toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const SeriesImage: React.FC<{ seriesName: string; className?: string }> = ({
    seriesName,
    className = "",
  }) => {
    const imagePath = getSeriesImage(seriesName);
    const hasError = imageErrors.has(seriesName);

    if (!imagePath || hasError) {
      return (
        <div className={`flex items-center justify-center bg-muted/30 rounded ${className}`}>
          <ImageOff className="h-4 w-4 text-muted-foreground/50" />
        </div>
      );
    }

    return (
      <img
        src={imagePath}
        alt={seriesName}
        className={`object-contain rounded ${className}`}
        onError={() => handleImageError(seriesName)}
        loading="lazy"
      />
    );
  };

  const CustomLabel: React.FC<any> = (props) => {
    const { x, y, width, height, value, index } = props;
    if (value == null) return null;

    const isActive = activeIndex === index;
    const textX = value >= 0 ? x + width + 8 : x - 8;
    const textAnchor = value >= 0 ? "start" : "end";

    return (
      <text
        x={textX}
        y={y + height / 2}
        dy={4}
        fontSize={isActive ? 14 : 12}
        fontWeight={isActive ? 600 : 500}
        fill="currentColor"
        className={isActive ? "fill-foreground" : "fill-muted-foreground"}
        textAnchor={textAnchor}
      >
        {formatPct(value)}
      </text>
    );
  };

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const row: SeriesFinanceSummary = payload[0].payload;

    const minP = row.minItemPrice;
    const maxP = row.maxItemPrice;


    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 space-y-3 min-w-[360px]">
        <div className="flex items-start gap-3">
          <SeriesImage seriesName={row.seriesName} className="w-32 h-26 shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="font-semibold text-sm capitalize leading-tight">{row.seriesName}</h4>
            <div className="flex items-center gap-2">
              {row.trend7d === "up" ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : row.trend7d === "down" ? (
                <TrendingDown className="h-4 w-4 text-destructive" />
              ) : (
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}

              <Badge
                variant={
                  row.trend7d === "up"
                    ? "success"
                    : row.trend7d === "down"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs"
              >
                {row.trend7d === "up" ? "Hausse (7j)" : row.trend7d === "down" ? "Baisse (7j)" : "Stable (7j)"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Premium actuel</span>
            <span
              className={`font-bold text-sm ${
                (row.metrics.premiumNow ?? 0) > 0
                  ? "text-success"
                  : (row.metrics.premiumNow ?? 0) < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {formatPct(row.metrics.premiumNow)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Retour 7j</span>
            <span className="font-semibold">{row.metrics.return7d == null ? "-" : formatPct(row.metrics.return7d)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Retour 30j</span>
            <span className="font-semibold">{row.metrics.return30d == null ? "-" : formatPct(row.metrics.return30d)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Fourchette (last)</span>
            <span className="font-semibold">
              {minP == null || maxP == null ? "-" : `${minP.toFixed(2)} - ${maxP.toFixed(2)} €`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Coverage 30j</span>
            <Badge
              variant={(row.metrics.coverage30d ?? 0) >= 0.9 ? "default" : "secondary"}
              className={
                (row.metrics.coverage30d ?? 0) < 0.9
                  ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/30"
                  : "bg-success/10 text-success border-success/30"
              }
            >
              {(((row.metrics.coverage30d ?? 0) * 100) || 0).toFixed(0)}%
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Freshness</span>
            <span className="font-semibold">
              {row.metrics.freshnessDays == null ? "-" : `${row.metrics.freshnessDays}j`}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Score</span>
            <span className="font-semibold">{row.metrics.score == null ? "-" : row.metrics.score.toFixed(0)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Points index</span>
            <span className="font-semibold">{row.indexPointsCount}</span>
          </div>
        </div>
      </div>
    );
  };

  const CustomYAxisTick: React.FC<any> = (props) => {
    const { x, y, payload, index } = props;
    const isActive = activeIndex === index;

    const seriesName: string = payload.value;
    const truncated = seriesName.length > 18 ? seriesName.slice(0, 18) + "…" : seriesName;

    const imgPath = getSeriesImage(seriesName);
    const hasError = imageErrors.has(seriesName);

    const ICON_SIZE = 28;
    const ICON_X = x - 190;
    const ICON_Y = y - ICON_SIZE / 2;
    const TEXT_X = x - 150;

    return (
      <g>
        {imgPath && !hasError ? (
          <image
            href={imgPath}
            x={ICON_X}
            y={ICON_Y}
            width={ICON_SIZE}
            height={ICON_SIZE}
            preserveAspectRatio="xMidYMid meet"
            onError={() => handleImageError(seriesName)}
          />
        ) : (
          <rect x={ICON_X} y={ICON_Y} width={ICON_SIZE} height={ICON_SIZE} rx={6} ry={6} fill="rgba(148,163,184,0.25)" />
        )}

        <text
          x={TEXT_X}
          y={y}
          dy={4}
          textAnchor="start"
          fontSize={isActive ? 13 : 11}
          fontWeight={isActive ? 600 : 400}
          className={isActive ? "fill-foreground" : "fill-muted-foreground"}
          style={{ transition: "all 0.2s ease" }}
        >
          {truncated}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full">
      <div className="hidden md:block" style={{ width: "100%", height: calculatedHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 20, right: 80, left: 210, bottom: 20 }}
            onMouseMove={(state) => setActiveIndex(state.isTooltipActive ? state.activeTooltipIndex ?? null : null)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="stroke-border/30"
              horizontal
              vertical
            />

            <XAxis
              type="number"
              dataKey={(d: SeriesFinanceSummary) => d.metrics.premiumNow ?? 0}
              tickFormatter={(v) => formatPct(v)}
              domain={["dataMin - 0.05", "dataMax + 0.05"]}
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="fill-muted-foreground"
              stroke="currentColor"
            />

            <YAxis
              type="category"
              dataKey="seriesName"
              width={200}
              tick={<CustomYAxisTick />}
              interval={0}
              tickMargin={10}
              stroke="currentColor"
            />

            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />

            <Bar
              dataKey={(d: SeriesFinanceSummary) => d.metrics.premiumNow ?? 0}
              background={{ fill: "var(--color-secondary)", opacity: 0.3 }}
              radius={[0, 4, 4, 0]}
            >
              {sortedData.map((entry, idx) => (
                <Cell
                  key={`cell-${idx}`}
                  fill={getBarColor(entry.metrics.premiumNow ?? 0)}
                  style={{
                    transition: "all 0.2s ease",
                    filter: activeIndex === idx ? "brightness(1.1)" : "none",
                  }}
                />
              ))}
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
