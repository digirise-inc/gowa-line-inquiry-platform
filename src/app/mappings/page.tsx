/**
 * /mappings — LINE userId ↔ 顧客マッピング管理画面
 *
 *  - 統計タイル4つ (linked / unverified / multiple_candidates / failed)
 *  - フィルタ可能なマッピング一覧 + 紐付けボタン
 *  - 紐付けダイアログ (AIサジェスト + 顧客マスタ検索)
 *  - マッピング履歴 (linked直近5件)
 */

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MappingStats } from "@/components/mappings/mapping-stats";
import { MappingTable } from "@/components/mappings/mapping-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/prisma";
import { initials, timeAgo, shortenLineUid } from "@/lib/utils";
import { Link2, Sparkles, History, Wand2 } from "lucide-react";
import { getUnmappedCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function MappingsPage() {
  const [allMappings, customers, unmappedCount] = await Promise.all([
    db.lineMapping.findMany({
      include: { customer: true, linkedBy: true },
      orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }],
    }),
    db.customer.findMany({ orderBy: { code: "asc" } }),
    getUnmappedCount(),
  ]);

  const stats = {
    linked: allMappings.filter((m) => m.status === "linked").length,
    unverified: allMappings.filter((m) => m.status === "unverified").length,
    multiple_candidates: allMappings.filter((m) => m.status === "multiple_candidates").length,
    failed: allMappings.filter((m) => m.status === "failed").length,
  };

  const recentLinked = allMappings
    .filter((m) => m.status === "linked" && m.linkedAt)
    .sort((a, b) => (b.linkedAt!.getTime() ?? 0) - (a.linkedAt!.getTime() ?? 0))
    .slice(0, 5);

  return (
    <AppShell unmappedCount={unmappedCount}>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="px-2.5 py-1">
                <Wand2 className="h-3 w-3" />
                Mappings
              </Badge>
              <span className="text-xs text-muted-foreground">SPEC §6 LINE userId ↔ 顧客マスタ</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">マッピング管理</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              未紐付けユーザーをワンクリックで顧客に紐付け。AIサジェストを採用して時間短縮。
            </p>
          </div>
        </header>

        {/* Stats */}
        <MappingStats stats={stats} />

        {/* Main two columns: table + history */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MappingTable mappings={allMappings as any} customers={customers as any} />
          </div>

          {/* 紐付け履歴 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-ai-600" />
                直近の紐付け
              </CardTitle>
              <p className="text-xs text-muted-foreground">最新 {recentLinked.length} 件</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentLinked.length === 0 && (
                <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                  まだ紐付け履歴がありません
                </div>
              )}
              {recentLinked.map((m) => (
                <div key={m.id} className="rounded-lg border bg-card p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={m.pictureUrl ?? undefined} />
                      <AvatarFallback>{initials(m.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-bold">{m.displayName}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {shortenLineUid(m.lineUserId)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-[11px]">
                    <Link2 className="h-3 w-3 text-wakaba-600" />
                    <span className="font-medium text-foreground">
                      {m.customer ? `${m.customer.code} ${m.customer.name}` : "—"}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {m.linkedBy?.name ?? "—"} ·{" "}
                      {m.linkedMethod === "ai_suggested_confirmed" ? (
                        <span className="inline-flex items-center gap-0.5 text-ai-700 dark:text-ai-300">
                          <Sparkles className="h-2.5 w-2.5" /> AI採用
                        </span>
                      ) : (
                        "手動"
                      )}
                    </span>
                    <span>{timeAgo(m.linkedAt!)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Footer note */}
        <Card className="border-dashed bg-sumi-50/50 dark:bg-sumi-900/30">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ai-500/10">
              <Sparkles className="h-4 w-4 text-ai-600" />
            </div>
            <div className="text-sm leading-relaxed">
              <div className="font-medium">マッピング運用方針 (SPEC §6)</div>
              <p className="mt-0.5 text-muted-foreground">
                LINE 受信時に displayName / 過去問合せ内容で AI が候補をスコア。70%以上は緑（高確度）、60〜70%は黄（要確認）、それ以下は手動。
                マッピング充足率 ≥80% で Phase 1.5 PUSH 配信を解禁します。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
