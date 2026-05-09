/**
 * Invitation Resend API
 *  POST  /api/invitations/[id]/resend  — メール再送 + 期限延長 (manager権限)
 *
 * 仕様:
 *  - status='pending' / 'expired' のみ再送可
 *  - 受諾済 / 取消済は再送不可
 *  - 期限を 7日 (任意で expiresInDays 指定可) 延長し、status を 'pending' へ戻す
 *  - トークンは現状を維持 (再発行はしない: リンク変更による混乱回避のため)
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireRole } from "@/lib/api";
import { MANAGER_ROLES } from "@/lib/constants";
import { getInviteExpiry } from "@/lib/invite-tokens";
import { sendInviteEmail } from "@/lib/email";
import { writeAudit, extractRequestMeta } from "@/lib/audit";
import { serializeInvitation } from "@/lib/invitations";

export const dynamic = "force-dynamic";

const resendSchema = z
  .object({
    expiresInDays: z.number().int().min(1).max(30).optional(),
  })
  .partial();

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;
  const meta = extractRequestMeta(req);

  const existing = await db.invitation.findUnique({
    where: { id: params.id },
    include: { invitedBy: true },
  });
  if (!existing) return fail("Invitation not found", 404);

  if (existing.status === "accepted") {
    return fail("受諾済みの招待は再送できません", 409, { code: "already_accepted" });
  }
  if (existing.status === "revoked") {
    return fail("取消済みの招待は再送できません", 409, { code: "revoked" });
  }

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const parsed = resendSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const days = parsed.data.expiresInDays ?? 7;
  const newExpiry = getInviteExpiry(days);

  const updated = await db.invitation.update({
    where: { id: existing.id },
    data: { status: "pending", expiresAt: newExpiry },
    include: {
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  const inviteUrl = buildInviteUrl(req, existing.token);
  const inviterName = session.user?.name ?? existing.invitedBy?.name ?? "管理者";

  const sendResult = await sendInviteEmail({
    invitationId: updated.id,
    to: updated.email,
    name: updated.name,
    inviteUrl,
    role: updated.role,
    invitedByName: inviterName,
    message: updated.message,
  });

  await writeAudit({
    actorId: (session.user as { id: string }).id,
    actorEmail: session.user?.email ?? null,
    action: "invitation.resent",
    targetType: "invitation",
    targetId: updated.id,
    metadata: {
      email: updated.email,
      role: updated.role,
      newExpiry: newExpiry.toISOString(),
      emailSent: sendResult.ok,
    },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return ok({
    invitation: serializeInvitation(updated),
    inviteUrl,
    email: { sent: sendResult.ok, logId: sendResult.logId, error: sendResult.errorMessage },
  });
}

function buildInviteUrl(req: Request, token: string): string {
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(req.url).origin;
  return `${base.replace(/\/$/, "")}/invite/accept?token=${encodeURIComponent(token)}`;
}
