"use client";

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

type Candidate = {
  customer_id: string;
  score: number;
  evidence: string;
};

export function SuggestionList({
  candidates,
  customers,
  onPick,
  selectedId,
}: {
  candidates: Candidate[];
  customers: { id: string; name: string; code: string; segment?: string | null; area?: string | null }[];
  onPick: (id: string) => void;
  selectedId?: string;
}) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        AIサジェストなし — 下の検索ボックスから手動選択してください
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Sparkles className="h-3 w-3 text-ai-600" />
        AIサジェスト ({candidates.length}候補)
      </div>
      {candidates.map((c) => {
        const cust = customers.find((cc) => cc.id === c.customer_id);
        if (!cust) return null;
        const isSelected = selectedId === cust.id;
        const tone =
          c.score >= 0.8
            ? "border-wakaba-300 bg-wakaba-50 dark:bg-wakaba-950/30"
            : c.score >= 0.6
            ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
            : "border-sumi-200 bg-muted/30";
        return (
          <button
            key={c.customer_id}
            onClick={() => onPick(cust.id)}
            className={`block w-full rounded-lg border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${tone} ${
              isSelected ? "ring-2 ring-ai-500" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-mono text-[10px] text-muted-foreground">{cust.code}</span>
                <span className="truncate text-sm font-bold">{cust.name}</span>
              </div>
              <Badge variant="ai" className="px-1.5 py-0 text-[10px] tabular-nums">
                {Math.round(c.score * 100)}%
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
              {cust.segment && <span>{cust.segment}</span>}
              {cust.area && <span>· {cust.area}</span>}
            </div>
            <div className="mt-2 text-[11px] leading-snug text-foreground/70">{c.evidence}</div>
          </button>
        );
      })}
    </div>
  );
}
