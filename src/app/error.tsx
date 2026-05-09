"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-50 p-6">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-3xl">
          ⚙️
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          デモデータを準備中です
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          初回起動時に少々お時間をいただいております。<br />
          下のボタンから再度お試しください。
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow"
          >
            再読み込み
          </button>
          <a
            href="/login"
            className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-sm font-bold text-slate-700"
          >
            ログイン画面へ戻る
          </a>
        </div>
        {error.digest && (
          <p className="mt-4 text-[11px] text-slate-400">エラーID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
