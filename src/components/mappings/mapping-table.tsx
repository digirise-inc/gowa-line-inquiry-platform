"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LinkPicker } from "./link-picker";
import { MAPPING_STATUS } from "@/lib/constants";
import { initials, safeJSONParse, shortenLineUid, timeAgo } from "@/lib/utils";
import {
  Search,
  Sparkles,
  Wand2,
  CheckCircle2,
  X,
  Link2,
} from "lucide-react";

type MappingRow = {
  id: string;
  lineUserId: string;
  displayName: string;
  pictureUrl: string | null;
  status: string;
  customer: { id: string; code: string; name: string } | null;
  candidateCustomerIds: string | null;
  candidateEvidences: string | null;
  recentPreview: string | null;
  messageCount: number;
  firstSeenAt: Date | string;
  lastSeenAt: Date | string;
  linkedAt: Date | string | null;
  linkedMethod: string | null;
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

export function MappingTable({
  mappings,
  customers,
}: {
  mappings: MappingRow[];
  customers: Customer[];
}) {
  const [tab, setTab] = useState("unverified");
  const [query, setQuery] = useState("");
  const [picker, setPicker] = useState<MappingRow | null>(null);

  const counts = {
    unverified: mappings.filter((m) => m.status === "unverified").length,
    multiple_candidates: mappings.filter((m) => m.status === "multiple_candidates").length,
    failed: mappings.filter((m) => m.status === "failed").length,
    linked: mappings.filter((m) => m.status === "linked").length,
  };

  const filtered = useMemo(
    () =>
      mappings
        .filter((m) =>
          tab === "all"
            ? true
            : tab === "unverified"
            ? m.status === "unverified" || m.status === "multiple_candidates"
            : m.status === tab,
        )
        .filter((m) =>
          query
            ? m.displayName.toLowerCase().includes(query.toLowerCase()) ||
              m.lineUserId.toLowerCase().includes(query.toLowerCase()) ||
              (m.customer?.name ?? "").toLowerCase().includes(query.toLowerCase()) ||
              (m.recentPreview ?? "").toLowerCase().includes(query.toLowerCase())
            : true,
        ),
    [mappings, tab, query],
  );

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="unverified" data-testid="mapping-filter-unverified">
              要対応
              <Badge variant="warning" className="ml-1.5 text-[10px]">
                {counts.unverified + counts.multiple_candidates}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="linked" data-testid="mapping-filter-linked">
              紐付け済
              <Badge className="ml-1.5 text-[10px]">{counts.linked}</Badge>
            </TabsTrigger>
            <TabsTrigger value="failed" data-testid="mapping-filter-failed">
              該当なし
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {counts.failed}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="mapping-filter-all">
              すべて
              <Badge variant="secondary" className="ml-1.5 text-[10px]">
                {mappings.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="displayName / userId / 顧客名 / 本文 で検索…"
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <TabsContent value={tab} className="mt-4 space-y-2">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-sm text-muted-foreground">
                該当するマッピングはありません
              </CardContent>
            </Card>
          ) : (
            filtered.map((m) => (
              <MappingRowCard
                key={m.id}
                mapping={m}
                customers={customers}
                onOpenPicker={() => setPicker(m)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <LinkPicker
        mapping={picker as any}
        customers={customers}
        open={picker !== null}
        onOpenChange={(b) => !b && setPicker(null)}
      />
    </div>
  );
}

function MappingRowCard({
  mapping,
  customers,
  onOpenPicker,
}: {
  mapping: MappingRow;
  customers: Customer[];
  onOpenPicker: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const meta = MAPPING_STATUS.find((s) => s.value === mapping.status);
  const evidences = safeJSONParse<{ customer_id: string; score: number; evidence: string }[]>(
    mapping.candidateEvidences,
    [],
  );

  async function link(customerId: string, method: string) {
    setPending(true);
    try {
      await fetch(`/api/mappings/${mapping.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customerId || null,
          status: customerId ? "linked" : "unverified",
          linkedMethod: method,
        }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function markFailed() {
    setPending(true);
    try {
      await fetch(`/api/mappings/${mapping.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "failed" }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className={`transition-opacity ${pending ? "opacity-60" : ""}`}>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[260px_1fr_auto]">
        {/* Left: profile */}
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={mapping.pictureUrl ?? undefined} />
            <AvatarFallback>{initials(mapping.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-bold">{mapping.displayName}</span>
              {meta && <Badge className={meta.color}>{meta.label}</Badge>}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground" title={mapping.lineUserId}>
              {shortenLineUid(mapping.lineUserId)}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              初回 {timeAgo(mapping.firstSeenAt)} / 受信 {mapping.messageCount}件
            </div>
          </div>
        </div>

        {/* Center: candidates / linked customer */}
        <div className="space-y-2">
          {mapping.recentPreview && (
            <div className="rounded-md bg-sumi-50 px-3 py-2 text-xs text-foreground/80 dark:bg-sumi-900/40">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">直近メッセージ:</span>{" "}
              {mapping.recentPreview}
            </div>
          )}
          {mapping.status === "linked" && mapping.customer ? (
            <div className="flex items-center gap-2 rounded-md bg-wakaba-50 px-3 py-2 text-sm dark:bg-wakaba-950/30">
              <CheckCircle2 className="h-4 w-4 text-wakaba-600" />
              <span className="font-bold">{mapping.customer.name}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{mapping.customer.code}</span>
              {mapping.linkedMethod === "ai_suggested_confirmed" && (
                <Badge variant="ai" className="text-[10px]">
                  <Sparkles className="h-3 w-3" /> AI確定
                </Badge>
              )}
            </div>
          ) : evidences.length > 0 ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-ai-700 dark:text-ai-300">
                <Sparkles className="h-3 w-3" />
                AI紐付け候補 (上位 {evidences.length}件)
              </div>
              {evidences.map((e, idx) => {
                const cust = customers.find((c) => c.id === e.customer_id);
                if (!cust) return null;
                const isTop = idx === 0;
                return (
                  <div
                    key={e.customer_id}
                    className="flex items-center gap-2 rounded-md border bg-card p-2 text-xs transition-colors hover:bg-muted/40"
                  >
                    <div className="flex h-6 w-9 items-center justify-center rounded bg-ai-500/10 text-[10px] font-bold tabular-nums text-ai-700 dark:text-ai-300">
                      {Math.round(e.score * 100)}%
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{cust.name}</div>
                      <div className="line-clamp-1 text-[10px] text-muted-foreground">{e.evidence}</div>
                    </div>
                    <Button
                      size="xs"
                      variant={isTop ? "ai" : "outline"}
                      onClick={() => link(cust.id, "ai_suggested_confirmed")}
                      disabled={pending}
                    >
                      <Wand2 className="h-3 w-3" />
                      {isTop ? "ほぼ確定 / 紐付け" : "この候補で紐付け"}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : mapping.status !== "linked" ? (
            <div className="rounded-md border border-dashed bg-sumi-50 p-3 text-center text-xs text-muted-foreground dark:bg-sumi-900/40">
              AI候補なし — 手動で紐付けしてください
            </div>
          ) : null}
        </div>

        {/* Right: actions */}
        <div className="flex flex-col items-end gap-2">
          {mapping.status !== "linked" && (
            <>
              <Button
                size="xs"
                variant="ai"
                data-testid={`link-btn-${mapping.id}`}
                onClick={onOpenPicker}
                disabled={pending}
              >
                <Link2 className="h-3 w-3" />
                手動で紐付け
              </Button>
              <Button size="xs" variant="ghost" onClick={markFailed} disabled={pending}>
                <X className="h-3 w-3" />
                該当なし
              </Button>
            </>
          )}
          {mapping.status === "linked" && (
            <>
              <Button size="xs" variant="outline" onClick={onOpenPicker} disabled={pending}>
                <Search className="h-3 w-3" />
                変更
              </Button>
              <Button size="xs" variant="outline" onClick={() => link("", "manual")} disabled={pending}>
                <X className="h-3 w-3" />
                紐付け解除
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
