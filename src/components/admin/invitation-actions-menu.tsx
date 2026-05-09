/**
 * InvitationActionsMenu — 招待行のドロップダウン操作。
 *  - 招待 URL コピー
 *  - 再送 (POST /api/invitations/[id]/resend)
 *  - 取消 (DELETE /api/invitations/[id])
 *
 * pending 以外 (accepted / revoked / expired) は限定された操作だけ提供。
 */
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  Copy,
  Send,
  Ban,
  AlertTriangle,
  ExternalLink,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  buildInviteUrl,
  resendInvitation,
  revokeInvitation,
  type Invitation,
} from "@/lib/mock-invitations";

export function InvitationActionsMenu({
  invitation,
  onChange,
  onPreview,
}: {
  invitation: Invitation;
  onChange: () => void;
  onPreview?: (inv: Invitation) => void;
}) {
  const { toast } = useToast();
  const [confirmRevoke, setConfirmRevoke] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const url = buildInviteUrl(invitation.token);
  const isPending = invitation.status === "pending";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URLをコピーしました",
        description: invitation.email,
        variant: "success",
      });
    } catch {
      toast({
        title: "コピーに失敗しました",
        variant: "destructive",
      });
    }
  }

  async function handleResend() {
    setBusy(true);
    await resendInvitation(invitation.id);
    setBusy(false);
    toast({
      title: "招待を再送しました",
      description: `${invitation.email} に再送し、有効期限を延長しました`,
      variant: "success",
    });
    onChange();
  }

  async function handleRevoke() {
    setBusy(true);
    await revokeInvitation(invitation.id);
    setBusy(false);
    setConfirmRevoke(false);
    toast({
      title: "招待を取り消しました",
      description: invitation.email,
      variant: "info",
    });
    onChange();
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            data-testid={`invite-actions-${invitation.id}`}
            aria-label="招待操作"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{invitation.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
            招待URLをコピー
          </DropdownMenuItem>
          {onPreview && (
            <DropdownMenuItem onSelect={() => onPreview(invitation)}>
              <Eye className="h-3.5 w-3.5" />
              詳細を表示
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full cursor-pointer items-center gap-2"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              受諾画面を別タブで開く
            </a>
          </DropdownMenuItem>
          {isPending && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={handleResend} disabled={busy}>
                <Send className="h-3.5 w-3.5 text-ai-600" />
                再送する
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setConfirmRevoke(true)}
                disabled={busy}
                className="text-akane-600 focus:text-akane-700"
              >
                <Ban className="h-3.5 w-3.5" />
                取消する
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-akane-700 dark:text-akane-300">
              <AlertTriangle className="h-4 w-4" />
              招待を取り消しますか？
            </DialogTitle>
            <DialogDescription>
              <strong>{invitation.email}</strong> 宛の招待を取り消します。
              <br />
              既存の招待 URL は無効になります。再度招待する場合は新規作成が必要です。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={busy}>
                キャンセル
              </Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={busy}
              data-testid="confirm-revoke-invitation"
            >
              取消する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
