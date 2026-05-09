/**
 * Invitation シリアライズヘルパー（API route ファイル制約のため別モジュール化）
 */

export function parsePermissions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function serializeInvitation(inv: any) {
  return {
    id: inv.id,
    email: inv.email,
    name: inv.name,
    role: inv.role,
    title: inv.title,
    permissions: parsePermissions(inv.permissions),
    token: inv.token,
    expiresAt: inv.expiresAt,
    status: inv.status,
    invitedBy: inv.invitedBy ?? null,
    invitedById: inv.invitedById,
    acceptedAt: inv.acceptedAt,
    message: inv.message,
    lastEmailLog: inv.emailLogs?.[0] ?? null,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
}
