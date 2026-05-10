/**
 * メール送信クライアント
 *
 * - DEMO_MODE時: コンソール出力 + InviteEmailLog に保存 (status="sent")
 * - 本番時:      Resend / SendGrid 等の差し込み口 (※実装雛形コメントあり / 既定はmock動作)
 *
 * 招待メール本文は HTML / Plain text 両方を生成する。
 */

import { db } from "./prisma";
import { isDemoMode } from "./api";

export type SendInviteEmailParams = {
  invitationId: string;
  to: string;
  name?: string | null;
  inviteUrl: string;
  role: string;
  invitedByName: string;
  message?: string | null;
};

export type SendInviteEmailResult = {
  ok: boolean;
  providerMsgId?: string;
  errorMessage?: string;
  logId: string;
};

const ROLE_LABEL: Record<string, string> = {
  manager: "マネージャー / 管理者",
  staff_office: "管理部・事務員",
  staff_field: "現場スタッフ",
  driver: "配送ドライバー",
  finance: "経理 / 横断管理",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSubject(invitedByName: string): string {
  return `【業務管理プラットフォーム】${invitedByName}様より招待が届いています`;
}

function buildPlainBody(p: SendInviteEmailParams): string {
  const greet = p.name ? `${p.name} 様` : "ご担当者様";
  const roleLabel = ROLE_LABEL[p.role] ?? p.role;
  const customMsg = p.message?.trim()
    ? `\n────────────────\n${p.invitedByName}さんからのメッセージ\n────────────────\n${p.message}\n`
    : "";

  return [
    `${greet}`,
    "",
    `${p.invitedByName} さんより、業務管理プラットフォームへの招待が届いています。`,
    `付与されるロール: ${roleLabel}`,
    "",
    "下記URLから 7日以内にアカウントを有効化してください。",
    p.inviteUrl,
    customMsg,
    "",
    "──────────────",
    "本メールは送信専用です。",
    "心当たりのない方は破棄してください。",
    "リカーショップゴワ 業務管理プラットフォーム",
    "──────────────",
  ].join("\n");
}

function buildHtmlBody(p: SendInviteEmailParams): string {
  const greet = p.name ? `${escapeHtml(p.name)} 様` : "ご担当者様";
  const roleLabel = ROLE_LABEL[p.role] ?? p.role;
  const customMsg = p.message?.trim()
    ? `<div style="margin:24px 0;padding:16px 20px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:4px;color:#475569;font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(
        p.message,
      )}</div>`
    : "";

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(buildSubject(p.invitedByName))}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Sans','Noto Sans JP',sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.04);overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a,#2563eb);padding:32px 32px 28px;color:#ffffff;">
              <div style="font-size:13px;opacity:0.85;letter-spacing:0.04em;">RIKAR SHOP GOWA</div>
              <h1 style="margin:6px 0 0;font-size:22px;font-weight:700;line-height:1.4;">業務管理プラットフォームへの招待</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#0f172a;">${greet}</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.8;color:#334155;">
                <strong style="color:#1e293b;">${escapeHtml(p.invitedByName)}</strong> さんより、業務管理プラットフォームへの招待が届いています。
              </p>
              <p style="margin:8px 0 24px;font-size:14px;line-height:1.8;color:#475569;">
                付与されるロール: <strong style="color:#1e293b;">${escapeHtml(roleLabel)}</strong>
              </p>
              ${customMsg}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
                <tr>
                  <td style="border-radius:8px;background:#2563eb;">
                    <a href="${escapeHtml(p.inviteUrl)}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
                      アカウントを有効化する
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:12px;color:#64748b;line-height:1.7;">
                ボタンが押せない場合は、下記URLをブラウザに貼り付けてください:
              </p>
              <p style="margin:0 0 24px;font-size:12px;word-break:break-all;">
                <a href="${escapeHtml(p.inviteUrl)}" style="color:#2563eb;text-decoration:underline;">${escapeHtml(p.inviteUrl)}</a>
              </p>
              <div style="margin:24px 0 0;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;line-height:1.7;">
                ※ このリンクは <strong>7日間</strong> 有効です。期限を過ぎた場合は招待者に再送を依頼してください。<br>
                ※ 本メールは送信専用です。心当たりのない場合はそのまま破棄してください。
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 32px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
              リカーショップゴワ 業務管理プラットフォーム
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 招待メールを送信する。
 *
 * 本番運用想定の差し込み雛形 (Resend):
 * ```ts
 * const apiKey = process.env.RESEND_API_KEY;
 * const res = await fetch("https://api.resend.com/emails", {
 *   method: "POST",
 *   headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
 *   body: JSON.stringify({ from: "no-reply@gowa58.co.jp", to, subject, html, text }),
 * });
 * ```
 *
 * DEMO_MODE時は実送信せず、ログのみ DB / コンソールに残す。
 */
export async function sendInviteEmail(
  params: SendInviteEmailParams,
): Promise<SendInviteEmailResult> {
  const subject = buildSubject(params.invitedByName);
  const text = buildPlainBody(params);
  const html = buildHtmlBody(params);

  // 1) ログを queued で先に作成
  const log = await db.inviteEmailLog.create({
    data: {
      invitationId: params.invitationId,
      toEmail: params.to,
      subject,
      bodyText: text,
      bodyHtml: html,
      status: "queued",
    },
  });

  // 2) DEMO_MODE: コンソール出力のみ
  if (isDemoMode() || !process.env.RESEND_API_KEY) {
    // eslint-disable-next-line no-console
    console.log(
      `[email:mock] -> ${params.to}\n  subject: ${subject}\n  url: ${redactInviteUrl(params.inviteUrl)}\n  log: ${log.id}`,
    );
    const updated = await db.inviteEmailLog.update({
      where: { id: log.id },
      data: {
        status: "sent",
        providerMsgId: `mock_${log.id}`,
        sentAt: new Date(),
      },
    });
    return { ok: true, providerMsgId: updated.providerMsgId ?? undefined, logId: log.id };
  }

  // 3) 本番送信 (Resend 想定)
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "no-reply@gowa58.co.jp",
        to: params.to,
        subject,
        html,
        text,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      const updated = await db.inviteEmailLog.update({
        where: { id: log.id },
        data: { status: "failed", errorMessage: `${res.status}: ${errText.slice(0, 500)}` },
      });
      return { ok: false, errorMessage: updated.errorMessage ?? undefined, logId: log.id };
    }
    const json: any = await res.json().catch(() => ({}));
    const updated = await db.inviteEmailLog.update({
      where: { id: log.id },
      data: {
        status: "sent",
        providerMsgId: json?.id ?? null,
        sentAt: new Date(),
      },
    });
    return { ok: true, providerMsgId: updated.providerMsgId ?? undefined, logId: log.id };
  } catch (e: any) {
    const updated = await db.inviteEmailLog.update({
      where: { id: log.id },
      data: { status: "failed", errorMessage: String(e?.message ?? e).slice(0, 500) },
    });
    return { ok: false, errorMessage: updated.errorMessage ?? undefined, logId: log.id };
  }
}

function redactInviteUrl(inviteUrl: string): string {
  try {
    const url = new URL(inviteUrl);
    if (url.searchParams.has("token")) {
      url.searchParams.set("token", "[redacted]");
      return url.toString();
    }
    const parts = url.pathname.split("/");
    if (parts[1] === "invite" && parts[2]) {
      parts[2] = "[redacted]";
      url.pathname = parts.join("/");
      return url.toString();
    }
  } catch {
    // Relative URL or unexpected format: keep only the route shape.
  }
  return inviteUrl.replace(/(\/invite\/)[^/?#]+/, "$1[redacted]");
}
