/**
 * Users Single API
 *  GET    /api/users/[id]    — 詳細 (manager権限)
 *  PATCH  /api/users/[id]    — ロール変更 / 無効化 (manager権限)
 *
 * 安全策:
 *  - 自分自身を無効化することはできない
 *  - manager の最後の1人を無効化/降格するのは禁止
 *  - 招待ロール allowlist でしかロール変更できない
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireRole } from "@/lib/api";
import {
  INVITATION_ROLES,
  MANAGER_ROLES,
  defaultPermissionsForRole,
  type InvitationRole,
} from "@/lib/constants";
import { writeAudit, extractRequestMeta } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      position: true,
      title: true,
      permissions: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return fail("User not found", 404);
  return ok({
    user: { ...user, permissions: parsePermissions(user.permissions) },
  });
}

const userPatchSchema = z
  .object({
    role: z.enum(INVITATION_ROLES).optional(),
    title: z.string().trim().max(100).nullable().optional(),
    position: z.string().trim().max(100).nullable().optional(),
    permissions: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    isActive: z.boolean().optional(),
    name: z.string().trim().min(1).max(100).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "更新項目がありません" });

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;
  const meta = extractRequestMeta(req);
  const actorId = (session.user as { id: string }).id;

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) return fail("User not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = userPatchSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);
  const data = parsed.data;

  // 自分自身の無効化はNG
  if (data.isActive === false && target.id === actorId) {
    return fail("自分自身を無効化することはできません", 400, { code: "self_deactivate" });
  }

  // manager 最後の1人ガード
  if (
    (data.role && data.role !== "manager" && target.role === "manager") ||
    (data.isActive === false && target.role === "manager")
  ) {
    const activeManagers = await db.user.count({
      where: { role: "manager", isActive: true, NOT: { id: target.id } },
    });
    if (activeManagers === 0) {
      return fail("有効な manager が0人になるためこの操作は実行できません", 400, {
        code: "last_manager",
      });
    }
  }

  const newRole = data.role as InvitationRole | undefined;
  const newPermissions = data.permissions
    ? data.permissions
    : newRole
      ? defaultPermissionsForRole(newRole)
      : undefined;

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.position !== undefined) updateData.position = data.position;
  if (newPermissions !== undefined) updateData.permissions = JSON.stringify(newPermissions);
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  const updated = await db.user.update({
    where: { id: target.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      position: true,
      title: true,
      permissions: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Audit (役割変更 / 状態変更を別アクションで記録)
  if (data.role && data.role !== target.role) {
    await writeAudit({
      actorId,
      actorEmail: session.user?.email ?? null,
      action: "user.role_changed",
      targetType: "user",
      targetId: target.id,
      metadata: { from: target.role, to: data.role, email: target.email },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }
  if (data.isActive !== undefined && data.isActive !== target.isActive) {
    await writeAudit({
      actorId,
      actorEmail: session.user?.email ?? null,
      action: data.isActive ? "user.activated" : "user.deactivated",
      targetType: "user",
      targetId: target.id,
      metadata: { email: target.email },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }
  // 単純な属性更新も記録 (役割/状態以外)
  if (
    (data.name !== undefined || data.title !== undefined || data.position !== undefined ||
      data.permissions !== undefined) &&
    !data.role &&
    data.isActive === undefined
  ) {
    await writeAudit({
      actorId,
      actorEmail: session.user?.email ?? null,
      action: "user.updated",
      targetType: "user",
      targetId: target.id,
      metadata: { fields: Object.keys(updateData) },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  return ok({
    user: { ...updated, permissions: parsePermissions(updated.permissions) },
  });
}

function parsePermissions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
