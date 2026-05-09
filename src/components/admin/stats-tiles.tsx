/**
 * StatsTiles — /admin/users 上部の統計タイル4つ。
 * Mappings の MappingStats と同じ階層感で揃える。
 */
"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InvitationStats } from "@/lib/mock-invitations";

const TILES: {
  key: keyof InvitationStats;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  ring: string;
  color: string;
}[] = [
  {
    key: "totalUsers",
    label: "全ユーザー",
    icon: Users,
    ring: "ring-ai-200 dark:ring-ai-800",
    color: "text-ai-700 dark:text-ai-300",
  },
  {
    key: "activeUsers",
    label: "アクティブ",
    icon: UserCheck,
    ring: "ring-wakaba-200 dark:ring-wakaba-800",
    color: "text-wakaba-700 dark:text-wakaba-300",
  },
  {
    key: "pendingInvitations",
    label: "ペンディング招待",
    icon: Clock,
    ring: "ring-amber-200 dark:ring-amber-800",
    color: "text-amber-700 dark:text-amber-300",
  },
  {
    key: "expiredInvitations",
    label: "失効招待",
    icon: AlertCircle,
    ring: "ring-akane-200 dark:ring-akane-800",
    color: "text-akane-700 dark:text-akane-300",
  },
];

export function StatsTiles({ stats }: { stats: InvitationStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {TILES.map((t) => {
        const Icon = t.icon;
        return (
          <Card
            key={t.key}
            className={cn("ring-1", t.ring)}
            data-testid={`stat-${t.key}`}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg bg-background ring-1",
                  t.ring,
                )}
              >
                <Icon className={cn("h-5 w-5", t.color)} />
              </div>
              <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {t.label}
                </div>
                <div className="text-2xl font-bold tabular-nums">
                  {stats[t.key].toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
