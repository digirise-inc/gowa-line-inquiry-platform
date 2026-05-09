/**
 * 監査ログヘルパー
 *
 * - 招待・ユーザー管理など重要操作を AuditLog に記録
 * - 失敗しても本処理を止めない (catch して console.warn)
 */

import { db } from "./prisma";

export type AuditAction =
  | "invitation.created"
  | "invitation.resent"
  | "invitation.revoked"
  | "invitation.accepted"
  | "user.created"
  | "user.updated"
  | "user.role_changed"
  | "user.deactivated"
  | "user.activated";

export type AuditTargetType = "invitation" | "user";

export type WriteAuditParams = {
  actorId?: string | null;
  actorEmail?: string | null;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(p: WriteAuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: p.actorId ?? null,
        actorEmail: p.actorEmail ?? null,
        action: p.action,
        targetType: p.targetType,
        targetId: p.targetId,
        metadata: p.metadata ? JSON.stringify(p.metadata) : null,
        ipAddress: p.ipAddress ?? null,
        userAgent: p.userAgent ?? null,
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[audit] failed to write audit log", { action: p.action, targetId: p.targetId, e });
  }
}

/** Request から ip / UA を抽出する (Vercel / standalone 両対応) */
export function extractRequestMeta(req: Request): { ipAddress: string | null; userAgent: string | null } {
  const h = req.headers;
  const xff = h.get("x-forwarded-for");
  const ipAddress = xff?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent");
  return { ipAddress, userAgent };
}
