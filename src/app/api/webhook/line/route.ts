/**
 * LINE Webhook 受信
 *  POST /api/webhook/line
 *
 * SPEC §3.1.2:
 *  - X-Line-Signature 検証 (HMAC-SHA256, base64) — DEMO_MODE はスキップ
 *  - 即 200 を返す (LINE仕様)
 *  - LineMessageLog 書き込み → Ticket作成 or 既存Ticketへ追記
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyLineSignature, normalizeLineMessage } from "@/lib/line";
import { isDemoMode } from "@/lib/api";
import { sendGchatNotification } from "@/lib/gchat";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function isNewTopic(existingSubject: string, newMessage: string): Promise<boolean> {
  if (!process.env.ANTHROPIC_API_KEY) return false;
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 16,
      messages: [{
        role: "user",
        content: `あなたはカスタマーサポートのAIです。\n既存チケットの件名:「${existingSubject}」\n新しいメッセージ:「${newMessage}」\nこれは既存チケットとは別の新しい問い合わせですか？YESまたはNOのみで答えてください。`,
      }],
    });
    const text = res.content[0].type === "text" ? res.content[0].text.trim().toUpperCase() : "NO";
    return text.startsWith("YES");
  } catch {
    return false;
  }
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("x-line-signature") ?? "";
  const rawBody = await req.text();
  const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";

  if (!isDemoMode()) {
    if (!channelSecret) {
      console.warn("LINE Webhook: missing channel secret");
      return new NextResponse(JSON.stringify({ error: "webhook not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!verifyLineSignature(rawBody, signature, channelSecret)) {
      console.warn("LINE Webhook: invalid signature");
      return new NextResponse(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse(JSON.stringify({ error: "invalid json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const events: any[] = payload?.events ?? [];

  await processEvents(events).catch((e) => console.error("LINE event processing error", e));

  return NextResponse.json({ ok: true, queued: events.length });
}

async function processEvents(events: any[]) {
  for (const event of events) {
    const eventType = event.type ?? "unknown";
    const lineUserId = event.source?.userId ?? null;
    const messageId = event.message?.id ?? null;
    const messageType = event.message?.type ?? null;

    const norm = normalizeLineMessage(event);
    const webhookEventId =
      event.webhookEventId ??
      `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // LineMessageLog を先に書いて重複を防ぐ
    try {
      await db.lineMessageLog.create({
        data: {
          webhookEventId,
          lineUserId,
          messageId,
          eventType,
          messageType,
          rawPayload: JSON.stringify(event),
          signatureValid: true,
          processedAt: new Date(),
        },
      });
    } catch {
      // 重複 webhookEventId はスキップ
      continue;
    }

    // LineMapping を upsert
    if (lineUserId) {
      const mapping = await db.lineMapping.findUnique({ where: { lineUserId } });
      if (mapping) {
        await db.lineMapping.update({
          where: { id: mapping.id },
          data: {
            lastSeenAt: new Date(),
            messageCount: { increment: 1 },
            recentPreview: norm.display.slice(0, 120),
          },
        });
      } else {
        await db.lineMapping.create({
          data: {
            lineUserId,
            displayName: event.source?.userName ?? "(unknown)",
            status: "unverified",
            messageCount: 1,
            recentPreview: norm.display.slice(0, 120),
          },
        });
      }
    }

    // message イベントのみ Ticket に反映
    if (eventType !== "message" || !lineUserId) continue;

    const mapping = await db.lineMapping.findUnique({ where: { lineUserId } });
    const customerId =
      mapping?.status === "linked" ? (mapping.customerId ?? undefined) : undefined;
    const senderName =
      mapping?.displayName ?? event.source?.userName ?? lineUserId;
    const sentAt = event.timestamp ? new Date(event.timestamp) : new Date();

    // 同ユーザーのオープン中チケットを探す（クローズ済みは除外）
    const existingTicket = await db.ticket.findFirst({
      where: {
        lineUserId,
        status: { notIn: ["closed_won", "closed_lost", "answered"] },
      },
      orderBy: { createdAt: "desc" },
    });

    let ticketId: string;

    // AIで新トピック判定（新トピックなら新チケット作成）
    const newTopic = existingTicket
      ? await isNewTopic(existingTicket.subject, norm.display)
      : false;

    if (existingTicket && !newTopic) {
      // 既存チケットにメッセージを追記
      await db.message.create({
        data: {
          ticketId: existingTicket.id,
          direction: "inbound",
          channel: "line",
          senderName,
          contentType: norm.kind,
          content: norm.display,
          lineMessageId: messageId ?? undefined,
          sentAt,
        },
      });
      ticketId = existingTicket.id;
      void sendGchatNotification(`💬 チケット追記 [${existingTicket.publicId}]\n👤 ${senderName}\n💬 ${norm.display.slice(0, 100)}`);
    } else {
      // 新規チケット作成
      const count = await db.ticket.count();
      const publicId = `TKT-${String(count + 1001).padStart(4, "0")}`;
      const subject =
        norm.kind === "text"
          ? norm.display.slice(0, 80)
          : `${senderName}: ${norm.display}`;

      const ticket = await db.ticket.create({
        data: {
          publicId,
          subject,
          preview: norm.display.slice(0, 200),
          channel: "official_line",
          kind: "inbound",
          category: "inquiry",
          status: "open",
          priority: "normal",
          lineUserId,
          isUnmapped: !customerId,
          customerId: customerId ?? undefined,
          customerName: senderName,
          messages: {
            create: {
              direction: "inbound",
              channel: "line",
              senderName,
              contentType: norm.kind,
              content: norm.display,
              lineMessageId: messageId ?? undefined,
              sentAt,
            },
          },
        },
      });
      ticketId = ticket.id;
      void sendGchatNotification(`🎫 新規チケット作成 [${ticket.publicId}]\n👤 ${senderName}\n💬 ${norm.display.slice(0, 100)}`);
    }

    // LineMessageLog にチケットIDを記録
    await db.lineMessageLog.update({
      where: { webhookEventId },
      data: { ticketId },
    });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "line-webhook" });
}
