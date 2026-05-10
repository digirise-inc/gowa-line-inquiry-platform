"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Inbox,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Clock,
  AlertOctagon,
  ChevronRight,
} from "lucide-react";

// ────────────────────────────────────────────────────────────
// デモ用チケットデータ（DB依存ゼロ）
// 本番では /api/tickets から取得に切替
// ────────────────────────────────────────────────────────────
type Ticket = {
  id: string;
  publicId: string;
  status: "open" | "triaging" | "internal_check" | "supplier_quote" | "awaiting_reply" | "answered" | "closed_won" | "closed_lost" | "escalated";
  priority: "urgent" | "high" | "normal" | "low";
  channel: "official_line" | "email" | "phone" | "fax" | "appsheet" | "gchat";
  customerName: string;
  customerArea: string;
  content: string;
  assignee: string;
  minsAgo: number;
};

const TICKETS: Ticket[] = [
  { id: "t1",  publicId: "TKT-20260510-001", status: "open",          priority: "urgent", channel: "official_line", customerName: "ビストロKEI",       customerArea: "和歌山市", content: "新メニューに合うワインの提案をいただきたいです。1本2,000円前後で。",                  assignee: "未割当",        minsAgo: 12 },
  { id: "t2",  publicId: "TKT-20260510-002", status: "open",          priority: "urgent", channel: "phone",         customerName: "焼鳥串源",          customerArea: "和歌山市", content: "週末の発注、生ビール樽3本追加できますか？",                                            assignee: "未割当",        minsAgo: 18 },
  { id: "t3",  publicId: "TKT-20260510-003", status: "escalated",     priority: "urgent", channel: "official_line", customerName: "PUB 古都市",        customerArea: "和歌山市", content: "前回の納品で破損があった件、いつ対応してもらえるんですか？",                          assignee: "中尾 花子",     minsAgo: 35 },
  { id: "t4",  publicId: "TKT-20260510-004", status: "triaging",      priority: "high",   channel: "official_line", customerName: "鮨 喜分",           customerArea: "和歌山市", content: "明日のディナータイム用に、純米吟醸の在庫確認お願いします。",                          assignee: "中尾 花子",     minsAgo: 52 },
  { id: "t5",  publicId: "TKT-20260510-005", status: "supplier_quote", priority: "high",   channel: "email",         customerName: "椿の宿 紀州",      customerArea: "白浜町",   content: "梅酒の業務用5L瓶、定期発注の見積もりをお願いします。",                                  assignee: "後和 直樹",     minsAgo: 78 },
  { id: "t6",  publicId: "TKT-20260510-006", status: "internal_check", priority: "high",   channel: "official_line", customerName: "ビストロ LYON",     customerArea: "和歌山市", content: "ナチュラルワインのおすすめ3本ぐらい教えてください。",                                  assignee: "中尾 花子",     minsAgo: 95 },
  { id: "t7",  publicId: "TKT-20260510-007", status: "awaiting_reply", priority: "normal", channel: "phone",         customerName: "中華料理 はせき",   customerArea: "海南市",   content: "業務用紹興酒、24本ケース単位で価格教えてください。",                                  assignee: "後和 直樹",     minsAgo: 120 },
  { id: "t8",  publicId: "TKT-20260510-008", status: "open",          priority: "normal", channel: "official_line", customerName: "とんかつ 優",       customerArea: "和歌山市", content: "ハイボール用ウイスキー、リーズナブルなおすすめありますか？",                          assignee: "未割当",        minsAgo: 145 },
  { id: "t9",  publicId: "TKT-20260510-009", status: "open",          priority: "normal", channel: "email",         customerName: "お好み焼 こがき",   customerArea: "海南市",   content: "サワー用焼酎甲類4Lボトル、月10本ペースで定期配送できますか",                          assignee: "未割当",        minsAgo: 178 },
  { id: "t10", publicId: "TKT-20260510-010", status: "triaging",      priority: "normal", channel: "official_line", customerName: "らーめん 黒衛門",   customerArea: "和歌山市", content: "ビール3種飲み比べセット作りたいので相談乗ってください",                                assignee: "中尾 花子",     minsAgo: 195 },
  { id: "t11", publicId: "TKT-20260510-011", status: "answered",      priority: "normal", channel: "official_line", customerName: "懐石 つるや",       customerArea: "白浜町",   content: "日本酒の燗酒向け銘柄、4合瓶で5種類お送りしました",                                    assignee: "後和 直樹",     minsAgo: 220 },
  { id: "t12", publicId: "TKT-20260510-012", status: "answered",      priority: "low",    channel: "email",         customerName: "ワインバー Libre",   customerArea: "和歌山市", content: "ご予約のシャンパーニュ、明後日17時納品で確定しました",                                  assignee: "中尾 花子",     minsAgo: 280 },
  { id: "t13", publicId: "TKT-20260510-013", status: "closed_won",    priority: "normal", channel: "official_line", customerName: "居酒屋ABC",        customerArea: "和歌山市", content: "ハロウィン企画用カクテル材料一式、納品完了",                                          assignee: "後和 直樹",     minsAgo: 360 },
  { id: "t14", publicId: "TKT-20260510-014", status: "closed_lost",   priority: "low",    channel: "phone",         customerName: "鳥山 西庄店",       customerArea: "和歌山市", content: "プレミアム焼酎の問合せ、他社で先に押さえられて失注",                                  assignee: "中尾 花子",     minsAgo: 480 },
  { id: "t15", publicId: "TKT-20260510-015", status: "open",          priority: "high",   channel: "fax",           customerName: "FCチェーン わかやま店", customerArea: "和歌山市", content: "FAX発注: ビール・酎ハイ各種 計32ケース",                                              assignee: "未割当",        minsAgo: 65 },
];

