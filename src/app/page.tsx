import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session) redirect("/login");

  const user = (session.user as any) ?? {};
  const role = user.role ?? "staff_office";
  const isManager = ["kowa", "manager", "finance"].includes(role);

  const tiles = [
    { label: "未対応", value: 9,  color: "from-rose-500 to-rose-600",     hint: "30分以上未対応あり" },
    { label: "対応中", value: 4,  color: "from-blue-500 to-indigo-600",   hint: "正常" },
    { label: "完了",   value: 12, color: "from-emerald-500 to-emerald-600", hint: "本日処理 7件" },
    { label: "失注",   value: 2,  color: "from-slate-500 to-slate-700",   hint: "前日比 -1" },
  ];

  const links = [
    { href: "/tickets",  label: "🗂️ チケット一覧", desc: "全件 / フィルタ / 検索" },
    { href: "/kanban",   label: "📋 カンバン",      desc: "8段階ステータスD&D" },
    { href: "/chat",     label: "💬 チャット",      desc: "LINE / Google Chat / メール" },
    { href: "/mappings", label: "🔗 マッピング",    desc: "userId↔顧客コード紐付け" },
    ...(isManager ? [
      { href: "/admin/users", label: "👥 ユーザー管理", desc: "招待・権限管理" },
      { href: "/settings",    label: "⚙️ 設定",        desc: "通知・連携・保持期間" },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        {/* ヘッダ */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              こんにちは、{user.name ?? "ユーザー"}さん
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {user.title ?? role} ｜ 業務管理プラットフォーム Phase 1.0
            </p>
          </div>
          <Link href="/login?demo=true" className="text-xs text-slate-500 hover:underline">
            🔄 他のロールで試す
          </Link>
        </div>

        {/* KPIタイル */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t) => (
            <div key={t.label} className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${t.color} p-4 text-white shadow-md`}>
              <div className="text-xs font-medium opacity-80">{t.label}</div>
              <div className="mt-1 text-3xl font-bold tabular-nums">{t.value}</div>
              <div className="mt-1 text-[10px] opacity-70">{t.hint}</div>
            </div>
          ))}
        </div>

        {/* ナビカード */}
        <h2 className="mb-3 text-sm font-semibold text-slate-700">主要機能</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
            >
              <div className="text-base font-semibold text-slate-900">{l.label}</div>
              <div className="mt-1 text-xs text-slate-500">{l.desc}</div>
              <div className="mt-3 text-xs text-amber-600 opacity-0 transition group-hover:opacity-100">→ 開く</div>
            </Link>
          ))}
        </div>

        {/* デモ案内 */}
        <div className="mt-10 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-5">
          <div className="text-sm font-bold text-amber-900">🎭 デモモード稼働中</div>
          <p className="mt-1 text-xs text-amber-800">
            表示されている数値はデモ用シードです。本番環境では実データに置き換わります。
            <br />
            各画面の動作デモは上のカードからご覧ください。
          </p>
        </div>
      </div>
    </div>
  );
}
