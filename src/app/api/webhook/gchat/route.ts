/**
 * Google Chat Webhook 受信
 *  POST /api/webhook/gchat
 *
 * GChat スペースへ追加された Bot からの incoming event を受ける。
 * - DEMO_MODE: 認証スキップ
 * - 本番: Bearer Token (GCHAT_VERIFICATION_TOKEN) で検証
 * - GchatThread に reply を蓄積
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { isDemoMode } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.GCHAT_VERIFICATION_TOKEN ?? "";

  if (!isDemoMode() && expected) {
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
  const threadName = payload?.message?.thread?.name ?? "general";

  // mock での処理: スペース＋スレッドを upsert してメッセージを追加
  const space = await db.gchatSpace.findFirst({ where: { name: spaceName } })
    ?? (await db.gchatSpace.create({ data: { name: spaceName } }));

  const existingThread = await db.gchatThread.findFirst({
    where: { spaceId: space.id, subject: threadName },
  });
  const thread = existingThread
    ?? (await db.gchatThread.create({ data: { spaceId: space.id, subject: threadName } }));

  await db.gchatMessage.create({
    data: { threadId: thread.id, senderName, senderImg, content: text || `(${eventType})` },
  });

  return NextResponse.json({ ok: true, eventType });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "gchat-webhook" });
}
