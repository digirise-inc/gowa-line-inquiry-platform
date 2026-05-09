/**
 * Ticket Collection API
 *  GET    /api/tickets        — 一覧取得 (filter: status, assigneeId, channel, category, isUnmapped)
 *  POST   /api/tickets        — チケット新規作成
 */

import { z } from "zod";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireAuth } from "@/lib/api";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await requireAuth();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const assigneeId = url.searchParams.get("assigneeId");
  const channel = url.searchParams.get("channel");
  const category = url.searchParams.get("category");
  const isUnmapped = url.searchParams.get("isUnmapped") === "1";

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (assigneeId && assigneeId !== "all") where.assigneeId = assigneeId;
  if (channel && channel !== "all") where.channel = channel;
  if (category && category !== "all") where.category = category;
  if (isUnmapped) where.isUnmapped = true;

  const tickets = await db.ticket.findMany({
    where,
    include: { assignee: true, customer: true, messages: { orderBy: { sentAt: "asc" } } },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
  return ok({ tickets, count: tickets.length });
}

const ticketCreateSchema = z.object({
  subject: z.string().min(1).max(200),
  preview: z.string().min(1).max(500),
  channel: z.enum(["official_line", "email", "phone", "manual", "gchat"]).default("manual"),
  kind: z.enum(["inbound", "outbound"]).default("inbound"),
  category: z
    .enum(["inquiry", "order", "delivery", "billing", "claim", "other"])
    .default("inquiry"),
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
    .default("open"),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  lineUserId: z.string().optional(),
  isUnmapped: z.boolean().optional(),
  assigneeId: z.string().optional(),
  initialMessage: z.string().optional(),
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

  const parsed = ticketCreateSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const data = parsed.data;
  const seq = (await db.ticket.count()) + 1001;
  const publicId = `TKT-${String(seq).padStart(4, "0")}`;

  const ticket = await db.ticket.create({
    data: {
      publicId,
      subject: data.subject,
      preview: data.preview,
      channel: data.channel,
      kind: data.kind,
      category: data.category,
      status: data.status,
      priority: data.priority,
      customerId: data.customerId,
      customerName: data.customerName,
      lineUserId: data.lineUserId,
      isUnmapped: data.isUnmapped ?? false,
      assigneeId: data.assigneeId,
      messages: data.initialMessage
        ? {
            create: {
              direction: "internal",
              channel: "manual",
              senderId: (session.user as any).id,
              senderName: session.user?.name ?? "システム",
              content: data.initialMessage,
              contentType: "text",
            },
          }
        : undefined,
    },
    include: { assignee: true, customer: true, messages: true },
  });

  return ok({ ticket }, { status: 201 });
}
