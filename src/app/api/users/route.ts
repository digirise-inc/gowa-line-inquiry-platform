/**
 * Users Collection API
 *  GET   /api/users    — ユーザー一覧 (manager権限のみ)
 *
 * レスポンス: { users: [...], stats: { total, active, inactive, byRole: {...} } }
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, requireRole } from "@/lib/api";
import { MANAGER_ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireRole([...MANAGER_ROLES]);
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const role = url.searchParams.get("role");
  const isActive = url.searchParams.get("isActive");
  const q = url.searchParams.get("q")?.trim();

  const where: any = {};
  if (role && role !== "all") where.role = role;
  if (isActive === "1" || isActive === "true") where.isActive = true;
  if (isActive === "0" || isActive === "false") where.isActive = false;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { title: { contains: q } },
      { position: { contains: q } },
    ];
  }

  const [users, total, active, inactive, byRoleRaw] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
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
    }),
    db.user.count(),
    db.user.count({ where: { isActive: true } }),
    db.user.count({ where: { isActive: false } }),
    db.user.groupBy({ by: ["role"], _count: { _all: true } }),
  ]);

  const byRole = Object.fromEntries(
    byRoleRaw.map((r) => [r.role, r._count._all]),
  ) as Record<string, number>;

  return ok({
    users: users.map((u) => ({ ...u, permissions: parsePermissions(u.permissions) })),
    stats: { total, active, inactive, byRole },
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
