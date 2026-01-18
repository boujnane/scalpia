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

  // Quadratic smoothing (simple, joli)
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const cur = points[i];
    const cx = ((prev.x + cur.x) / 2).toFixed(2);
    d += ` Q ${cx} ${prev.y.toFixed(2)} ${cur.x.toFixed(2)} ${cur.y.toFixed(2)}`;
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
  const glowId = useMemo(() => `spark-glow-${Math.random().toString(16).slice(2)}`, []);

  // loop control: remount path animation by key
  const [loopKey, setLoopKey] = useState(0);

  useEffect(() => {
    if (!animated) return;

    const total = drawDurationMs + loopDelayMs;
    const id = window.setInterval(() => setLoopKey((k) => k + 1), total);

    return () => window.clearInterval(id);
  }, [animated, drawDurationMs, loopDelayMs]);

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
  }, [animated, line, loopKey]);

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
          {withFill && (
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
              <stop offset="70%" stopColor="currentColor" stopOpacity="0.08" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          )}

          {/* glow léger */}
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
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
        {withFill && area && <path d={area} fill={`url(#${gradientId})`} />}

        {/* courbe animée */}
        {line && (
          <path
            key={loopKey}
            ref={pathRef}
            d={line}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
            style={
              animated && pathLen > 0
                ? {
                    strokeDasharray: pathLen,
                    strokeDashoffset: pathLen,
                    animation: `spark-draw-${gradientId} ${drawDurationMs}ms ease-in-out forwards`,
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
        @keyframes spark-draw-${gradientId} {
          to { stroke-dashoffset: 0; }
        }
        @keyframes spark-pulse-${gradientId} {
          0%, 100% { transform: scale(0.9); opacity: 0.10; }
          50% { transform: scale(1.25); opacity: 0.20; }
        }
      `}</style>
    </div>
  );
}
