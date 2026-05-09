/**
 * 招待・ユーザー管理画面用のモック層。
 *
 * バックエンド (`/api/invitations`, `/api/users`) が未実装でも
 * フロント単独で動かせるようにスタブを提供する。
 *
 *  - 同期型: 一覧 / 統計 (`mockInitialState()`)
 *  - 非同期型: API ラッパー (`fetchInvitations()`, `createInvitation()` 等)
 *    - 実 API が成功したらそれを返す
 *    - 失敗 / 404 / ネットワークエラー時は in-memory のモックで応答
 *
 * ブラウザリロードで mock がリセットされるのは想定挙動。
 */

import type { DemoPermission } from "./demo-users";

// ────────────────────────────────────────────────────────────
// 型定義
// ────────────────────────────────────────────────────────────

export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type InvitationRole =
  | "manager"
  | "staff_office"
  | "staff_field"
  | "finance"
  | "driver";

export type Invitation = {
  id: string;
  email: string;
  name: string | null;
  role: InvitationRole;
  title: string | null;
  permissions: DemoPermission[] | null;
  token: string;
  expiresAt: string; // ISO
  status: InvitationStatus;
  invitedById: string;
  invitedByName: string;
  invitedByEmail: string;
  acceptedAt: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManagedUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: InvitationRole;
  title: string | null;
  permissions: DemoPermission[] | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  invitationId: string | null;
};

export type InvitationStats = {
  totalUsers: number;
  activeUsers: number;
  pendingInvitations: number;
  expiredInvitations: number;
};

// ────────────────────────────────────────────────────────────
// ロール定義 (ドロップダウン用)
// ────────────────────────────────────────────────────────────

export const ROLE_OPTIONS: {
  value: InvitationRole;
  label: string;
  description: string;
  defaultPermissions: DemoPermission[];
  color: string; // tailwind classes for badge
}[] = [
  {
    value: "manager",
    label: "後和専務 / 管理者",
    description: "全件閲覧・全機能利用・経営判断",
    defaultPermissions: ["admin", "manager", "view_all"],
    color:
      "bg-ai-100 text-ai-800 dark:bg-ai-950/40 dark:text-ai-200 ring-ai-200 dark:ring-ai-800",
  },
  {
    value: "staff_office",
    label: "管理部・事務員",
    description: "LINE 一次対応・マッピング",
    defaultPermissions: ["view_assigned", "create_ticket", "mapping"],
    color:
      "bg-wakaba-100 text-wakaba-800 dark:bg-wakaba-950/40 dark:text-wakaba-200 ring-wakaba-200 dark:ring-wakaba-800",
  },
  {
    value: "staff_field",
    label: "営業ドライバー",
    description: "現場対応・モバイル想定",
    defaultPermissions: ["view_self", "mobile"],
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200 ring-purple-200 dark:ring-purple-800",
  },
  {
    value: "driver",
    label: "営業ドライバー (旧)",
    description: "現場ドライバー・自分担当のみ",
    defaultPermissions: ["view_self", "mobile"],
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200 ring-purple-200 dark:ring-purple-800",
  },
  {
    value: "finance",
    label: "経理 / 横断管理",
    description: "KPI 閲覧・数値見える化",
    defaultPermissions: ["view_all", "kpi"],
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 ring-amber-200 dark:ring-amber-800",
  },
];

export function getRoleOption(role: string | null | undefined) {
  return ROLE_OPTIONS.find((r) => r.value === role) ?? null;
}

// ────────────────────────────────────────────────────────────
// ステータスバッジ
// ────────────────────────────────────────────────────────────

export const INVITATION_STATUS_META: Record<
  InvitationStatus,
  { label: string; color: string; description: string }
> = {
  pending: {
    label: "ペンディング",
    color:
      "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 ring-1 ring-amber-200 dark:ring-amber-800",
    description: "受諾待ち",
  },
  accepted: {
    label: "受諾済",
    color:
      "bg-wakaba-100 text-wakaba-800 dark:bg-wakaba-950/40 dark:text-wakaba-200 ring-1 ring-wakaba-200 dark:ring-wakaba-800",
    description: "アカウント作成済み",
  },
  revoked: {
    label: "取消済",
    color:
      "bg-sumi-200 text-sumi-700 dark:bg-sumi-800 dark:text-sumi-200 ring-1 ring-sumi-300 dark:ring-sumi-700",
    description: "管理者により取消",
  },
  expired: {
    label: "失効",
    color:
      "bg-akane-100 text-akane-800 dark:bg-akane-950/40 dark:text-akane-200 ring-1 ring-akane-200 dark:ring-akane-800",
    description: "有効期限切れ",
  },
};

