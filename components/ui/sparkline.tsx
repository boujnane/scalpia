"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type SparklineProps = {
  /**
   * Valeurs (peu importe l'échelle). Le composant normalise automatiquement.
   */
  values: number[];
  className?: string;

  /**
   * Couleur stroke via class Tailwind (ex: "text-primary")
   * Utilise currentColor.
   */
  strokeClassName?: string;

  /**
   * Remplissage léger sous la courbe (dégradé)
   */
  withFill?: boolean;

  /**
   * Épaisseur du trait
   */
  strokeWidth?: number;

  /**
   * Hauteur en px (✅ pour remplir mieux ta card)
   */
  height?: number;

  /**
   * Animation du tracé
   */
  animated?: boolean;

  /**
   * Durée du dessin (ms)
   */
  drawDurationMs?: number;

  /**
   * Pause entre 2 boucles (ms)
   */
  loopDelayMs?: number;

  /**
   * Affiche le point final + pulse
   */
  showEndDot?: boolean;

  /**
   * Padding interne (px du viewBox)
   */
  padding?: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function buildSmoothPath(values: number[], w: number, h: number, padding: number) {
  if (!values || values.length < 2) return { line: "", area: "", points: [] as { x: number; y: number }[] };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const left = padding;
  const right = w - padding;
  const top = padding;
  const bottom = h - padding;

  const step = (right - left) / (values.length - 1);

  const points = values.map((v, i) => {
    const t = (v - min) / range; // 0..1
    const x = left + i * step;
    const y = bottom - t * (bottom - top); // invert y
    return { x, y: clamp(y, top, bottom) };
  });

  // Monotone cubic spline for a more natural curve (no overshoot)
  const n = points.length;
  const dx = step;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    slopes.push((points[i + 1].y - points[i].y) / dx);
  }

  const tangents: number[] = new Array(n).fill(0);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (slopes[i - 1] * slopes[i] <= 0) {
      tangents[i] = 0;
    } else {
      tangents[i] = (slopes[i - 1] + slopes[i]) / 2;
    }
  }

  for (let i = 0; i < n - 1; i++) {
    const d = slopes[i];
    if (d === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      continue;
    }
    const a = tangents[i] / d;
    const b = tangents[i + 1] / d;
    const sum = a * a + b * b;
    if (sum > 9) {
      const t = 3 / Math.sqrt(sum);
      tangents[i] = t * a * d;
      tangents[i + 1] = t * b * d;
    }
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const c1x = p0.x + dx / 3;
    const c1y = p0.y + (tangents[i] * dx) / 3;
    const c2x = p1.x - dx / 3;
    const c2y = p1.y - (tangents[i + 1] * dx) / 3;
    d += ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  }

  const area = `${d} L ${points[points.length - 1].x.toFixed(2)} ${bottom.toFixed(2)} L ${points[0].x.toFixed(2)} ${bottom.toFixed(2)} Z`;

  return { line: d, area, points };
}

/**
 * Sparkline SVG premium (sans dépendances)
 * - courbe lissée
 * - animation "draw" + boucle
 * - fill gradient + glow
 * - point final + pulse
 */
export function Sparkline({
  values,
  className,
  strokeClassName = "text-primary",
  withFill = true,
  strokeWidth = 2.6,
  height = 140, // ✅ plus grand par défaut
  animated = true,
  drawDurationMs = 1200,
  loopDelayMs = 2000,
  showEndDot = true,
  padding = 6,
}: SparklineProps) {
  // viewBox interne (on scale avec preserveAspectRatio="none")
  const w = 240;
  const h = 90;

  const safeValues = useMemo(() => {
    const v = (values ?? []).filter((x) => Number.isFinite(x));
    return v.length >= 2 ? v : [0, 0];
  }, [values]);

  const { line, area, points } = useMemo(() => buildSmoothPath(safeValues, w, h, padding), [safeValues, w, h, padding]);

  // ids stables
  const gradientId = useMemo(() => `spark-grad-${Math.random().toString(16).slice(2)}`, []);
  const strokeGradientId = useMemo(() => `spark-stroke-${Math.random().toString(16).slice(2)}`, []);
  const glowId = useMemo(() => `spark-glow-${Math.random().toString(16).slice(2)}`, []);

  const pathRef = useRef<SVGPathElement | null>(null);
  const [pathLen, setPathLen] = useState(0);

  useEffect(() => {
    if (!animated) return;
    if (!pathRef.current) return;

    try {
      const len = pathRef.current.getTotalLength();
      setPathLen(len);
    } catch {
      setPathLen(0);
    }
  }, [animated, line]);

  const end = points.at(-1);

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        width="100%"
        height={height}
        preserveAspectRatio="none" // ✅ remplit parfaitement la card
        className={cn("block", strokeClassName)}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={strokeGradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
            <stop offset="45%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.55" />
          </linearGradient>

          {withFill && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="70%" stopColor="currentColor" stopOpacity="0.08" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          )}

          {/* glow léger */}
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* grille douce */}
        <path
          d={`M 0 ${h * 0.25} H ${w} M 0 ${h * 0.5} H ${w} M 0 ${h * 0.75} H ${w}`}
          stroke="currentColor"
          strokeOpacity="0.05"
          strokeWidth="1"
          fill="none"
        />

        {/* fill */}
        {withFill && area && (
          <path
            d={area}
            fill={`url(#${gradientId})`}
            style={
              animated && pathLen > 0
                ? {
                    opacity: 0,
                    animation: `spark-fill-${gradientId} ${drawDurationMs + loopDelayMs}ms ease-out infinite`,
                  }
                : undefined
            }
          />
        )}

        {/* glow fin */}
        {line && (
          <path
            d={line}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth={strokeWidth + 1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.35}
            filter={`url(#${glowId})`}
          />
        )}

        {/* courbe animée */}
        {line && (
          <path
            ref={pathRef}
            d={line}
            fill="none"
            stroke={`url(#${strokeGradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={
              animated && pathLen > 0
                ? {
                    strokeDasharray: pathLen,
                    strokeDashoffset: pathLen,
                    animation: `spark-loop-${gradientId} ${drawDurationMs + loopDelayMs}ms cubic-bezier(0.33, 1, 0.68, 1) infinite`,
                  }
                : undefined
            }
          />
        )}

        {/* point final + pulse */}
        {showEndDot && end && (
          <>
            <circle cx={end.x} cy={end.y} r={2.2} fill="currentColor" opacity={0.95} />
            {animated && (
              <circle
                cx={end.x}
                cy={end.y}
                r={5}
                fill="currentColor"
                opacity={0.10}
                style={{
                  animation: `spark-pulse-${gradientId} 1400ms ease-in-out infinite`,
                }}
              />
            )}
          </>
        )}
      </svg>

      {/* keyframes scoped via ids uniques */}
      <style>{`
        @keyframes spark-loop-${gradientId} {
          0% { stroke-dashoffset: ${pathLen}; opacity: 0.9; }
          55% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: 0; opacity: 0.6; }
        }
        @keyframes spark-fill-${gradientId} {
          0% { opacity: 0; }
          35% { opacity: 0.9; }
          80% { opacity: 0.9; }
          100% { opacity: 0; }
        }
        @keyframes spark-pulse-${gradientId} {
          0%, 100% { transform: scale(0.9); opacity: 0.10; }
          50% { transform: scale(1.25); opacity: 0.20; }
        }
      `}</style>
    </div>
  );
}
