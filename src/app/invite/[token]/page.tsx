/**
 * /invite/[token] — 招待トークンを受諾する公開ページ。
 *
 *  - 認証不要 (middleware の PUBLIC_PATHS に追加)
 *  - 中央寄せの招待カード
 *  - 受諾後は /login?email=... へリダイレクト
 *  - エラー時はそれぞれ専用 UI (期限切れ / 取消 / 受諾済 / トークン不正)
 */
import type { Metadata } from "next";
import { InvitationAcceptCard } from "@/components/admin/invitation-accept-card";

export const metadata: Metadata = {
  title: "招待を承諾 | 業務管理プラットフォーム",
};

// 静的に解決できないので force-dynamic
export const dynamic = "force-dynamic";

export default function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-sumi-50 via-background to-ai-50/40 px-4 py-12 dark:from-sumi-900 dark:via-background dark:to-ai-950/20">
      <div className="w-full max-w-lg">
        {/* ロゴ */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ai-500 via-ai-600 to-akane-600 text-white shadow-lg">
            <span className="text-xl font-bold">業</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight">業務管理プラットフォーム</h1>
          <p className="mt-1 text-xs text-muted-foreground">リカーショップゴワ</p>
        </div>

        <InvitationAcceptCard token={params.token} />

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          ご不明点は管理者までお問い合わせください
        </p>
      </div>
    </main>
  );
}