// ────────────────────────────────────────────────────────────
// 内部 in-memory ストア (一覧 + 単一トークン)
// ────────────────────────────────────────────────────────────

const NOW = Date.now();
const days = (n: number) => new Date(NOW + n * 86_400_000).toISOString();
const ago = (n: number) => new Date(NOW - n * 86_400_000).toISOString();
const minsAgo = (m: number) => new Date(NOW - m * 60_000).toISOString();

const seedUsers: ManagedUser[] = [
  {
    id: "demo-kowa",
    name: "後和 直樹",
    email: "demo+kowa@gowa58.co.jp",
    image:
      "https://api.dicebear.com/9.x/initials/png?seed=GN&backgroundColor=274af0",
    role: "manager",
    title: "専務 / 管理者",
    permissions: ["admin", "manager", "view_all"],
    isActive: true,
    lastLoginAt: minsAgo(12),
    createdAt: ago(180),
    invitationId: null,
  },
  {
    id: "demo-nakao",
    name: "中尾 花子",
    email: "demo+nakao@gowa58.co.jp",
    image:
      "https://api.dicebear.com/9.x/initials/png?seed=NH&backgroundColor=28b53d",
    role: "staff_office",
    title: "管理部・事務員",
    permissions: ["view_assigned", "create_ticket", "mapping"],
    isActive: true,
    lastLoginAt: minsAgo(45),
    createdAt: ago(120),
    invitationId: "inv-accepted-1",
  },
  {
    id: "demo-tanaka",
    name: "田中 健",
    email: "demo+tanaka@gowa58.co.jp",
    image:
      "https://api.dicebear.com/9.x/initials/png?seed=TK&backgroundColor=8b5cf6",
    role: "driver",
    title: "営業ドライバー",
    permissions: ["view_self", "mobile"],
    isActive: true,
    lastLoginAt: ago(2),
    createdAt: ago(90),
    invitationId: "inv-accepted-2",
  },
  {
    id: "demo-tsujino",
    name: "辻野 和彦",
    email: "demo+tsujino@gowa58.co.jp",
    image:
      "https://api.dicebear.com/9.x/initials/png?seed=TZ&backgroundColor=f59e0b",
    role: "finance",
    title: "経理 / 横断管理",
    permissions: ["view_all", "kpi"],
    isActive: true,
    lastLoginAt: minsAgo(180),
    createdAt: ago(150),
    invitationId: null,
  },
  {
    id: "user-yamada",
    name: "山田 太郎",
    email: "yamada@gowa58.co.jp",
    image:
      "https://api.dicebear.com/9.x/initials/png?seed=YT&backgroundColor=64748b",
    role: "staff_field",
    title: "営業ドライバー",
    permissions: ["view_self", "mobile"],
    isActive: true,
    lastLoginAt: ago(7),
    createdAt: ago(40),
    invitationId: null,
  },
  {
    id: "user-suzuki",
    name: "鈴木 一郎",
    email: "suzuki@gowa58.co.jp",
    image:
      "https://api.dicebear.com/9.x/initials/png?seed=SI&backgroundColor=64748b",
    role: "staff_office",
    title: "管理部",
    permissions: ["view_assigned", "create_ticket"],
    isActive: false,
    lastLoginAt: ago(60),
    createdAt: ago(110),
    invitationId: null,
  },
];

