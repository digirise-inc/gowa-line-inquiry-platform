/**
 * UsersTable — 既存ユーザー一覧。
 *  - name / email / role / title / 最終ログイン / 状態 / アクション
 *  - 並び替え (createdAt | role | lastLogin)
 *  - 検索 (props.query で外部から受ける)
 */
"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { initials, timeAgo } from "@/lib/utils";
import type { ManagedUser } from "@/lib/mock-invitations";
import { RoleBadge } from "./role-badge";
import { UserActionsMenu } from "./user-actions-menu";
import { UserCircle2 } from "lucide-react";

export type UserSortKey = "lastLogin" | "role" | "createdAt" | "name";

export function UsersTable({
  users,
  query,
  sort = "lastLogin",
  selfId,
  onChange,
}: {
  users: ManagedUser[];
  query: string;
  sort?: UserSortKey;
  selfId?: string;
  onChange: () => void;
}) {
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = users.filter(
      (u) =>
        !q ||
        (u.name ?? "").toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.title ?? "").toLowerCase().includes(q),
    );
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "name":
          return (a.name ?? a.email).localeCompare(b.name ?? b.email);
        case "role":
          return a.role.localeCompare(b.role);
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "lastLogin":
        default: {
          const at = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
          const bt = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
          return bt - at;
        }
      }
    });
    return list;
  }, [users, query, sort]);

  if (filtered.length === 0) {
    return (
      <EmptyState
        title={query ? "該当するユーザーがいません" : "ユーザーがまだいません"}
        description={
          query
            ? "別のキーワードで検索してみてください"
            : "「+ 招待を送る」から最初のメンバーを招待しましょう"
        }
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[260px]">ユーザー</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>役職</TableHead>
            <TableHead>最終ログイン</TableHead>
            <TableHead>状態</TableHead>
            <TableHead className="w-[60px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u) => (
            <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
              <TableCell>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={u.image ?? undefined} alt={u.name ?? u.email} />
                    <AvatarFallback>{initials(u.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {u.name ?? "—"}
                      {selfId === u.id && (
                        <span className="ml-1.5 rounded bg-ai-100 px-1.5 py-0.5 text-[10px] font-bold text-ai-800 dark:bg-ai-950/40 dark:text-ai-200">
                          自分
                        </span>
                      )}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {u.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <RoleBadge role={u.role} />
              </TableCell>
              <TableCell>
                <span className="text-sm">{u.title ?? "—"}</span>
              </TableCell>
              <TableCell>
                <span className="text-xs text-muted-foreground">
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "—"}
                </span>
              </TableCell>
              <TableCell>
                {u.isActive ? (
                  <Badge variant="success" className="text-[10px]">
                    アクティブ
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">
                    無効
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <UserActionsMenu user={u} onChange={onChange} selfId={selfId} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card p-12 text-center">
      <UserCircle2 className="mx-auto h-10 w-10 text-muted-foreground/60" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
