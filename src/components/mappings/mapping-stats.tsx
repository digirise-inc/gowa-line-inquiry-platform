"use client";

import { Card } from "@/components/ui/card";
import { Link2, AlertTriangle, Layers, Ban } from "lucide-react";

type Stats = {
  linked: number;
  unverified: number;
  multiple_candidates: number;
  failed: number;
};

const TILES = [
  {
    key: "linked",
    label: "紐付け済",
    icon: Link2,
    tone: "from-wakaba-500/20 via-wakaba-500/5 to-transparent text-wakaba-700 dark:text-wakaba-300",
    border: "border-wakaba-200 dark:border-wakaba-900",
  },
  {
    key: "unverified",
    label: "未紐付け",
    icon: AlertTriangle,
    tone: "from-akane-500/20 via-akane-500/5 to-transparent text-akane-700 dark:text-akane-300",
    border: "border-akane-200 dark:border-akane-900",
  },
  {
    key: "multiple_candidates",
    label: "複数候補",
    icon: Layers,
    tone: "from-amber-500/20 via-amber-500/5 to-transparent text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-900",
  },
  {
    key: "failed",
    label: "該当なし",
    icon: Ban,
    tone: "from-sumi-500/20 via-sumi-500/5 to-transparent text-sumi-700 dark:text-sumi-300",
    border: "border-sumi-200 dark:border-sumi-800",
  },
] as const;

export function MappingStats({ stats }: { stats: Stats }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {TILES.map((t) => {
        const Icon = t.icon;
        const value = stats[t.key as keyof Stats] ?? 0;
        const pct = total === 0 ? 0 : Math.round((value / total) * 100);
        return (
          <Card key={t.key} className={`border ${t.border} transition-all hover:-translate-y-0.5 hover:shadow-md`}>
            <div className={`flex flex-col gap-3 rounded-xl bg-gradient-to-br p-5 ${t.tone}`}>
              <div className="flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background/70 ring-1 ring-border">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] font-bold tabular-nums">
                  {pct}%
                </span>
              </div>
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-foreground/70">
                  {t.label}
                </div>
                <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
