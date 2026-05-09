/**
 * API共通ヘルパー
 * - 統一レスポンス形式 { success, data?, error? }
 * - 認証チェック (auth() → 未認証は401)
 * - 権限チェック (requireRole / requirePermission)
 * - Zod validation 結果 → 400
 */

import { NextResponse } from "next/server";
import { auth } from "./auth";
import type { ZodError } from "zod";
import type { Session } from "next-auth";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, init);
}

export function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiResponse>(
    { success: false, error, details },
    { status },
  );
}

export function zodFail(error: ZodError) {
  return NextResponse.json<ApiResponse>(
    {
      success: false,
      error: "Validation failed",
      details: error.flatten(),
    },
    { status: 400 },
  );
}

/**
 * 認証必須エンドポイントで使用。
 * 未認証は 401 レスポンスを返し、handler は呼ばれない。
 *
 * 使用例:
 *   export async function GET() {
 *     const session = await requireAuth();
 *     if (session instanceof NextResponse) return session; // 401
 *     ...
 *   }
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  return session;
}

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

/**
 * セッションが指定ロール (allowlist) のいずれかを持つかを検証する。
 * - 未認証 → 401
 * - 権限不一致 → 403
 *
 * デモロール (kowa / staff_office / driver / finance) と
 * Prisma側ロール (manager / staff_office / staff_field / driver / finance) のどちらでも
 * 比較できるよう、role と prismaRole の両方を見る。
 *
 * 使用例:
 *   const session = await requireRole(["manager"]);
 *   if (session instanceof NextResponse) return session;
 */
export async function requireRole(roles: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }
  const user = session.user as { role?: string; prismaRole?: string };
  const allowed = new Set(roles);
  // role / prismaRole どちらかが allowlist に含まれていればOK
  if (
    !(user.role && allowed.has(user.role)) &&
    !(user.prismaRole && allowed.has(user.prismaRole))
  ) {
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }
  return session;
}

/** セッションのロールが指定 allowlist に含まれるかを判定 (boolean) */
export function sessionHasRole(session: Session | null, roles: string[]): boolean {
  if (!session?.user) return false;
  const user = session.user as { role?: string; prismaRole?: string };
  const allowed = new Set(roles);
  return Boolean(
    (user.role && allowed.has(user.role)) ||
      (user.prismaRole && allowed.has(user.prismaRole)),
  );
}

/** マネージャー(管理者) 判定: kowa / manager のいずれか */
export function isManagerSession(session: Session | null): boolean {
  return sessionHasRole(session, ["manager", "kowa"]);
}
