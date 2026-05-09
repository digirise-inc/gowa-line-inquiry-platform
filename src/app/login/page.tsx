import Link from "next/link";
import { DemoLoginCards } from "@/components/auth/demo-login-cards";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";
import { isDemoMode } from "@/lib/demo-users";

export const metadata = {
  title: "ログイン | ゴワ 業務管理",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { from?: string; demo?: string; error?: string };
}) {
  const demo = isDemoMode();
  const from = searchParams?.from ?? "/";
  const showError = searchParams?.error;

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-sumi-50 via-background to-ai-50/40 px-4 py-12 dark:from-sumi-900 dark:via-background dark:to-ai-950/20">
      <div className="w-full max-w-3xl">
        {/* ロゴ + ヘッダー */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ai-500 via-ai-600 to-akane-600 text-white shadow-lg">
            <span className="text-xl font-bold">業</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">業務管理プラットフォーム</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            リカーショップゴワ Phase 1.0
          </p>
        </div>

        {/* エラー表示 */}
        {showError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-akane-200 bg-akane-50 px-4 py-2 text-sm text-akane-800 dark:border-akane-800 dark:bg-akane-950/40 dark:text-akane-200"
          >
            ログインに失敗しました。もう一度お試しください。
          </div>
        )}

        {/* 通常の Google ログイン */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold">Google アカウントでログイン</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            社内 (gowa58.co.jp / digirise.ai) ドメインのアカウントのみ利用できます。
          </p>
          <div className="mt-4">
            <GoogleSignInButton callbackUrl={from} />
          </div>
        </div>

        {/* デモログイン (DEMO_MODE 時のみ) */}
        {demo && (
          <section
            aria-labelledby="demo-heading"
            data-testid="demo-section"
            className="mt-6 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 p-6 shadow-sm dark:border-amber-700 dark:bg-amber-950/20"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2
                  id="demo-heading"
                  className="flex items-center gap-2 text-base font-semibold text-amber-900 dark:text-amber-200"
                >
                  <span aria-hidden>🎭</span>
                  デモアカウントで触る
                  <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
                    お試し用 / ご商談用
                  </span>
                </h2>
                <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-200/70">
                  クリック1回で各ロールのダッシュボードに到達できます。
                </p>
              </div>
            </div>

            <DemoLoginCards callbackUrl={from} />

            <p className="mt-4 text-[11px] leading-relaxed text-amber-900/60 dark:text-amber-200/60">
              ※ 本番環境では <code className="rounded bg-amber-200/40 px-1 py-px">DEMO_MODE</code> を OFF にします。
              表示されているデータはデモ用シードです。
            </p>
          </section>
        )}

        <p className="mt-8 text-center text-[11px] text-muted-foreground">
          ご不明点は{" "}
          <Link href="mailto:n15.gowa@gowa58.co.jp" className="underline">
            管理者
          </Link>
          までお問い合わせください。
        </p>
      </div>
    </main>
  );
}
