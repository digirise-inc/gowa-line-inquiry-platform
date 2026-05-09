/**
 * LINE Messaging API クライアント (mock 対応)
 *
 * - DEMO_MODE=true ではAPIを叩かずローカル成功を返す
 * - 署名検証は HMAC-SHA256 (SPEC §3.1.2)
 */

import crypto from "node:crypto";

export function verifyLineSignature(rawBody: string | Buffer, signature: string, channelSecret: string): boolean {
  if (!channelSecret || !signature) return false;
  const computed = crypto.createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  const a = Buffer.from(computed);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export interface PushMessageRequest {
  to: string; // line userId
  text: string;
}

export async function pushTextMessage({ to, text }: PushMessageRequest): Promise<{ ok: boolean; demo: boolean; messageId?: string; error?: string }> {
  if (isDemoMode() || !process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    // デモ送信成功
    return { ok: true, demo: true, messageId: `mock_${Date.now()}` };
  }
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }],
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, demo: false, error: `LINE API error: ${res.status} ${txt}` };
    }
    return { ok: true, demo: false };
  } catch (e) {
    return { ok: false, demo: false, error: String(e) };
  }
}

export function normalizeLineMessage(event: any): { kind: string; display: string; raw?: any } {
  const m = event?.message;
  if (!m) return { kind: "unknown", display: "(未対応)" };
  switch (m.type) {
    case "text":
      return { kind: "text", display: (m.text ?? "").replace(/https?:\/\/[^\s]+/g, "[URLあり]") };
    case "image":
      return { kind: "image", display: "写真送信" };
    case "video":
      return { kind: "video", display: "動画送信" };
    case "audio":
      return { kind: "audio", display: "音声送信" };
    case "file":
      return { kind: "file", display: `ファイル送信(${m.fileName ?? "unnamed"})` };
    case "sticker":
      return { kind: "sticker", display: "スタンプ送信" };
    case "location":
      return { kind: "location", display: `位置情報: ${m.title ?? ""}` };
    default:
      return { kind: "unknown", display: "(未対応メッセージ)" };
  }
}
