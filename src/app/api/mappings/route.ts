/**
 * LineMapping Collection API
 *  GET    /api/mappings           — 一覧取得 (filter: status, q)
 *  POST   /api/mappings           — マッピング新規作成 (Webhook側で作成済みでも、手動追加にも対応)
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim();

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (q) {
    where.OR = [
      { displayName: { contains: q } },
      { lineUserId: { contains: q } },
      { recentPreview: { contains: q } },
    ];
  }

  const [items, stats] = await Promise.all([
    db.lineMapping.findMany({
      where,
      include: { customer: true, linkedBy: true },
      orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }],
    }),
    db.lineMapping.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const statsByStatus = Object.fromEntries(
    stats.map((s) => [s.status, s._count._all]),
  );

  return ok({
    mappings: items,
    stats: {
      linked: statsByStatus.linked ?? 0,
      unverified: statsByStatus.unverified ?? 0,
      multiple_candidates: statsByStatus.multiple_candidates ?? 0,
      failed: statsByStatus.failed ?? 0,
    },
  });
}

const mappingCreateSchema = z.object({
  lineUserId: z.string().regex(/^U[a-f0-9]{32}$/i, "Invalid LINE userId"),
  displayName: z.string().min(1),
  pictureUrl: z.string().url().optional(),
  status: z
    .enum(["unverified", "linked", "multiple_candidates", "failed"])
    .default("unverified"),
  customerId: z.string().optional(),
  recentPreview: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = mappingCreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const exists = await db.lineMapping.findUnique({ where: { lineUserId: data.lineUserId } });
  if (exists) return fail("Mapping already exists", 409, { id: exists.id });

  const created = await db.lineMapping.create({
    data: {
      lineUserId: data.lineUserId,
      displayName: data.displayName,
      pictureUrl: data.pictureUrl,
      status: data.status,
      customerId: data.customerId,
      recentPreview: data.recentPreview,
    },
    include: { customer: true, linkedBy: true },
  });

  return ok({ mapping: created }, { status: 201 });
}
