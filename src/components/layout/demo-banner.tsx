"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * DEMO_MODE 稼働中の細い帯。
 *
 * 制御:
 *   - サーバー環境変数 NEXT_PUBLIC_DEMO_MODE=true でクライアント側に伝播
 *   - DEMO_MODE が立っていない本番ビルドでは何も描画しない
 *
 * 表示内容:
 *   - 🎭 デモモード稼働中
 *   - 現在のユーザー名 (取得できる場合)
 *   - 「他のロールで試す」リンク (ログインページへ)
 */
export function DemoBanner() {
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // SSR / CSR でちらつきを避けるため、マウント後に表示
  useEffect(() => setMounted(true), []);
  if (!isDemo || !mounted) return null;

  const u = session?.user as
    | { name?: string | null; role?: string; title?: string | null }
    | undefined;

  return (
    <div
      role="status"
      aria-label="デモモード稼働中"
      data-testid="demo-banner"
      className="sticky top-0 z-50 flex h-8 items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-4 text-[12px] font-medium text-amber-950 shadow-sm"
    >
      <span aria-hidden>🎭</span>
      <span>デモモード稼働中 — 本番データではありません</span>
      {u?.name ? (
        <span className="hidden md:inline opacity-80">
          / 現在: <strong>{u.name}</strong>
          {u.title ? <span className="ml-1 opacity-70">({u.title})</span> : null}
        </span>
      ) : null}
      <Link
        href="/login?demo=true"
        className="ml-2 rounded-full bg-amber-950/15 px-2 py-0.5 text-[11px] font-semibold text-amber-950 hover:bg-amber-950/25 transition-colors"
      >
        他のロールで試す →
      </Link>
    </div>
  );
}
