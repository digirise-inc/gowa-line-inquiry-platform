/**
 * Mapping Single API
 *  PATCH /api/mappings/[id]
 *    - 紐付け確定: { customerId, status: "linked", linkedMethod }
 *    - 候補追加 / メモ更新等にも対応
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

const mappingPatchSchema = z.object({
  customerId: z.string().nullable().optional(),
  status: z
    .enum(["unverified", "linked", "multiple_candidates", "failed"])
    .optional(),
  linkedMethod: z.enum(["manual", "ai_suggested_confirmed"]).optional(),
  notes: z.string().max(1000).nullable().optional(),
  displayName: z.string().min(1).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const existing = await db.lineMapping.findUnique({ where: { id: params.id } });
  if (!existing) return fail("Mapping not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = mappingPatchSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;

  // customerId が渡された＝紐付け確定
  const linkPatch: Record<string, unknown> = {};
  if (data.customerId !== undefined) {
    if (data.customerId) {
      // customer 存在確認
      const cust = await db.customer.findUnique({ where: { id: data.customerId } });
      if (!cust) return fail("Customer not found", 404);
      linkPatch.customerId = data.customerId;
      linkPatch.status = data.status ?? "linked";
      linkPatch.linkedById = (session.user as any).id;
      linkPatch.linkedAt = new Date();
      linkPatch.linkedMethod = data.linkedMethod ?? "manual";

      // 同じ lineUserId をもつ未紐付けチケットを更新
      await db.ticket.updateMany({
        where: { lineUserId: existing.lineUserId, isUnmapped: true },
        data: { customerId: data.customerId, customerName: cust.name, isUnmapped: false },
      });
    } else {
      linkPatch.customerId = null;
      linkPatch.status = "unverified";
      linkPatch.linkedById = null;
      linkPatch.linkedAt = null;
      linkPatch.linkedMethod = null;
    }
  } else if (data.status) {
    linkPatch.status = data.status;
  }

  if (data.notes !== undefined) linkPatch.notes = data.notes;
  if (data.displayName) linkPatch.displayName = data.displayName;

  const updated = await db.lineMapping.update({
    where: { id: existing.id },
    data: linkPatch as any,
    include: { customer: true, linkedBy: true },
  });

  return ok({ mapping: updated });
}