const seedInvitations: Invitation[] = [
  {
    id: "inv-pending-1",
    email: "saito@gowa58.co.jp",
    name: "齋藤 美香",
    role: "staff_office",
    title: "管理部・事務員",
    permissions: ["view_assigned", "create_ticket", "mapping"],
    token: "demo-token-pending-saito",
    expiresAt: days(5),
    status: "pending",
    invitedById: "demo-kowa",
    invitedByName: "後和 直樹",
    invitedByEmail: "demo+kowa@gowa58.co.jp",
    acceptedAt: null,
    message:
      "管理部への参加ありがとうございます。LINE 一次対応のサポートをお願いします。",
    createdAt: ago(1),
    updatedAt: ago(1),
  },
  {
    id: "inv-pending-2",
    email: "kobayashi@gowa58.co.jp",
    name: "小林 健太",
    role: "staff_field",
    title: "営業ドライバー",
    permissions: ["view_self", "mobile"],
    token: "demo-token-pending-kobayashi",
    expiresAt: days(6),
    status: "pending",
    invitedById: "demo-kowa",
    invitedByName: "後和 直樹",
    invitedByEmail: "demo+kowa@gowa58.co.jp",
    acceptedAt: null,
    message: null,
    createdAt: minsAgo(180),
    updatedAt: minsAgo(180),
  },
  {
    id: "inv-pending-3",
    email: "morita@digirise.ai",
    name: null,
    role: "manager",
    title: null,
    permissions: ["admin", "manager", "view_all"],
    token: "demo-token-pending-morita",
    expiresAt: days(2),
    status: "pending",
    invitedById: "demo-kowa",
    invitedByName: "後和 直樹",
    invitedByEmail: "demo+kowa@gowa58.co.jp",
    acceptedAt: null,
    message: "デジライズチームから管理サポートでのご参加です。",
    createdAt: ago(5),
    updatedAt: ago(5),
  },
  {
    id: "inv-accepted-1",
    email: "demo+nakao@gowa58.co.jp",
    name: "中尾 花子",
    role: "staff_office",
    title: "管理部・事務員",
    permissions: ["view_assigned", "create_ticket", "mapping"],
    token: "demo-token-accepted-nakao",
    expiresAt: ago(60),
    status: "accepted",
    invitedById: "demo-kowa",
    invitedByName: "後和 直樹",
    invitedByEmail: "demo+kowa@gowa58.co.jp",
    acceptedAt: ago(115),
    message: null,
    createdAt: ago(120),
    updatedAt: ago(115),
  },
  {
    id: "inv-accepted-2",
    email: "demo+tanaka@gowa58.co.jp",
    name: "田中 健",
    role: "driver",
    title: "営業ドライバー",
    permissions: ["view_self", "mobile"],
    token: "demo-token-accepted-tanaka",
    expiresAt: ago(60),
    status: "accepted",
    invitedById: "demo-kowa",
    invitedByName: "後和 直樹",
    invitedByEmail: "demo+kowa@gowa58.co.jp",
    acceptedAt: ago(85),
    message: null,
    createdAt: ago(90),
    updatedAt: ago(85),
  },
  {
    id: "inv-revoked-1",
    email: "test-revoked@gowa58.co.jp",
    name: "退会済テスト",
    role: "staff_office",
    title: "管理部",
    permissions: ["view_assigned", "create_ticket"],
    token: "demo-token-revoked",
    expiresAt: ago(2),
    status: "revoked",
    invitedById: "demo-kowa",
    invitedByName: "後和 直樹",
    invitedByEmail: "demo+kowa@gowa58.co.jp",
    acceptedAt: null,
    message: null,
    createdAt: ago(20),
    updatedAt: ago(15),
  },
  {
    id: "inv-expired-1",
    email: "expired-sample@gowa58.co.jp",
    name: null,
    role: "finance",
    title: "経理",
    permissions: ["view_all", "kpi"],
    token: "demo-token-expired",
    expiresAt: ago(3),
    status: "expired",
    invitedById: "demo-kowa",
    invitedByName: "後和 直樹",
    invitedByEmail: "demo+kowa@gowa58.co.jp",
    acceptedAt: null,
    message: null,
    createdAt: ago(15),
    updatedAt: ago(15),
  },
];

// in-memory ストア (リロードでリセット)
const mockUsers: ManagedUser[] = [...seedUsers];
const mockInvitations: Invitation[] = [...seedInvitations];

// ────────────────────────────────────────────────────────────
// パブリック API (フロントから呼ぶ)
// ────────────────────────────────────────────────────────────

