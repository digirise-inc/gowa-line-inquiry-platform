/**
 * InvitationsTable — 招待一覧。
 *  - email / role / 招待者 / 送信日 / 有効期限 / 状態 / 操作
 *  - status フィルタは外部から受け取る
 *  - 検索 / ソート props 経由
 */
"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials, timeAgo, formatJpDateTime } from "@/lib/utils";
import {
  isInvitationLive,
  type Invitation,
  type InvitationStatus,
} from "@/lib/mock-invitations";
import { RoleBadge } from "./role-badge";
import { StatusBadge } from "./status-badge";
import { InvitationActionsMenu } from "./invitation-actions-menu";
import { Mail } from "lucide-react";

export type InvitationSortKey = "createdAt" | "role" | "expiresAt";

export function InvitationsTable({
  invitations,
  status,
  query,
  sort = "createdAt",
  onChange,
  emptyTitle,
  emptyDescription,
  onPreview,
}: {
  invitations: Invitation[];
  status?: InvitationStatus | "all";
  query: string;
  sort?: InvitationSortKey;
  onChange: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onPreview?: (inv: Invitation) => void;
}) {
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = invitations.filter((i) => {
      if (status && status !== "all") {
        if (status === "expired") {
          // expired もしくは pending かつ期限切れを含める
          if (i.status !== "expired" && isInvitationLive(i)) return false;
          if (i.status === "pending" && !isInvitationLive(i)) {
            // include
          } else if (i.status !== "expired") {
            return false;
          }
        } else if (status === "pending") {
          if (i.status !== "pending" || !isInvitationLive(i)) return false;
        } else if (i.status !== status) {
          return false;
        }
      }
      if (!q) return true;
      return (
        i.email.toLowerCase().includes(q) ||
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.invitedByName ?? "").toLowerCase().includes(q)
      );
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "role":
          return a.role.localeCompare(b.role);
        case "expiresAt":
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime();
        case "createdAt":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
    return list;
  }, [invitations, status, query, sort]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-card p-12 text-center">
        <Mail className="mx-auto h-10 w-10 text-muted-foreground/60" />
        <h3 className="mt-3 text-sm font-semibold">
          {emptyTitle ?? "招待がまだありません"}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {emptyDescription ?? "「+ 招待を送る」から新しい招待を作成しましょう"}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[280px]">招待先</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>招待者</TableHead>
            <TableHead>送信日</TableHead>
            <TableHead>有効期限</TableHead>
            <TableHead>状態</TableHead>
            <TableHead className="w-[60px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((i) => {
            const expired = !isInvitationLive(i) && i.status === "pending";
            return (
              <TableRow key={i.id} data-testid={`invitation-row-${i.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback>{initials(i.name ?? i.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {i.name ?? <span className="text-muted-foreground">名前未設定</span>}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {i.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={i.role} />
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    <div className="font-medium">{i.invitedByName}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {i.invitedByEmail}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground" title={formatJpDateTime(i.createdAt)}>
                    {timeAgo(i.createdAt)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      expired
                        ? "text-xs font-medium text-akane-600 dark:text-akane-300"
                        : "text-xs text-muted-foreground"
                    }
                    title={formatJpDateTime(i.expiresAt)}
                  >
                    {formatJpDateTime(i.expiresAt)}
                  </span>
                </TableCell>
                <TableCell>
                  {expired ? (
                    <StatusBadge status="expired" />
                  ) : (
                    <StatusBadge status={i.status} />
                  )}
                  {i.acceptedAt && (
                    <Badge variant="outline" className="ml-1 text-[10px]">
                      {timeAgo(i.acceptedAt)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <InvitationActionsMenu
                    invitation={i}
                    onChange={onChange}
                    onPreview={onPreview}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
