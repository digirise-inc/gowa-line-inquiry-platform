/**
 * API共通ヘルパー
 * - 統一レスポンス形式 { success, data?, error? }
 * - 認証チェック (auth() → 未認証は401)
 * - Zod validation 結果 → 400
 */

import { NextResponse } from "next/server";
import { auth } from "./auth";
import type { ZodError } from "zod";

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