function computeStats(): InvitationStats {
  const now = Date.now();
  return {
    totalUsers: mockUsers.length,
    activeUsers: mockUsers.filter((u) => u.isActive).length,
    pendingInvitations: mockInvitations.filter(
      (i) => i.status === "pending" && new Date(i.expiresAt).getTime() > now,
    ).length,
    expiredInvitations: mockInvitations.filter(
      (i) =>
        i.status === "expired" ||
        (i.status === "pending" && new Date(i.expiresAt).getTime() <= now),
    ).length,
  };
}

/** ページの初回レンダ時に使用する SSR-safe な状態 */
export function mockInitialState() {
  return {
    users: [...mockUsers],
    invitations: [...mockInvitations],
    stats: computeStats(),
  };
}

async function tryFetch<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false }> {
  try {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
    });
    if (!res.ok) return { ok: false };
    const json = (await res.json()) as { success?: boolean; data?: T };
    if (json && json.success && json.data !== undefined) {
      return { ok: true, data: json.data };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function fetchInvitations(status?: InvitationStatus) {
  const qs = status ? `?status=${status}` : "";
  const result = await tryFetch<{ invitations: Invitation[] }>(
    `/api/invitations${qs}`,
  );
  if (result.ok) return result.data.invitations;
  // mock fallback
  return mockInvitations.filter((i) => (status ? i.status === status : true));
}

export async function fetchUsers() {
  const result = await tryFetch<{ users: ManagedUser[] }>("/api/users");
  if (result.ok) return result.data.users;
  return [...mockUsers];
}

export type CreateInvitationInput = {
  email: string;
  name?: string | null;
  role: InvitationRole;
  title?: string | null;
  permissions?: DemoPermission[];
  message?: string | null;
};

export type CreateInvitationResult = {
  invitation: Invitation;
  inviteUrl: string;
};

export async function createInvitation(
  input: CreateInvitationInput,
  invitedBy: { id: string; name: string; email: string },
): Promise<CreateInvitationResult> {
  // まず実APIを叩いてみる
  try {
    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        success?: boolean;
        data?: { invitation: Invitation; inviteUrl?: string };
      };
      if (json.success && json.data?.invitation) {
        // mock ストアにも追加してSSR後の差分を埋める
        if (
          !mockInvitations.some((i) => i.id === json.data!.invitation.id)
        ) {
          mockInvitations.unshift(json.data.invitation);
        }
        return {
          invitation: json.data.invitation,
          inviteUrl:
            json.data.inviteUrl ??
            buildInviteUrl(json.data.invitation.token),
        };
      }
    }
  } catch {
    // fallthrough → mock
  }

  // mock 経路
  const id = `inv-mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const token = `demo-token-${Math.random().toString(36).slice(2, 12)}`;
  const inv: Invitation = {
    id,
    email: input.email,
    name: input.name ?? null,
    role: input.role,
    title: input.title ?? getRoleOption(input.role)?.label ?? null,
    permissions:
      input.permissions ?? getRoleOption(input.role)?.defaultPermissions ?? [],
    token,
    expiresAt: days(7),
    status: "pending",
    invitedById: invitedBy.id,
    invitedByName: invitedBy.name,
    invitedByEmail: invitedBy.email,
    acceptedAt: null,
    message: input.message ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockInvitations.unshift(inv);
  return { invitation: inv, inviteUrl: buildInviteUrl(token) };
}

export async function revokeInvitation(id: string) {
  try {
    const res = await fetch(`/api/invitations/${id}`, { method: "DELETE" });
    if (res.ok) {
      mutateInvitation(id, { status: "revoked", updatedAt: new Date().toISOString() });
      return true;
    }
  } catch {
    /* fallthrough */
  }
  // mock 経路
  mutateInvitation(id, {
    status: "revoked",
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export async function resendInvitation(id: string) {
  try {
    const res = await fetch(`/api/invitations/${id}/resend`, {
      method: "POST",
    });
    if (res.ok) {
      mutateInvitation(id, {
        expiresAt: days(7),
        updatedAt: new Date().toISOString(),
      });
      return true;
    }
  } catch {
    /* fallthrough */
  }
  mutateInvitation(id, {
    expiresAt: days(7),
    updatedAt: new Date().toISOString(),
  });
  return true;
}

export async function updateUserRole(id: string, role: InvitationRole) {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      mutateUser(id, {
        role,
        permissions:
          getRoleOption(role)?.defaultPermissions ?? null,
        title: getRoleOption(role)?.label ?? null,
      });
      return true;
    }
  } catch {
    /* fallthrough */
  }
  mutateUser(id, {
    role,
    permissions: getRoleOption(role)?.defaultPermissions ?? null,
    title: getRoleOption(role)?.label ?? null,
  });
  return true;
}

export async function setUserActive(id: string, isActive: boolean) {
  try {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    });
    if (res.ok) {
      mutateUser(id, { isActive });
      return true;
    }
  } catch {
    /* fallthrough */
  }
  mutateUser(id, { isActive });
  return true;
}

export async function deleteUser(id: string) {
  try {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      const idx = mockUsers.findIndex((u) => u.id === id);
      if (idx >= 0) mockUsers.splice(idx, 1);
      return true;
    }
  } catch {
    /* fallthrough */
  }
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx >= 0) mockUsers.splice(idx, 1);
  return true;
}

// ────────────────────────────────────────────────────────────
// 招待トークン → 詳細 (公開受諾画面用)
// ────────────────────────────────────────────────────────────

export type InviteLookupResult =
  | {
      ok: true;
      invitation: Invitation;
    }
  | {
      ok: false;
      reason: "expired" | "revoked" | "accepted" | "not_found";
      invitation?: Invitation;
    };

export async function lookupInvitationByToken(
  token: string,
): Promise<InviteLookupResult> {
  // 実 API を最初に試す
  try {
    const res = await fetch(
      `/api/invitations/accept?token=${encodeURIComponent(token)}`,
      { headers: { "Content-Type": "application/json" } },
    );
    if (res.ok) {
      const json = (await res.json()) as {
        success?: boolean;
        data?: { invitation: Invitation };
        error?: string;
      };
      if (json.success && json.data?.invitation) {
        return resolveLookup(json.data.invitation);
      }
    }
  } catch {
    /* fallthrough */
  }

  // mock fallback
  const found = mockInvitations.find((i) => i.token === token);
  if (!found) return { ok: false, reason: "not_found" };
  return resolveLookup(found);
}

function resolveLookup(inv: Invitation): InviteLookupResult {
  if (inv.status === "revoked") {
    return { ok: false, reason: "revoked", invitation: inv };
  }
  if (inv.status === "accepted") {
    return { ok: false, reason: "accepted", invitation: inv };
  }
  if (
    inv.status === "expired" ||
    new Date(inv.expiresAt).getTime() <= Date.now()
  ) {
    return { ok: false, reason: "expired", invitation: inv };
  }
  return { ok: true, invitation: inv };
}

export async function acceptInvitation(token: string, name?: string) {
  try {
    const res = await fetch(`/api/invitations/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name }),
    });
    if (res.ok) {
      const json = (await res.json()) as {
        success?: boolean;
        data?: { invitation: Invitation; user?: ManagedUser };
      };
      if (json.success && json.data?.invitation) {
        mutateInvitation(json.data.invitation.id, {
          status: "accepted",
          acceptedAt: new Date().toISOString(),
        });
        return { ok: true as const, invitation: json.data.invitation };
      }
    }
  } catch {
    /* fallthrough */
  }
  // mock
  const inv = mockInvitations.find((i) => i.token === token);
  if (!inv) return { ok: false as const, reason: "not_found" as const };
  mutateInvitation(inv.id, {
    status: "accepted",
    acceptedAt: new Date().toISOString(),
    name: name ?? inv.name,
  });
  return { ok: true as const, invitation: { ...inv, status: "accepted" } };
}

// ────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────

function mutateInvitation(id: string, patch: Partial<Invitation>) {
  const idx = mockInvitations.findIndex((i) => i.id === id);
  if (idx >= 0) {
    mockInvitations[idx] = { ...mockInvitations[idx], ...patch };
  }
}

function mutateUser(id: string, patch: Partial<ManagedUser>) {
  const idx = mockUsers.findIndex((u) => u.id === id);
  if (idx >= 0) {
    mockUsers[idx] = { ...mockUsers[idx], ...patch };
  }
}

export function buildInviteUrl(token: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/invite/${token}`;
  }
  return `/invite/${token}`;
}

export function isInvitationLive(inv: Invitation): boolean {
  return inv.status === "pending" && new Date(inv.expiresAt).getTime() > Date.now();
}
