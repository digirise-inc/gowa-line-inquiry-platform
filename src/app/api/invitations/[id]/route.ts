/**
 * Invitation Single API
 *  GET     /api/invitations/[id]   — 詳細 (manager権限)
 *  DELETE  /api/invitations/[id]   — 取消 (status='revoked' / manager権限)
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, requireRole } from "@/lib/api";
import { MANAGER_ROLES } from "@/lib/constants";
import { writeAudit, extractRequestMeta } from "@/lib/audit";
import { serializeInvitation } from "@/lib/invitations";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;

  const invitation = await db.invitation.findUnique({
    where: { id: params.id },
    include: {
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
      emailLogs: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!invitation) return fail("Invitation not found", 404);
  return ok({ invitation: serializeInvitation(invitation), emailLogs: invitation.emailLogs });
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;
  const meta = extractRequestMeta(req);

  const existing = await db.invitation.findUnique({ where: { id: params.id } });
  if (!existing) return fail("Invitation not found", 404);
  if (existing.status === "revoked") {
    return fail("既に取消済みです", 409, { code: "already_revoked" });
  }
  if (existing.status === "accepted") {
    return fail("受諾済みの招待は取消できません", 409, { code: "already_accepted" });
  }

  const updated = await db.invitation.update({
    where: { id: existing.id },
    data: { status: "revoked" },
    include: {
      invitedBy: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  await writeAudit({
    actorId: (session.user as { id: string }).id,
    actorEmail: session.user?.email ?? null,
    action: "invitation.revoked",
    targetType: "invitation",
    targetId: existing.id,
    metadata: { email: existing.email, role: existing.role },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return ok({ invitation: serializeInvitation(updated) });
}
