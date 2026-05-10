/**
 * LINE Webhook 受信
 *  POST /api/webhook/line
 *
 * SPEC §3.1.2:
 *  - X-Line-Signature 検証 (HMAC-SHA256, base64) — DEMO_MODE はスキップ
 *  - 即 200 を返す (LINE仕様)
 *  - 重い処理は非同期キューに渡す (今回は LineMessageLog 書き込み + setImmediate でmock)
 *
 * Webhook 署名検証失敗時のみ 401。raw body を読むため bytes で受ける。
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { verifyLineSignature, normalizeLineMessage } from "@/lib/line";
import { isDemoMode } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("x-line-signature") ?? "";
  const rawBody = await req.text();
  const channelSecret = process.env.LINE_CHANNEL_SECRET ?? "";

  // DEMO_MODE 以外では署名検証を必須にする。secret 未設定でも受信を通さない。
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

  // 即 200 を返すため処理は非同期 (Promise.all を await しない)
  // mock では即時実行しても後続のレスポンスに影響しないので await なしで叩く
  void processEvents(events).catch((e) => console.error("LINE event processing error", e));

  return NextResponse.json({ ok: true, queued: events.length });
}

async function processEvents(events: any[]) {
  for (const event of events) {
    const eventType = event.type ?? "unknown";
    const lineUserId = event.source?.userId ?? null;
    const messageId = event.message?.id ?? null;
    const messageType = event.message?.type ?? null;

    const norm = normalizeLineMessage(event);
    const webhookEventId = event.webhookEventId ?? `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

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
      // 重複 webhookEventId は無視
      continue;
    }

    // mapping upsert
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
  }
}

export async function GET() {
  // ヘルスチェック用
  return NextResponse.json({ ok: true, endpoint: "line-webhook" });
}
