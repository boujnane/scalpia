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
  BarProps,
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, Minus, ImageOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface SeriesSummary {
  seriesName: string;
  averageVariation: number;
  minPrice: number;
  maxPrice: number;
  
  // Trends
  longTermTrend: "up" | "down" | "stable";      // Trend globale (tout l'historique)
  shortTermTrend?: "up" | "down" | "stable";    // Trend récente (7 derniers jours)
  
  // Métadonnées
  coverageIndex: number;
  shortTermVariation?: number;  // % variation sur 7j
  hasRecentData?: boolean;      // True si on a des données < 7j
}

type CustomBarProps = BarProps & { payload: SeriesSummary };

interface SeriesTrendChartProps {
  data: SeriesSummary[];
}

// Table de correspondance des séries vers les images
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
  "flammes fantasmagoriques": "/MEG/PFL.png"
};

// Fonction utilitaire pour obtenir l'image d'une série
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
  .sort((a, b) => b.averageVariation - a.averageVariation)
  .slice(0, 30);
  
  const baseHeight = 50;
  const minHeight = 300;
  const maxHeight = 800;
  const calculatedHeight = Math.max(minHeight, Math.min(sortedData.length * baseHeight, maxHeight));

  const handleImageError = (seriesName: string) => {
    setImageErrors(prev => new Set(prev).add(seriesName));
  };

  const getBarColor = (variation: number) => {
    // Vert-Bleu (Cyan / Turquoise) pour les fortes hausses
    const CYAN_GREEN = "rgba(0, 180, 150, "; // Teinte verte/bleue pour un contraste différent

    // Vert standard pour les hausses faibles
    const LIME_GREEN = "rgba(100, 220, 100, "; // Teinte plus jaune/lime pour un contraste différent

    // Rouge
    const RED = "rgba(239,68,68,";

    // Gris/Stable
    const GRAY = "rgba(148,163,184,"; 
    
    // Niveaux de Vert (contrastés)
    if (variation > 2) return CYAN_GREEN + "1)";      // +200% ou plus (Cyan Opaque)
    if (variation > 1) return CYAN_GREEN + "0.95)";    // +100% (Cyan Très Opaque)
    if (variation > 0.5) return LIME_GREEN + "0.8)"; // +50% (Vert Lime Opaque)
    if (variation > 0) return LIME_GREEN + "0.6)";   // +0% (Vert Lime Lisible)

    // Niveaux de Rouge (inchangés mais avec la variable RED)
    if (variation < -0.5) return RED + "1)"; // -50% ou plus (Rouge Opaque)
    if (variation < -0.25) return RED + "0.85)"; // -25% (Rouge Opaque)

    // Stable
    return GRAY + "0.7)"; // Stable (Gris, opacité de 70%)
};
  

  const formatValue = (value?: number) => {
    if (value == null) return "0.0%";
    const formatted = (value * 100).toFixed(1);
    return value > 0 ? `+${formatted}%` : `${formatted}%`;
  };

  const SeriesImage: React.FC<{ seriesName: string; className?: string }> = ({ seriesName, className = "" }) => {
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
        {formatValue(value)}
      </text>
    );
  };

  const CustomTooltip: React.FC<any> = ({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null;

    const data: SeriesSummary = payload[0].payload;
    const getTrendIcon = () => {
      const trendToShow = data.shortTermTrend || data.longTermTrend;
      switch (trendToShow) {
        case "up":
          return <TrendingUp className="h-4 w-4 text-success" />;
        case "down":
          return <TrendingDown className="h-4 w-4 text-destructive" />;
        default:
          return <Minus className="h-4 w-4 text-muted-foreground" />;
      }
    };

    return (
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 space-y-3 min-w-[360px]">
        <div className="flex items-start gap-3">
          <SeriesImage seriesName={data.seriesName} className="w-32 h-26 shrink-0" />
          <div className="space-y-1 flex-1 min-w-0">
            <h4 className="font-semibold text-sm capitalize leading-tight">{data.seriesName}</h4>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <Badge
                variant={
                  data.shortTermTrend === "up"
                    ? "success"
                    : data.shortTermTrend === "down"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs"
              >
                {data.shortTermTrend === "up" 
                  ? "Hausse (7j)" 
                  : data.shortTermTrend === "down" 
                  ? "Baisse (7j)" 
                  : "Stable (7j)"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Variation pondérée</span>
            <span
              className={`font-bold text-sm ${
                data.averageVariation > 0
                  ? "text-success"
                  : data.averageVariation < 0
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {formatValue(data.averageVariation)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Fourchette de prix</span>
            <span className="font-semibold">
              {data.minPrice.toFixed(2)} - {data.maxPrice.toFixed(2)} €
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Indice de couverture</span>
            <Badge
              variant={data.coverageIndex >= 1.0 ? "default" : "secondary"}
              className={
                data.coverageIndex < 1.0
                  ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/30"
                  : "bg-success/10 text-success border-success/30"
              }
            >
              {(data.coverageIndex * 100).toFixed(0)}%
            </Badge>
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
  
    // ✅ Paramètres d’alignement fixes
    const ICON_SIZE = 28;              // taille du logo
    const ICON_X = x - 190;            // position X du logo
    const ICON_Y = y - ICON_SIZE / 2;  // centre vertical du logo sur le tick
    const TEXT_X = x - 150;            // position du texte
  
    return (
      <g>
        {/* Logo (SVG pur) */}
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
          // fallback simple (carré)
          <rect
            x={ICON_X}
            y={ICON_Y}
            width={ICON_SIZE}
            height={ICON_SIZE}
            rx={6}
            ry={6}
            fill="rgba(148,163,184,0.25)"
          />
        )}
  
        {/* Nom */}
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
      {/* Mobile: Stack view avec images */}
      <div className="block md:hidden space-y-3">
        {sortedData.map((series, index) => (
          <div
            key={series.seriesName}
            className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            {/* Image de la série */}
            <SeriesImage seriesName={series.seriesName} className="w-12 h-12 shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-sm capitalize truncate">
                  {series.seriesName}
                </h4>
                {series.shortTermTrend === "up" && <TrendingUp className="h-3 w-3 text-success shrink-0" />}
                {series.shortTermTrend === "down" && <TrendingDown className="h-3 w-3 text-destructive shrink-0" />}
                {series.shortTermTrend === "stable" && <Minus className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
              
              {/* Barre de progression visuelle */}
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(Math.abs(series.averageVariation) * 200, 100)}%`,
                    backgroundColor: getBarColor(series.averageVariation),                  }}
                />
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <div
                className={`text-base font-bold ${
                  series.averageVariation > 0
                    ? "text-success"
                    : series.averageVariation < 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {formatValue(series.averageVariation)}
              </div>
              <div className="text-xs text-muted-foreground">
                IC: {(series.coverageIndex * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: Chart avec images dans l'axe Y */}
      <div className="hidden md:block" style={{ width: "100%", height: calculatedHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            layout="vertical"
            margin={{ top: 20, right: 80, left: 210, bottom: 20 }}
            onMouseMove={(state) => {
              if (state.isTooltipActive) {
                setActiveIndex(state.activeTooltipIndex ?? null);
              } else {
                setActiveIndex(null);
              }
            }}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="stroke-border/30"
              horizontal={true}
              vertical={true}
            />
            
            <XAxis
              type="number"
              dataKey="averageVariation"
              tickFormatter={formatValue}
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

            
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(0, 0, 0, 0.05)" }}
            />
            
            <Bar
              dataKey="averageVariation"
              background={{ fill: "var(--color-secondary)", opacity: 0.3 }}
              radius={[0, 4, 4, 0]}
            >
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.averageVariation)}
                  style={{
                    transition: "all 0.2s ease",
                    filter: activeIndex === index ? "brightness(1.1)" : "none"
                  }}
                />
              ))}
              <LabelList content={<CustomLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-success" />
          <span className="text-xs text-muted-foreground">Tendance haussière</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-destructive" />
          <span className="text-xs text-muted-foreground">Tendance baissière</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">Stable</span>
        </div>
      </div>
    </div>
  );
};