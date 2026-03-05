"use client";

import { useState } from "react";
import { Eye, Download, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MetricsData } from "@/types/dataset";

interface MetricsChartProps {
  metrics: MetricsData;
}

const CHART_H = 180;
const CHART_PAD = { top: 10, right: 16, bottom: 28, left: 50 };

function formatNumber(n: number): string {
  return n.toLocaleString("fr-FR");
}

function formatMonth(month: string): string {
  const [y, m] = month.split("-");
  const months = ["Jan", "Fev", "Mar", "Avr", "Mai", "Jun", "Jul", "Aou", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(m, 10) - 1]} ${y?.slice(2)}`;
}

function trendIcon(entries: { visits: number }[]) {
  if (entries.length < 2) return <Minus className="h-3.5 w-3.5" />;
  const last = entries[entries.length - 1].visits;
  const prev = entries[entries.length - 2].visits;
  if (last > prev) return <TrendingUp className="h-3.5 w-3.5 text-green-600" />;
  if (last < prev) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5" />;
}

export function MetricsChart({ metrics }: MetricsChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  // Entries come newest-first from MCP, reverse for chronological display
  const entries = [...metrics.entries].reverse();

  if (entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Pas de statistiques disponibles.
      </p>
    );
  }

  const maxVal = Math.max(...entries.flatMap((e) => [e.visits, e.downloads]), 1);
  const innerW = 100 - ((CHART_PAD.left + CHART_PAD.right) / 6);
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

  // Compute SVG points for a series
  function points(series: number[]): string {
    return series
      .map((val, i) => {
        const x = CHART_PAD.left + (i / Math.max(series.length - 1, 1)) * (600 - CHART_PAD.left - CHART_PAD.right);
        const y = CHART_PAD.top + innerH - (val / maxVal) * innerH;
        return `${x},${y}`;
      })
      .join(" ");
  }

  function areaPoints(series: number[]): string {
    const line = points(series);
    const lastX = CHART_PAD.left + ((series.length - 1) / Math.max(series.length - 1, 1)) * (600 - CHART_PAD.left - CHART_PAD.right);
    const baseY = CHART_PAD.top + innerH;
    return `${CHART_PAD.left},${baseY} ${line} ${lastX},${baseY}`;
  }

  const visitPts = entries.map((e) => e.visits);
  const dlPts = entries.map((e) => e.downloads);

  // Y-axis ticks (4 ticks)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    value: Math.round(maxVal * pct),
    y: CHART_PAD.top + innerH - pct * innerH,
  }));

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30">
              <Eye className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Visites totales</p>
              <p className="text-lg font-semibold flex items-center gap-1.5">
                {formatNumber(metrics.totalVisits)}
                {trendIcon(entries)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
              <Download className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telechargements</p>
              <p className="text-lg font-semibold flex items-center gap-1.5">
                {formatNumber(metrics.totalDownloads)}
                {trendIcon(entries.map((e) => ({ visits: e.downloads })))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Evolution mensuelle</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <svg
            viewBox={`0 0 600 ${CHART_H}`}
            className="w-full h-auto"
            onMouseLeave={() => setHovered(null)}
          >
            {/* Grid lines */}
            {yTicks.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={CHART_PAD.left}
                  y1={tick.y}
                  x2={600 - CHART_PAD.right}
                  y2={tick.y}
                  stroke="currentColor"
                  strokeOpacity={0.08}
                />
                <text
                  x={CHART_PAD.left - 8}
                  y={tick.y + 3.5}
                  textAnchor="end"
                  className="fill-muted-foreground"
                  fontSize={10}
                >
                  {tick.value >= 1000 ? `${(tick.value / 1000).toFixed(1)}k` : tick.value}
                </text>
              </g>
            ))}

            {/* Area fills */}
            <polygon
              points={areaPoints(visitPts)}
              fill="rgb(59, 130, 246)"
              fillOpacity={0.1}
            />
            <polygon
              points={areaPoints(dlPts)}
              fill="rgb(16, 185, 129)"
              fillOpacity={0.1}
            />

            {/* Lines */}
            <polyline
              points={points(visitPts)}
              fill="none"
              stroke="rgb(59, 130, 246)"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <polyline
              points={points(dlPts)}
              fill="none"
              stroke="rgb(16, 185, 129)"
              strokeWidth={2}
              strokeLinejoin="round"
            />

            {/* Data points & hit areas */}
            {entries.map((entry, i) => {
              const x = CHART_PAD.left + (i / Math.max(entries.length - 1, 1)) * (600 - CHART_PAD.left - CHART_PAD.right);
              const yVisit = CHART_PAD.top + innerH - (entry.visits / maxVal) * innerH;
              const yDl = CHART_PAD.top + innerH - (entry.downloads / maxVal) * innerH;
              const isHovered = hovered === i;

              return (
                <g key={entry.month}>
                  {/* Invisible wide hit area */}
                  <rect
                    x={x - 20}
                    y={CHART_PAD.top}
                    width={40}
                    height={innerH + CHART_PAD.bottom}
                    fill="transparent"
                    onMouseEnter={() => setHovered(i)}
                  />

                  {/* Vertical guide */}
                  {isHovered && (
                    <line
                      x1={x}
                      y1={CHART_PAD.top}
                      x2={x}
                      y2={CHART_PAD.top + innerH}
                      stroke="currentColor"
                      strokeOpacity={0.15}
                      strokeDasharray="4 2"
                    />
                  )}

                  {/* Visit dot */}
                  <circle
                    cx={x}
                    cy={yVisit}
                    r={isHovered ? 4 : 2.5}
                    fill="rgb(59, 130, 246)"
                    className="transition-[r] duration-150"
                  />
                  {/* Download dot */}
                  <circle
                    cx={x}
                    cy={yDl}
                    r={isHovered ? 4 : 2.5}
                    fill="rgb(16, 185, 129)"
                    className="transition-[r] duration-150"
                  />

                  {/* X-axis label */}
                  {(i === 0 || i === entries.length - 1 || entries.length <= 6 || i % Math.ceil(entries.length / 6) === 0) && (
                    <text
                      x={x}
                      y={CHART_H - 4}
                      textAnchor="middle"
                      className="fill-muted-foreground"
                      fontSize={10}
                    >
                      {formatMonth(entry.month)}
                    </text>
                  )}

                  {/* Tooltip */}
                  {isHovered && (
                    <g>
                      <rect
                        x={Math.min(x - 55, 600 - CHART_PAD.right - 110)}
                        y={Math.max(CHART_PAD.top, Math.min(yVisit, yDl) - 48)}
                        width={110}
                        height={44}
                        rx={6}
                        className="fill-card stroke-border"
                        strokeWidth={1}
                      />
                      <text
                        x={Math.min(x, 600 - CHART_PAD.right - 55)}
                        y={Math.max(CHART_PAD.top + 14, Math.min(yVisit, yDl) - 30)}
                        textAnchor="middle"
                        className="fill-foreground"
                        fontSize={10}
                        fontWeight={600}
                      >
                        {formatMonth(entry.month)}
                      </text>
                      <text
                        x={Math.min(x, 600 - CHART_PAD.right - 55)}
                        y={Math.max(CHART_PAD.top + 28, Math.min(yVisit, yDl) - 16)}
                        textAnchor="middle"
                        fontSize={10}
                      >
                        <tspan fill="rgb(59, 130, 246)">{formatNumber(entry.visits)} vis.</tspan>
                      </text>
                      <text
                        x={Math.min(x, 600 - CHART_PAD.right - 55)}
                        y={Math.max(CHART_PAD.top + 40, Math.min(yVisit, yDl) - 4)}
                        textAnchor="middle"
                        fontSize={10}
                      >
                        <tspan fill="rgb(16, 185, 129)">{formatNumber(entry.downloads)} tel.</tspan>
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-muted-foreground">Visites</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Telechargements</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
