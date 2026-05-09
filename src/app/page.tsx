import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getDashboardSummary } from "@/lib/queries";
import { STATUS_BY_VALUE, PRIORITIES } from "@/lib/constants";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { initials, timeAgo } from "@/lib/utils";
import {
  AlertOctagon,
  Inbox,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Activity,
  Wand2,
  ListChecks,
  Link2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const s = await getDashboardSummary();

  const tiles = [
    {
      label: "未対応",
      value: s.open,
      diff: "+2 前日比",
      icon: Inbox,
      tone: "akane",
      href: "/tickets?status=open",
      hint: s.open > 5 ? "30分以上未対応あり" : "正常",
    },
    {
      label: "対応中",
      value: s.inProgress,
      diff: "+1 前日比",
      icon: Loader2,
      tone: "ai",
      href: "/tickets?status=triaging",
      hint: "標準",
    },
    {
      label: "完了",
      value: s.done,
      diff: "+5 前日比",
      icon: CheckCircle2,
      tone: "wakaba",
      href: "/tickets?status=answered",
      hint: "増加傾向",
    },
    {
      label: "失注",
      value: s.lost,
      diff: "−1 前日比",
      icon: XCircle,
      tone: "sumi",
      href: "/tickets?status=closed_lost",
      hint: "理由集計",
    },
  ] as const;

  return (
    <AppShell unmappedCount={s.unmappedCount}>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="px-2.5 py-1">
                <Sparkles className="h-3 w-3" />
                Phase 1.0
              </Badge>
              <span className="text-xs text-muted-foreground">業務管理プラットフォーム</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">ダッシュボード</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              店との信頼を守る — いまどこ？が一目でわかる、4つのKPI
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/kanban">
                <ListChecks className="h-4 w-4" />
                カンバンへ
              </Link>
            </Button>
            <Button variant="ai" size="sm" asChild>
              <Link href="/tickets">
                <Activity className="h-4 w-4" />
                チケット一覧
              </Link>
            </Button>
          </div>
        </header>

        {/* KPI tiles */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            const toneCls = {
              akane: "from-akane-500/15 via-akane-500/5 to-transparent text-akane-700 dark:text-akane-300",
              ai: "from-ai-500/15 via-ai-500/5 to-transparent text-ai-700 dark:text-ai-300",
              wakaba: "from-wakaba-500/15 via-wakaba-500/5 to-transparent text-wakaba-700 dark:text-wakaba-300",
              sumi: "from-sumi-500/15 via-sumi-500/5 to-transparent text-sumi-700 dark:text-sumi-300",
            }[t.tone as string];
            return (
              <Link
                key={t.label}
                href={t.href}
                className="group block rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex flex-col gap-3 p-5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${toneCls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t.label}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold tabular-nums">{t.value}</span>
                      <span className="text-xs font-medium text-muted-foreground">{t.diff}</span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground">{t.hint}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* AI / 運用ヘルス */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-ai-600" />
                    7日間 受信トレンド
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">日別の新規受信件数。Webhook経由のみ。</p>
                </div>
                <Badge variant="success">本日 {s.todayProcessed}件処理</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <TrendChart data={s.trend} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-ai-600" />
                AI / 運用メトリクス
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">SPEC §11 監視・アラート準拠</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Metric
                label="AI捕捉率"
                value={`${s.aiCoverage}%`}
                target="≥90%"
                ratio={s.aiCoverage / 100}
                tone={s.aiCoverage >= 70 ? "wakaba" : "akane"}
              />
              <Metric
                label="平均一次応答時間"
                value={`${s.avgFirstResponseMin}分`}
                target="≤5分"
                ratio={Math.max(0, 1 - s.avgFirstResponseMin / 60)}
                tone={s.avgFirstResponseMin <= 10 ? "wakaba" : "akane"}
              />
              <div className="flex items-center justify-between rounded-lg border bg-amber-50/60 p-3 dark:bg-amber-950/20">
                <div className="flex items-center gap-2 text-sm">
                  <Wand2 className="h-4 w-4 text-amber-600" />
                  <div>
                    <div className="font-medium">未紐付け</div>
                    <div className="text-[11px] text-muted-foreground">紐付けToDoキュー</div>
                  </div>
                </div>
                <Link
                  href="/mappings"
                  className="inline-flex items-center gap-1 text-sm font-bold text-amber-700 hover:underline dark:text-amber-300"
                >
                  {s.unmappedCount}件
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertOctagon className="h-4 w-4 text-akane-600" />
                  直近のアクション必要案件
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">優先度・経過時間で TOP 3</p>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tickets">
                  すべて見る
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {s.topActions.length === 0 && (
              <div className="col-span-full rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                未対応案件はありません
              </div>
            )}
            {s.topActions.map((t) => {
              const status = STATUS_BY_VALUE[t.status as keyof typeof STATUS_BY_VALUE] ?? STATUS_BY_VALUE.open;
              const pri = PRIORITIES.find((p) => p.value === t.priority);
              return (
                <Link
                  key={t.id}
                  href={`/tickets/${t.publicId}`}
                  className="group block rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={`${status.bg} ${status.color} ring-1 ${status.ring}`}>{status.label}</Badge>
                    {pri && <Badge className={pri.color}>{pri.label}</Badge>}
                  </div>
                  <div className="mt-3 text-[11px] font-mono text-muted-foreground">{t.publicId}</div>
                  <div className="mt-1 truncate text-sm font-bold">{t.subject}</div>
                  <div className="mt-2 line-clamp-2 text-[12px] text-muted-foreground">{t.preview}</div>
                  <div className="mt-3 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={t.assignee?.image ?? undefined} />
                        <AvatarFallback>{initials(t.assignee?.name ?? "?")}</AvatarFallback>
                      </Avatar>
                      <span className="text-[11px] text-muted-foreground">{t.assignee?.name ?? "未割当"}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {timeAgo(t.createdAt)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </CardContent>
        </Card>

        {/* Footer note */}
        <Card className="border-dashed bg-sumi-50/50 dark:bg-sumi-900/30">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ai-500/10">
              <Link2 className="h-4 w-4 text-ai-600" />
            </div>
            <div className="text-sm leading-relaxed">
              <div className="font-medium">ハイブリッド運用方針 (SPEC §2)</div>
              <p className="mt-0.5 text-muted-foreground">
                受信は本プラットフォーム自動／通常応答はLINE管理画面継続／
                <span className="font-semibold">PUSH配信は Phase 1.5 (7/15〜)</span> から。
                マッピングが充足するまで誤送信防止のためPUSHは保留中。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Metric({
  label,
  value,
  target,
  ratio,
  tone,
}: {
  label: string;
  value: string;
  target: string;
  ratio: number;
  tone: "wakaba" | "akane" | "ai";
}) {
  const toneCls = {
    wakaba: "bg-wakaba-500",
    akane: "bg-akane-500",
    ai: "bg-ai-500",
  }[tone];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full ${toneCls} transition-all`}
          style={{ width: `${Math.max(2, Math.min(100, ratio * 100))}%` }}
        />
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground">目標 {target}</div>
    </div>
  );
}
