/**
 * Google Chat Webhook 受信
 *  POST /api/webhook/gchat
 *
 * - DEMO_MODE: 認証スキップ
 * - 本番: Bearer Token (GCHAT_VERIFICATION_TOKEN) で検証
 * - MESSAGE イベント → Ticket作成 or 同スレッドの既存Ticketへ追記
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { isDemoMode } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.GCHAT_VERIFICATION_TOKEN ?? "";

  if (!isDemoMode()) {
    if (!expected) {
      return new NextResponse(JSON.stringify({ error: "webhook not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (auth !== `Bearer ${expected}`) {
      return new NextResponse(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new NextResponse(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventType = payload?.type ?? "MESSAGE";
  const text = payload?.message?.text ?? "";
  const senderName = payload?.message?.sender?.displayName ?? "GChat User";
  const senderImg = payload?.message?.sender?.avatarUrl ?? null;
  const spaceName = payload?.space?.displayName ?? payload?.space?.name ?? "default";
  // threadName はスレッド固有の識別子 (例: spaces/xxx/threads/yyy)
  const threadName = payload?.message?.thread?.name ?? `${spaceName}/threads/default`;

  // GchatSpace + GchatThread + GchatMessage を保存
  const space =
    (await db.gchatSpace.findFirst({ where: { name: spaceName } })) ??
    (await db.gchatSpace.create({ data: { name: spaceName } }));

  const existingThread = await db.gchatThread.findFirst({
    where: { spaceId: space.id, subject: threadName },
  });
  const thread =
    existingThread ??
    (await db.gchatThread.create({ data: { spaceId: space.id, subject: threadName } }));

  await db.gchatMessage.create({
    data: { threadId: thread.id, senderName, senderImg, content: text || `(${eventType})` },
  });

  // MESSAGE イベントのみ Ticket に反映
  if (eventType === "MESSAGE" && text.trim()) {
    // 同スレッドのオープン中チケットを探す
    const existingTicket = await db.ticket.findFirst({
      where: {
        gchatThreadKey: threadName,
        status: { notIn: ["closed_won", "closed_lost", "answered"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingTicket) {
      // 既存チケットにメッセージを追記
      await db.message.create({
        data: {
          ticketId: existingTicket.id,
          direction: "inbound",
          channel: "gchat",
          senderName,
          contentType: "text",
          content: text,
        },
      });
    } else {
      // 新規チケット作成
      const count = await db.ticket.count();
      const publicId = `TKT-${String(count + 1001).padStart(4, "0")}`;
      const subject = text.slice(0, 80);

      await db.ticket.create({
        data: {
          publicId,
          subject,
          preview: text.slice(0, 200),
          channel: "gchat",
          kind: "inbound",
          category: "inquiry",
          status: "open",
          priority: "normal",
          gchatThreadKey: threadName,
          customerName: senderName,
          isUnmapped: false,
          messages: {
            create: {
              direction: "inbound",
              channel: "gchat",
              senderName,
              contentType: "text",
              content: text,
            },
          },
        },
      });
    }
  }

  return NextResponse.json({ ok: true, eventType });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "gchat-webhook" });
}
