"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { DEMO_USERS, type DemoRole } from "@/lib/demo-users";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/**
 * 4 ロール分のワンクリックログインカード。
 *
 * SECURITY: クリックハンドラは固定 DEMO_USERS から role を取り出して
 *   signIn('demo', { role }) に渡す。ユーザー入力からは生成しない。
 */
export function DemoLoginCards({ callbackUrl = "/" }: { callbackUrl?: string }) {
  const [pending, setPending] = useState<DemoRole | null>(null);

  async function loginAs(role: DemoRole) {
    setPending(role);
    try {
      await signIn("demo", {
        role,
        callbackUrl,
        redirect: true,
      });
    } finally {
      // signIn が redirect=true の場合は基本ここに来ない
      setPending(null);
    }
  }

  return (
    <ul
      role="list"
      data-testid="demo-cards"
      className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
    >
      {DEMO_USERS.map((u) => {
        const isPending = pending === u.role;
        return (
          <li key={u.id}>
            <button
              type="button"
              data-testid={`demo-card-${u.role}`}
              data-demo-role={u.role}
              disabled={pending !== null}
              onClick={() => loginAs(u.role)}
              aria-label={`${u.name} としてログイン`}
              className={cn(
                "group relative flex h-full w-full flex-col items-start gap-2 rounded-xl border bg-card p-4 text-left transition-all",
                "hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none",
              )}
            >
              {/* アクセントバー */}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r",
                  u.accent,
                )}
              />

              <div className="flex w-full items-center justify-between">
                <span className="text-2xl" aria-hidden>
                  {u.emoji}
                </span>
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <span className="rounded-full bg-sumi-100 px-2 py-0.5 text-[10px] font-medium text-sumi-700 dark:bg-sumi-800 dark:text-sumi-200">
                    {u.role}
                  </span>
                )}
              </div>

              <div>
                <div className="text-sm font-semibold leading-tight">{u.name}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{u.title}</div>
              </div>

              <p className="line-clamp-2 text-[11px] leading-snug text-muted-foreground">
                {u.description}
              </p>

              <div className="mt-auto flex flex-wrap gap-1 pt-2">
                {u.permissions.slice(0, 3).map((p) => (
                  <span
                    key={p}
                    className="rounded bg-amber-100/70 px-1.5 py-px text-[10px] font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
