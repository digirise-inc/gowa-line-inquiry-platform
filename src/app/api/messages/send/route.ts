/**
 * Outbound Message Send API
 *  POST /api/messages/send
 *
 * チケットへ outbound メッセージを送信する mock 実装。
 * channel: line | gchat | email
 *  - line:  pushTextMessage()
 *  - gchat: sendGchatNotification()
 *  - email: 送信モック (メーラー連携は別途)
 *
 * 送信成功時は Message を作成して返す。
 * チケットの firstResponseAt を更新する。
 */

import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail, requireAuth } from "@/lib/api";
import { pushTextMessage } from "@/lib/line";
import { sendGchatNotification } from "@/lib/gchat";

export const dynamic = "force-dynamic";

const sendSchema = z.object({
  ticketId: z.string().min(1),
  channel: z.enum(["line", "gchat", "email", "phone", "manual"]),
  content: z.string().min(1).max(5000),
  to: z.string().optional(), // line userId / email address (channel別)
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
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const { ticketId, channel, content, to } = parsed.data;

  const ticket = await db.ticket.findFirst({
    where: { OR: [{ id: ticketId }, { publicId: ticketId }] },
    include: { customer: true },
  });
  if (!ticket) return fail("Ticket not found", 404);

  // 送信実行 (mock 対応)
  let result: { ok: boolean; demo: boolean; error?: string } = { ok: true, demo: true };
  if (channel === "line") {
    const target = to ?? ticket.lineUserId ?? "";
    if (!target) return fail("LINE userId not specified", 400);
    result = await pushTextMessage({ to: target, text: content });
  } else if (channel === "gchat") {
    result = await sendGchatNotification(`[${ticket.publicId}] ${content}`);
  } else if (channel === "email") {
    // メール送信 mock
    result = { ok: true, demo: true };
  }

  if (!result.ok) {
    return fail(result.error ?? `Failed to send ${channel}`, 502);
  }

  // Messageを記録
  const message = await db.message.create({
    data: {
      ticketId: ticket.id,
      direction: "outbound",
      channel,
      senderId: (session.user as any).id,
      senderName: session.user?.name ?? "システム",
      content,
      contentType: "text",
      lineMessageId: channel === "line" ? `mock_${Date.now()}` : null,
    },
  });

  // チケット側 firstResponseAt 更新
  if (!ticket.firstResponseAt) {
    await db.ticket.update({
      where: { id: ticket.id },
      data: { firstResponseAt: new Date() },
    });
  }

  return ok({ message, deliveryDemo: result.demo });
}