const STATUS_META = {
  open:           { label: "未対応",        color: "bg-rose-500",    text: "text-rose-700",   bg: "bg-rose-50",    border: "border-rose-200" },
  triaging:       { label: "一次対応中",    color: "bg-blue-500",    text: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200" },
  internal_check: { label: "社内確認中",    color: "bg-indigo-500",  text: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200" },
  supplier_quote: { label: "仕入先見積中",  color: "bg-orange-500",  text: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200" },
  awaiting_reply: { label: "回答待ち",      color: "bg-amber-500",   text: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200" },
  answered:       { label: "回答完了",      color: "bg-emerald-500", text: "text-emerald-700",bg: "bg-emerald-50", border: "border-emerald-200" },
  closed_won:     { label: "案件完了",      color: "bg-green-600",   text: "text-green-700",  bg: "bg-green-50",   border: "border-green-200" },
  closed_lost:    { label: "失注",          color: "bg-rose-700",    text: "text-rose-800",   bg: "bg-rose-50",    border: "border-rose-300" },
  escalated:      { label: "エスカレ",      color: "bg-amber-600",   text: "text-amber-800",  bg: "bg-amber-50",   border: "border-amber-300" },
} as const;

const PRIORITY_META = {
  urgent: { label: "緊急", color: "bg-rose-500 text-white", icon: AlertOctagon },
  high:   { label: "高",   color: "bg-orange-500 text-white", icon: null },
  normal: { label: "通常", color: "bg-slate-200 text-slate-700", icon: null },
  low:    { label: "低",   color: "bg-slate-100 text-slate-500", icon: null },
} as const;

const CHANNEL_META = {
  official_line: { label: "LINE",     icon: "📲" },
  email:         { label: "メール",   icon: "✉️" },
  phone:         { label: "電話",     icon: "📞" },
  fax:           { label: "FAX",      icon: "📠" },
  appsheet:      { label: "AppSheet", icon: "📋" },
  gchat:         { label: "Chat",     icon: "💬" },
} as const;

function timeAgoLabel(mins: number) {
  if (mins < 60) return `${mins}分前`;
  if (mins < 60 * 24) return `${Math.floor(mins / 60)}時間前`;
  return `${Math.floor(mins / (60 * 24))}日前`;
}

// ────────────────────────────────────────────────────────────
// メインコンポーネント
// ────────────────────────────────────────────────────────────
type FilterTab = "all" | "open" | "in_progress" | "done" | "escalated";

export function DashboardClient({
  userName,
  userTitle,
  userRole,
}: {
  userName: string;
  userTitle: string;
  userRole: string;
}) {
  const [tab, setTab] = React.useState<FilterTab>("all");
  const [query, setQuery] = React.useState("");
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");

  const stats = React.useMemo(() => {
    return {
      open: TICKETS.filter((t) => t.status === "open" || t.status === "escalated").length,
      inProgress: TICKETS.filter((t) =>
        ["triaging", "internal_check", "supplier_quote", "awaiting_reply"].includes(t.status),
      ).length,
      done: TICKETS.filter((t) => ["answered", "closed_won"].includes(t.status)).length,
      lost: TICKETS.filter((t) => t.status === "closed_lost").length,
      total: TICKETS.length,
      todayProcessed: 7,
    };
  }, []);

  const assignees = React.useMemo(() => {
    return Array.from(new Set(TICKETS.map((t) => t.assignee))).sort();
  }, []);

  const filtered = React.useMemo(() => {
    let arr = TICKETS;
    if (tab === "open") arr = arr.filter((t) => t.status === "open");
    else if (tab === "in_progress") arr = arr.filter((t) => ["triaging", "internal_check", "supplier_quote", "awaiting_reply"].includes(t.status));
    else if (tab === "done") arr = arr.filter((t) => ["answered", "closed_won"].includes(t.status));
    else if (tab === "escalated") arr = arr.filter((t) => t.status === "escalated");

    if (assigneeFilter !== "all") arr = arr.filter((t) => t.assignee === assigneeFilter);

    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter((t) =>
        t.customerName.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.publicId.toLowerCase().includes(q),
      );
    }
    // 緊急度 → 経過時間でソート
    return [...arr].sort((a, b) => {
      const pri = { urgent: 4, high: 3, normal: 2, low: 1 };
      const da = pri[a.priority];
      const db = pri[b.priority];
      if (da !== db) return db - da;
      return a.minsAgo - b.minsAgo;
    });
  }, [tab, assigneeFilter, query]);

  return (
    <div className="flex h-full flex-col">
      {/* ───── ヘッダ ───── */}
      <div className="border-b bg-white/70 px-6 py-4 backdrop-blur dark:bg-slate-950/40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              こんにちは、{userName}さん
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {userTitle} ｜ ゴワ業務管理プラットフォーム
            </p>
          </div>
          <Link href="/login?demo=true" className="text-xs text-slate-500 hover:text-slate-700 hover:underline">
            🔄 他のロールで試す
          </Link>
        </div>
      </div>

      {/* ───── KPIタイル（コンパクト版） ───── */}
      <div className="grid grid-cols-2 gap-3 border-b bg-slate-50/40 px-6 py-4 sm:grid-cols-4 dark:bg-slate-900/40">
        <KpiTile label="未対応"   value={stats.open}       sub="30分以上 1件"  color="from-rose-500 to-rose-600"     icon={Inbox}        onClick={() => setTab("open")} />
        <KpiTile label="対応中"   value={stats.inProgress} sub="正常"          color="from-blue-500 to-indigo-600"   icon={Loader2}      onClick={() => setTab("in_progress")} />
        <KpiTile label="完了"     value={stats.done}       sub={`本日 ${stats.todayProcessed}件`} color="from-emerald-500 to-emerald-600" icon={CheckCircle2} onClick={() => setTab("done")} />
        <KpiTile label="エスカレ" value={TICKETS.filter(t=>t.status==="escalated").length} sub="要対応" color="from-amber-500 to-amber-600" icon={AlertOctagon} onClick={() => setTab("escalated")} />
      </div>

      {/* ───── フィルタバー + チケット一覧 ───── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b bg-white px-6 py-3 dark:bg-slate-950/40">
          {/* タブフィルタ */}
          <div className="flex rounded-lg border bg-slate-100 p-0.5 dark:bg-slate-900">
            {([
              { id: "all",         label: "全件",       count: TICKETS.length },
              { id: "open",        label: "未対応",     count: stats.open },
              { id: "in_progress", label: "対応中",     count: stats.inProgress },
              { id: "escalated",   label: "エスカレ",   count: TICKETS.filter(t=>t.status==="escalated").length },
              { id: "done",        label: "完了",       count: stats.done },
            ] as { id: FilterTab; label: string; count: number }[]).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition",
                  tab === t.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50",
                )}
              >
                {t.label}
                <span className="ml-1.5 text-[10px] text-slate-400">{t.count}</span>
              </button>
            ))}
          </div>

          {/* 担当者フィルタ */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="all">全担当者</option>
            {assignees.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* 検索 */}
          <div className="relative ml-auto max-w-xs flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="顧客名・内容・チケットIDで検索"
              className="w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          {/* 件数表示 */}
          <div className="text-xs text-slate-500">
            <span className="font-bold text-slate-900 dark:text-slate-100">{filtered.length}件</span>
            <span className="ml-1">/ 全{TICKETS.length}件</span>
          </div>
        </div>

        {/* チケット一覧テーブル */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-900">
              <tr>
                <th className="px-6 py-2 text-left font-medium">ステータス</th>
                <th className="px-3 py-2 text-left font-medium">チケットID</th>
                <th className="px-3 py-2 text-left font-medium">チャネル</th>
                <th className="px-3 py-2 text-left font-medium">顧客</th>
                <th className="px-3 py-2 text-left font-medium">問い合わせ内容</th>
                <th className="px-3 py-2 text-left font-medium">担当</th>
                <th className="px-3 py-2 text-left font-medium">経過</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:bg-slate-950 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-slate-400">
                    該当するチケットはありません
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const meta = STATUS_META[t.status];
                  const pri = PRIORITY_META[t.priority];
                  const ch = CHANNEL_META[t.channel];
                  return (
                    <tr key={t.id} className="group cursor-pointer transition hover:bg-amber-50/30 dark:hover:bg-slate-900/50">
                      <td className="whitespace-nowrap px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-2 w-2 rounded-full", meta.color)} />
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", meta.bg, meta.text, meta.border, "border")}>
                            {meta.label}
                          </span>
                          {t.priority === "urgent" && (
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold", pri.color)}>
                              {pri.label}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-[11px] font-mono text-slate-400">
                        {t.publicId}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">
                        <span className="mr-1">{ch.icon}</span>
                        <span className="text-slate-600 dark:text-slate-300">{ch.label}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-50">{t.customerName}</div>
                        <div className="text-[10px] text-slate-400">{t.customerArea}</div>
                      </td>
                      <td className="max-w-md truncate px-3 py-3 text-sm text-slate-600 dark:text-slate-300">
                        {t.content}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs">
                        {t.assignee === "未割当" ? (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">未割当</span>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300">{t.assignee}</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-xs text-slate-500">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {timeAgoLabel(t.minsAgo)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right">
                        <ChevronRight className="inline h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-amber-500" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* フッタ */}
        <div className="flex items-center justify-between border-t bg-slate-50/40 px-6 py-2 text-[10px] text-slate-400 dark:bg-slate-900/40">
          <div>
            🎭 デモモード稼働中 — 表示データはデモ用シードです
          </div>
          <div className="flex items-center gap-3">
            <span>AI捕捉率: <span className="font-bold text-slate-700 dark:text-slate-200">86%</span></span>
            <span>平均応答: <span className="font-bold text-slate-700 dark:text-slate-200">18分</span></span>
            <span>本日処理: <span className="font-bold text-slate-700 dark:text-slate-200">{stats.todayProcessed}件</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// KPIタイル
// ────────────────────────────────────────────────────────────
function KpiTile({
  label,
  value,
  sub,
  color,
  icon: Icon,
  onClick,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  icon: any;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-gradient-to-br p-3 text-left text-white shadow-sm transition hover:shadow-md hover:-translate-y-0.5",
        color,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-medium uppercase tracking-wider opacity-80">{label}</div>
        {Icon && <Icon className="h-3.5 w-3.5 opacity-60" />}
      </div>
      <div className="mt-0.5 text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-[10px] opacity-75">{sub}</div>
    </button>
  );
}
