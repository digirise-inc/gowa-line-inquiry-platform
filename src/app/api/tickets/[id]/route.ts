/**
 * Ticket Single API
 *  GET     /api/tickets/[id]
 *  PATCH   /api/tickets/[id]   — status / assignee / handoverNote / lostReason 更新
 *  DELETE  /api/tickets/[id]   — 論理削除なし、Cascade で messages も削除
 *
 * id は Prisma ID または publicId のどちらでも受ける。
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireAuth } from "@/lib/api";

export const dynamic = "force-dynamic";

async function findTicket(id: string) {
  return db.ticket.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: { assignee: true, customer: true, messages: { orderBy: { sentAt: "asc" } } },
  });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const ticket = await findTicket(params.id);
  if (!ticket) return fail("Ticket not found", 404);
  return ok({ ticket });
}

const ticketPatchSchema = z.object({
  status: z
    .enum([
      "open",
      "triaging",
      "internal_check",
      "supplier_quote",
      "awaiting_reply",
      "answered",
      "closed_won",
      "closed_lost",
      "escalated",
    ])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  assigneeId: z.string().nullable().optional(),
  handoverNote: z.string().max(2000).nullable().optional(),
  lostReason: z
    .enum(["out_of_stock", "timing", "price", "competitor", "other"])
    .nullable()
    .optional(),
  lostReasonNote: z.string().max(1000).nullable().optional(),
  subject: z.string().min(1).max(200).optional(),
  customerId: z.string().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const existing = await findTicket(params.id);
  if (!existing) return fail("Ticket not found", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = ticketPatchSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;

  // ステータス遷移にともなうタイムスタンプ更新
  const tsPatch: Record<string, Date | null> = {};
  if (data.status) {
    if (["answered", "closed_won", "closed_lost"].includes(data.status)) {
      tsPatch.answeredAt = new Date();
    }
    if (["closed_won", "closed_lost"].includes(data.status)) {
      tsPatch.closedAt = new Date();
    }
  }

  const ticket = await db.ticket.update({
    where: { id: existing.id },
    data: { ...data, ...tsPatch } as any,
    include: { assignee: true, customer: true, messages: true },
  });

  return ok({ ticket });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const existing = await findTicket(params.id);
  if (!existing) return fail("Ticket not found", 404);

  await db.ticket.delete({ where: { id: existing.id } });
  return ok({ id: existing.id, publicId: existing.publicId });
}
