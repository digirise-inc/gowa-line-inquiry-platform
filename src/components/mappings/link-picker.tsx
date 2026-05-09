"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SuggestionList } from "./suggestion-list";
import { initials, safeJSONParse, shortenLineUid, timeAgo } from "@/lib/utils";
import { Search, Link2, Sparkles, CheckCircle2, X } from "lucide-react";

type Mapping = {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  status: string;
  recentPreview: string | null;
  candidateCustomerIds: string | null;
  candidateEvidences: string | null;
  messageCount: number;
  lastSeenAt: Date | string;
};

type Customer = {
  id: string;
  code: string;
  name: string;
  contactName: string | null;
  segment: string | null;
  area: string | null;
  phone: string | null;
};

export function LinkPicker({
  mapping,
  customers,
  open,
  onOpenChange,
}: {
  mapping: Mapping | null;
  customers: Customer[];
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedId(null);
      setError(null);
    }
  }, [open, mapping?.id]);

  const candidates = useMemo(
    () =>
      safeJSONParse<{ customer_id: string; score: number; evidence: string }[]>(
        mapping?.candidateEvidences ?? null,
        [],
      ),
    [mapping?.candidateEvidences],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return customers;
    const q = query.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.contactName ?? "").toLowerCase().includes(q) ||
        (c.area ?? "").toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [customers, query]);

  async function confirmLink() {
    if (!mapping || !selectedId) return;
    setSubmitting(true);
    setError(null);
    try {
      const isFromSuggestion = candidates.some((c) => c.customer_id === selectedId);
      const res = await fetch(`/api/mappings/${mapping.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedId,
          status: "linked",
          linkedMethod: isFromSuggestion ? "ai_suggested_confirmed" : "manual",
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "紐付けに失敗しました");
        return;
      }
      onOpenChange(false);
      router.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setSubmitting(false);
    }
  }

  if (!mapping) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-ai-600" />
            LINEユーザーを顧客に紐付け
          </DialogTitle>
          <DialogDescription>
            候補から選ぶか、検索して手動で紐付けします
          </DialogDescription>
        </DialogHeader>

        {/* マッピング情報 */}
        <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={mapping.pictureUrl ?? undefined} />
            <AvatarFallback>{initials(mapping.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold">{mapping.displayName}</span>
              <Badge variant="warning" className="text-[10px]">{mapping.status}</Badge>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="font-mono">{shortenLineUid(mapping.lineUserId)}</span>
              <span>·</span>
              <span>{mapping.messageCount}件メッセージ</span>
              <span>·</span>
              <span>最終 {timeAgo(mapping.lastSeenAt)}</span>
            </div>
            {mapping.recentPreview && (
              <div className="mt-2 line-clamp-2 rounded bg-background p-2 text-[11px] text-foreground/80">
                💬 {mapping.recentPreview}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* 左: AIサジェスト */}
          <div>
            <SuggestionList
              candidates={candidates}
              customers={customers}
              onPick={setSelectedId}
              selectedId={selectedId ?? undefined}
            />
          </div>

          {/* 右: 顧客マスタ検索 */}
          <div>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="顧客名・コード・電話・エリアで検索"
                className="h-9 pl-8 text-sm"
              />
            </div>
            <ScrollArea className="h-[260px] rounded-lg border bg-card p-1">
              <div className="space-y-1">
                {filtered.slice(0, 30).map((c) => {
                  const isSelected = selectedId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={`block w-full rounded-md p-2.5 text-left text-sm transition-colors hover:bg-muted ${
                        isSelected ? "bg-ai-50 ring-1 ring-ai-300 dark:bg-ai-950/30" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[10px] text-muted-foreground">{c.code}</span>
                          <span className="truncate font-medium">{c.name}</span>
                        </div>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-ai-600 shrink-0" />}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                        {c.segment && <span>{c.segment}</span>}
                        {c.area && <span>· {c.area}</span>}
                        {c.contactName && <span>· {c.contactName}</span>}
                      </div>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    該当する顧客がいません
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-akane-50 p-2 text-xs text-akane-800 dark:bg-akane-950/40 dark:text-akane-200">
            <X className="mr-1 inline h-3 w-3" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button variant="ai" disabled={!selectedId || submitting} onClick={confirmLink}>
            <Sparkles className="h-4 w-4" />
            {submitting ? "紐付け中…" : "紐付けを確定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
