/**
 * InvitationDetailDialog — 招待の詳細を表示するモーダル。
 *  - URL コピー / 受諾画面プレビュー / メッセージ表示
 *  - 期限切れ・取消の場合は注意喚起
 */
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./copy-button";
import { RoleBadge } from "./role-badge";
import { StatusBadge } from "./status-badge";
import {
  buildInviteUrl,
  isInvitationLive,
  type Invitation,
} from "@/lib/mock-invitations";
import { ExternalLink } from "lucide-react";
import { formatJpDateTime } from "@/lib/utils";

export function InvitationDetailDialog({
  invitation,
  onOpenChange,
}: {
  invitation: Invitation | null;
  onOpenChange: (open: boolean) => void;
}) {
  const url = invitation ? buildInviteUrl(invitation.token) : "";

  return (
    <Dialog open={invitation !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {invitation && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                招待の詳細
                <StatusBadge
                  status={
                    invitation.status === "pending" && !isInvitationLive(invitation)
                      ? "expired"
                      : invitation.status
                  }
                />
              </DialogTitle>
              <DialogDescription>{invitation.email}</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Field label="名前">{invitation.name ?? "—"}</Field>
              <Field label="ロール">
                <RoleBadge role={invitation.role} />
              </Field>
              <Field label="役職">{invitation.title ?? "—"}</Field>
              <Field label="招待者">
                <div>
                  <div className="font-medium">{invitation.invitedByName}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {invitation.invitedByEmail}
                  </div>
                </div>
              </Field>
              <Field label="送信日">
                <span className="text-xs">{formatJpDateTime(invitation.createdAt)}</span>
              </Field>
              <Field label="有効期限">
                <span className="text-xs">{formatJpDateTime(invitation.expiresAt)}</span>
              </Field>
              {invitation.acceptedAt && (
                <Field label="受諾日">
                  <span className="text-xs">{formatJpDateTime(invitation.acceptedAt)}</span>
                </Field>
              )}
            </div>

            {invitation.message && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  メッセージ
                </div>
                <div className="rounded-lg border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {invitation.message}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                招待URL
              </div>
              <div className="break-all rounded border bg-background p-3 font-mono text-xs">
                {url}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    別タブで開く
                  </a>
                </Button>
                <CopyButton value={url} label="コピー" size="sm" />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">閉じる</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}
