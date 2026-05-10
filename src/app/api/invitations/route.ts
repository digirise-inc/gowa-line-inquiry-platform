/**
 * Invitation Collection API
 *  GET   /api/invitations          — 一覧取得 (manager権限のみ / status filter)
 *  POST  /api/invitations          — 招待作成 (manager権限のみ)
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireRole } from "@/lib/api";
import {
  INVITATION_ROLES,
  INVITATION_STATUSES,
  MANAGER_ROLES,
  defaultPermissionsForRole,
  type InvitationRole,
} from "@/lib/constants";
import {
  generateInviteToken,
  getInviteExpiry,
  normalizeEmail,
} from "@/lib/invite-tokens";
import { sendInviteEmail } from "@/lib/email";
import { writeAudit, extractRequestMeta } from "@/lib/audit";
import { serializeInvitation } from "@/lib/invitations";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// GET — 一覧 + statsByStatus
// ─────────────────────────────────────────────
export async function GET(req: Request) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status");

  const where: any = {};
  if (statusFilter && (INVITATION_STATUSES as readonly string[]).includes(statusFilter)) {
    where.status = statusFilter;
  }

  // 期限切れマーク (副作用): pending かつ過ぎたものを expired に
  await db.invitation.updateMany({
    where: { status: "pending", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });

  const [items, statsRaw] = await Promise.all([
    db.invitation.findMany({
      where,
      include: {
        invitedBy: { select: { id: true, name: true, email: true, image: true } },
        emailLogs: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: [{ createdAt: "desc" }],
    }),
    db.invitation.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statsByStatus = Object.fromEntries(
    statsRaw.map((s) => [s.status, s._count._all]),
  ) as Record<string, number>;

  return ok({
    invitations: items.map(serializeInvitation),
    stats: {
      pending: statsByStatus.pending ?? 0,
      accepted: statsByStatus.accepted ?? 0,
      expired: statsByStatus.expired ?? 0,
      revoked: statsByStatus.revoked ?? 0,
      total:
        (statsByStatus.pending ?? 0) +
        (statsByStatus.accepted ?? 0) +
        (statsByStatus.expired ?? 0) +
        (statsByStatus.revoked ?? 0),
    },
  });
}

// ─────────────────────────────────────────────
// POST — 招待作成
// ─────────────────────────────────────────────
const invitationCreateSchema = z.object({
  email: z.string().email("メールアドレス形式が不正です").max(254),
  name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(INVITATION_ROLES),
  title: z.string().trim().max(100).optional(),
  permissions: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  message: z.string().trim().max(2000).optional(),
  expiresInDays: z.number().int().min(1).max(30).optional(),
});

export async function POST(req: Request) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;
  const meta = extractRequestMeta(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = invitationCreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const email = normalizeEmail(data.email);
  const role = data.role as InvitationRole;
  const permissions = data.permissions?.length
    ? data.permissions
    : defaultPermissionsForRole(role);

  // 既存ユーザー or pending招待 を重複チェック
  const [existingUser, existingPending] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.invitation.findFirst({
      where: { email, status: "pending", expiresAt: { gt: new Date() } },
    }),
  ]);

  if (existingUser && existingUser.isActive) {
    return fail("このメールアドレスは既に登録済みです", 409, {
      code: "user_exists",
      userId: existingUser.id,
    });
  }
  if (existingPending) {
    return fail("このメールアドレスは既に招待中です", 409, {
      code: "invitation_pending",
      invitationId: existingPending.id,
    });
  }

  // トークン発行 (極稀な衝突を考慮し最大3回リトライ)
  let token = generateInviteToken();
  for (let i = 0; i < 3; i++) {
    const dup = await db.invitation.findUnique({ where: { token } });
    if (!dup) break;
    token = generateInviteToken();
  }

  const inviterId = (session.user as { id: string }).id;
  const inviterName = session.user?.name ?? "管理者";
  const inviterEmail = session.user?.email ?? null;

  const invitation = await db.invitation.create({
    data: {
      email,
      name: data.name ?? null,
      role,
      title: data.title ?? null,
      permissions: JSON.stringify(permissions),
      token,
      expiresAt: getInviteExpiry(data.expiresInDays ?? 7),
      status: "pending",
      invitedById: inviterId,
      message: data.message ?? null,
    },
    include: {
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const inviteUrl = buildInviteUrl(req, token);

  // メール送信 (失敗してもAuditは残す)
  const sendResult = await sendInviteEmail({
    invitationId: invitation.id,
    to: email,
    name: data.name ?? null,
    inviteUrl,
    role,
    invitedByName: inviterName,
    message: data.message ?? null,
  });

  await writeAudit({
    actorId: inviterId,
    actorEmail: inviterEmail,
    action: "invitation.created",
    targetType: "invitation",
    targetId: invitation.id,
    metadata: {
      email,
      role,
      emailSent: sendResult.ok,
      emailLogId: sendResult.logId,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return ok(
    {
      invitation: serializeInvitation(invitation),
      inviteUrl,
      email: { sent: sendResult.ok, logId: sendResult.logId, error: sendResult.errorMessage },
    },
    { status: 201 },
  );
}

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
function buildInviteUrl(req: Request, token: string): string {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(req.url).origin;
  return `${base.replace(/\/$/, "")}/invite/${encodeURIComponent(token)}`;
}

// serializeInvitation / parsePermissions は src/lib/invitations.ts に分離済み
// （Next.js App Router の API route ファイルは route handler 以外の named export を許容しないため）
