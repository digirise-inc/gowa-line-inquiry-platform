/**
 * /admin/users — ユーザー & 招待管理ページ
 *
 *  権限: manager / finance / kowa のみ
 *    - middleware で先に弾く + ページ側でも useSession でガード (二重防御)
 *
 *  構成:
 *    1. ヘッダ (タイトル + 「+ 招待を送る」ボタン)
 *    2. 統計タイル4つ
 *    3. 検索 + ソート + タブ
 *    4. タブ別テーブル (既存ユーザー / ペンディング招待 / 受諾済 / 取消・失効)
 *    5. InviteDialog / InvitationDetailDialog (モーダル)
 *
 *  データソース: src/lib/mock-invitations.ts
 *    - 実 API がある場合はそちらを優先し、無ければ mock を使う
 *
 */
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Send,
  Users as UsersIcon,
  ShieldAlert,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { StatsTiles } from "@/components/admin/stats-tiles";
import { UsersTable } from "@/components/admin/users-table";
import { InvitationsTable } from "@/components/admin/invitations-table";
import { InviteDialog } from "@/components/admin/invite-dialog";
import { InvitationDetailDialog } from "@/components/admin/invitation-detail-dialog";
import {
  fetchInvitations,
  fetchUsers,
  isInvitationLive,
  mockInitialState,
  type Invitation,
  type ManagedUser,
} from "@/lib/mock-invitations";

const ALLOWED_ROLES = new Set(["kowa", "finance", "manager"]);

// useSearchParams を使うため Suspense でラップ（CSR bailoutを回避）
export default function AdminUsersPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-400">読み込み中...</div>}>
      <AdminUsersPageInner />
    </React.Suspense>
  );
}

function AdminUsersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isDemo =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    (session?.user as { isDemo?: boolean } | undefined)?.isDemo === true;

  // 権限チェック
  React.useEffect(() => {
    if (status === "loading") return;
    if (!session) return; // middleware が /login へ
    if (!role || !ALLOWED_ROLES.has(role)) {
      const url = new URL("/", window.location.origin);
      url.searchParams.set("denied", "admin");
      router.replace(url.pathname + url.search);
    }
  }, [status, session, role, router]);

  // 初期 state は mock (SSR ではなくクライアント初回でロード)
  const initial = React.useMemo(() => mockInitialState(), []);
  const [users, setUsers] = React.useState<ManagedUser[]>(initial.users);
  const [invitations, setInvitations] = React.useState<Invitation[]>(
    initial.invitations,
  );
  const [loading, setLoading] = React.useState(true);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [tab, setTab] = React.useState<string>(
    searchParams.get("tab") ?? "users",
  );
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<string>("default");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [previewInvite, setPreviewInvite] = React.useState<Invitation | null>(
    null,
  );
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    Promise.all([fetchUsers(), fetchInvitations()])
      .then(([u, i]) => {
        if (cancelled) return;
        setUsers(u);
        setInvitations(i);
      })
      .catch(() => {
        if (cancelled) return;
        setErrorMsg(
          "データの取得に失敗しました。モックデータで続行しています。",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  function reload() {
    setRefreshKey((k) => k + 1);
  }

  // 統計
  const stats = React.useMemo(() => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter((u) => u.isActive).length,
      pendingInvitations: invitations.filter(
        (i) => i.status === "pending" && isInvitationLive(i),
      ).length,
      expiredInvitations: invitations.filter(
        (i) =>
          i.status === "expired" ||
          (i.status === "pending" && !isInvitationLive(i)) ||
          i.status === "revoked",
      ).length,
    };
  }, [users, invitations]);

  if (status === "loading" || (status === "authenticated" && !role)) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }
  if (status === "authenticated" && !ALLOWED_ROLES.has(role ?? "")) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl p-12">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>アクセス権がありません</AlertTitle>
            <AlertDescription>
              ユーザー管理は管理者・経理ロールのみアクセスできます。ダッシュボードへリダイレクトします。
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    );
  }

  const inviter = {
    id: (session?.user as { id?: string } | undefined)?.id ?? "demo-kowa",
    name: session?.user?.name ?? "後和 直樹",
    email: session?.user?.email ?? "demo+kowa@gowa58.co.jp",
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        {/* Header */}
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="ai" className="px-2.5 py-1">
                <UsersIcon className="h-3 w-3" />
                Admin
              </Badge>
              <span className="text-xs text-muted-foreground">
                manager / finance のみアクセス可
              </span>
            </div>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight">
              <span aria-hidden>👥</span>
              ユーザー管理
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              既存メンバーの管理と、新規メンバー招待。ロールごとに閲覧範囲が変わります。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={reload}
              disabled={loading}
              data-testid="reload-btn"
              aria-label="再読み込み"
            >
              <RefreshCw
                className={loading ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"}
              />
              再読み込み
            </Button>
            <Button
              variant="ai"
              onClick={() => setInviteOpen(true)}
              data-testid="open-invite-dialog"
            >
              <Send className="h-4 w-4" />
              招待を送る
            </Button>
          </div>
        </header>

        {errorMsg && (
          <Alert variant="warning">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <StatsTiles stats={stats} />

        {/* Search + Sort */}
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="email / 名前で絞り込み…"
                className="h-9 pl-8"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                data-testid="user-search-input"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">並び替え</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-44 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">標準 (新しい順)</SelectItem>
                  <SelectItem value="role">ロール順</SelectItem>
                  <SelectItem value="lastLogin">最終ログイン順</SelectItem>
                  <SelectItem value="expiresAt">有効期限順</SelectItem>
                  <SelectItem value="name">名前順</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            const url = new URL(window.location.href);
            url.searchParams.set("tab", v);
            window.history.replaceState(null, "", url.toString());
          }}
          className="space-y-3"
        >
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="users" data-testid="tab-users">
              既存ユーザー
              <Badge variant="outline" className="ml-1.5 text-[10px]">
                {users.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">
              ペンディング招待
              <Badge variant="warning" className="ml-1.5 text-[10px]">
                {stats.pendingInvitations}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="accepted" data-testid="tab-accepted">
              受諾済
              <Badge variant="success" className="ml-1.5 text-[10px]">
                {invitations.filter((i) => i.status === "accepted").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" data-testid="tab-archived">
              取消・失効
              <Badge variant="outline" className="ml-1.5 text-[10px]">
                {
                  invitations.filter(
                    (i) =>
                      i.status === "revoked" ||
                      i.status === "expired" ||
                      (i.status === "pending" && !isInvitationLive(i)),
                  ).length
                }
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UsersTable
              users={users}
              query={query}
              sort={
                sort === "role" || sort === "name" || sort === "lastLogin"
                  ? (sort as "role" | "name" | "lastLogin")
                  : "lastLogin"
              }
              selfId={inviter.id}
              onChange={reload}
            />
          </TabsContent>

          <TabsContent value="pending">
            <InvitationsTable
              invitations={invitations}
              status="pending"
              query={query}
              sort={
                sort === "role" || sort === "expiresAt"
                  ? (sort as "role" | "expiresAt")
                  : "createdAt"
              }
              onChange={reload}
              onPreview={setPreviewInvite}
              emptyTitle="ペンディングの招待はありません"
              emptyDescription="「招待を送る」から新しい招待を作成しましょう"
            />
          </TabsContent>

          <TabsContent value="accepted">
            <InvitationsTable
              invitations={invitations}
              status="accepted"
              query={query}
              sort={
                sort === "role" || sort === "expiresAt"
                  ? (sort as "role" | "expiresAt")
                  : "createdAt"
              }
              onChange={reload}
              onPreview={setPreviewInvite}
              emptyTitle="受諾済の招待はまだありません"
              emptyDescription="招待が承諾されるとここに表示されます"
            />
          </TabsContent>

          <TabsContent value="archived">
            <InvitationsTable
              invitations={invitations.filter(
                (i) =>
                  i.status === "revoked" ||
                  i.status === "expired" ||
                  (i.status === "pending" && !isInvitationLive(i)),
              )}
              status="all"
              query={query}
              sort={
                sort === "role" || sort === "expiresAt"
                  ? (sort as "role" | "expiresAt")
                  : "createdAt"
              }
              onChange={reload}
              onPreview={setPreviewInvite}
              emptyTitle="取消・失効した招待はありません"
              emptyDescription="期限切れや取り消した招待がここに集約されます"
            />
          </TabsContent>
        </Tabs>

        {/* Footer note */}
        <Card className="border-dashed bg-sumi-50/50 dark:bg-sumi-900/30">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ai-500/10">
              <UsersIcon className="h-4 w-4 text-ai-600" />
            </div>
            <div className="text-sm leading-relaxed">
              <div className="font-medium">運用ポリシー</div>
              <p className="mt-0.5 text-muted-foreground">
                招待は7日で自動失効。失効した招待は取消同様アーカイブに集約されます。ロール変更・削除は
                <strong>後和専務 / 経理ロール</strong>のみ可能で、操作はすべて監査ログに記録されます。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <InviteDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        invitedBy={inviter}
        isDemo={isDemo}
        onCreated={() => reload()}
      />
      <InvitationDetailDialog
        invitation={previewInvite}
        onOpenChange={(open) => !open && setPreviewInvite(null)}
      />
    </AppShell>
  );
}
