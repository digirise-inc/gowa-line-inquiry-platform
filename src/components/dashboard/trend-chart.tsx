"use client";

import { useMemo } from "react";

export function TrendChart({ data }: { data: { day: string; count: number }[] }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.count)), [data]);

  return (
    <div className="space-y-3">
      {/* SVG line + bars (Tailwind classes used to color) */}
      <div className="relative h-44 w-full">
        <svg viewBox="0 0 600 180" className="h-full w-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(226, 84%, 55%)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="hsl(226, 84%, 55%)" stopOpacity="0" />
            </linearGradient>
            <pattern id="grid" width="100" height="36" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 36" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="600" height="180" fill="url(#grid)" />
          {/* baseline */}
          <line x1="0" y1="170" x2="600" y2="170" stroke="currentColor" strokeOpacity="0.15" />
          {/* area path */}
          {data.length > 0 && (
            <>
              <path
                d={`M 0 ${170 - (data[0].count / max) * 140} ${data
                  .map((d, i) => `L ${(i / (data.length - 1)) * 600} ${170 - (d.count / max) * 140}`)
                  .join(" ")} L 600 170 L 0 170 Z`}
                fill="url(#trendFill)"
              />
              <path
                d={`M 0 ${170 - (data[0].count / max) * 140} ${data
                  .map((d, i) => `L ${(i / (data.length - 1)) * 600} ${170 - (d.count / max) * 140}`)
                  .join(" ")}`}
                fill="none"
                stroke="hsl(226, 84%, 55%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {data.map((d, i) => {
                const x = (i / (data.length - 1)) * 600;
                const y = 170 - (d.count / max) * 140;
                return (
                  <g key={i}>
                    <circle cx={x} cy={y} r="4" fill="white" stroke="hsl(226, 84%, 55%)" strokeWidth="2" />
                  </g>
                );
              })}
            </>
          )}
        </svg>
      </div>

      {/* X labels */}
      <div className="grid grid-cols-7 gap-2 text-center text-[10px] text-muted-foreground tabular-nums">
        {data.map((d) => (
          <div key={d.day}>
            <div className="font-bold text-foreground">{d.count}</div>
            <div>{d.day}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
