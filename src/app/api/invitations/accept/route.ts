/**
 * Invitation Accept API (公開・認証不要)
 *  GET   /api/invitations/accept?token=xxx  — トークンから招待詳細取得 (期限/取消済チェック)
 *  POST  /api/invitations/accept            — 受諾実行 → User upsert + Invitation status=accepted
 *
 * セキュリティ:
 *  - 公開エンドポイントのため、token以外の入力は最小限に
 *  - email は invitation の値を真とする (URL改竄でも勝手に変えられない)
 *  - 1度受諾されたトークンは再利用不可 (status=accepted)
 *  - 期限切れ/取消済は 410 Gone を返し、理由コードをレスポンスに含める
 */

import { z } from "zod";
import { db } from "@/lib/prisma";
import { ok, fail, zodFail } from "@/lib/api";
import { validateInviteToken, normalizeEmail } from "@/lib/invite-tokens";
import { writeAudit, extractRequestMeta } from "@/lib/audit";
import { defaultPermissionsForRole, type InvitationRole } from "@/lib/constants";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────
// GET — 招待詳細 (公開)
// ─────────────────────────────────────────────
export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  const result = await validateInviteToken(token);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 410;
    return fail(reasonMessage(result.reason), status, { code: result.reason });
  }
  const inv = result.invitation;

  const inviter = await db.user.findUnique({
    where: { id: inv.invitedById },
    select: { id: true, name: true, email: true, image: true },
  });

  return ok({
    invitation: {
      email: inv.email,
      name: inv.name,
      role: inv.role,
      title: inv.title,
      expiresAt: inv.expiresAt,
      status: inv.status,
      message: inv.message,
      invitedBy: inviter ?? null,
    },
  });
}

// ─────────────────────────────────────────────
// POST — 受諾 (公開)
// ─────────────────────────────────────────────
const acceptSchema = z.object({
  token: z.string().min(10).max(200),
  name: z.string().trim().min(1).max(100).optional(),
  image: z.string().url().max(500).optional(),
});

export async function POST(req: Request) {
  const meta = extractRequestMeta(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return zodFail(parsed.error);

  const result = await validateInviteToken(parsed.data.token);
  if (!result.ok) {
    const status = result.reason === "not_found" ? 404 : 410;
    return fail(reasonMessage(result.reason), status, { code: result.reason });
  }
  const inv = result.invitation;
  const email = normalizeEmail(inv.email);
  const role = inv.role as InvitationRole;
  const permissions = parsePermissions(inv.permissions) ?? defaultPermissionsForRole(role);
  const finalName = parsed.data.name?.trim() || inv.name || email.split("@")[0];

  // トランザクション: User upsert + Invitation を accepted に
  const [user, updatedInvitation] = await db.$transaction(async (tx) => {
    const upserted = await tx.user.upsert({
      where: { email },
      update: {
        name: finalName,
        image: parsed.data.image,
        role,
        position: inv.title ?? undefined,
        title: inv.title ?? undefined,
        permissions: JSON.stringify(permissions),
        isActive: true,
        emailVerified: new Date(),
      },
      create: {
        email,
        name: finalName,
        image: parsed.data.image,
        role,
        position: inv.title ?? null,
        title: inv.title ?? null,
        permissions: JSON.stringify(permissions),
        isActive: true,
        emailVerified: new Date(),
      },
    });
    const updated = await tx.invitation.update({
      where: { id: inv.id },
      data: { status: "accepted", acceptedAt: new Date() },
    });
    return [upserted, updated];
  });

  await writeAudit({
    actorId: user.id,
    actorEmail: email,
    action: "invitation.accepted",
    targetType: "invitation",
    targetId: updatedInvitation.id,
    metadata: { email, role, userId: user.id },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  // 受諾後の誘導先 (Google OAuth のヒント付き login URL)
  const base =
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    new URL(req.url).origin;
  const signInUrl = `${base.replace(/\/$/, "")}/login?email=${encodeURIComponent(email)}&accepted=1`;

  return ok({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      image: user.image,
    },
    signInUrl,
  });
}

// ─────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────
function reasonMessage(reason: "not_found" | "expired" | "revoked" | "accepted"): string {
  switch (reason) {
    case "not_found":
      return "招待が見つかりません";
    case "expired":
      return "招待リンクの有効期限が切れています";
    case "revoked":
      return "この招待は取消されています";
    case "accepted":
      return "この招待は既に受諾済みです";
  }
}

function parsePermissions(raw: string | null | undefined): string[] | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}
