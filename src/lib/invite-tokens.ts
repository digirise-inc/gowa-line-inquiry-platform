/**
 * 招待トークン生成・検証ヘルパー
 *
 * - URL-safe なランダムトークン (32 byte → base64url 43 文字)
 * - 既定有効期限 7日
 * - DB照合 + 期限/ステータスチェック
 */

import { randomBytes } from "node:crypto";
import { db } from "./prisma";

/** URL-safe な招待トークンを発行する */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** 招待の有効期限 (デフォルト 7日後) */
export function getInviteExpiry(days = 7): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export type InviteValidation =
  | { ok: true; invitation: NonNullable<Awaited<ReturnType<typeof db.invitation.findUnique>>> }
  | { ok: false; reason: "not_found" | "expired" | "revoked" | "accepted" };

/**
 * 招待トークンを照合し、有効期限・ステータスを検証する。
 * - not_found / expired / revoked / accepted のいずれかで失敗
 * - 期限切れの場合は status を "expired" に副作用更新する
 */
export async function validateInviteToken(token: string): Promise<InviteValidation> {
  if (!token || typeof token !== "string") {
    return { ok: false, reason: "not_found" };
  }
  const invitation = await db.invitation.findUnique({ where: { token } });
  if (!invitation) return { ok: false, reason: "not_found" };

  if (invitation.status === "revoked") return { ok: false, reason: "revoked" };
  if (invitation.status === "accepted") return { ok: false, reason: "accepted" };

  if (invitation.expiresAt.getTime() < Date.now()) {
    if (invitation.status !== "expired") {
      await db.invitation
        .update({ where: { id: invitation.id }, data: { status: "expired" } })
        .catch(() => null);
    }
    return { ok: false, reason: "expired" };
  }

  return { ok: true, invitation };
}

/** メールアドレスの正規化 (lowercase + trim) */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
