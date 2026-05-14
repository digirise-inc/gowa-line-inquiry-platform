/**
 * Google Chat Webhook クライアント (mock 対応)
 */

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export async function sendGchatNotification(text: string): Promise<{ ok: boolean; demo: boolean; error?: string }> {
  const url = process.env.GCHAT_WEBHOOK_URL;
  if (!url) {
    return { ok: true, demo: true };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { ok: false, demo: false, error: `GChat error: ${res.status}` };
    return { ok: true, demo: false };
  } catch (e) {
    return { ok: false, demo: false, error: String(e) };
  }
}
