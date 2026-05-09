/**
 * UserActionsMenu — ユーザー行のドロップダウン操作。
 *  - ロール変更 (ネスト Select 経由 → モーダルにすると重いので Popover でインライン)
 *  - 有効化 / 無効化 トグル
 *  - 削除 (確認ダイアログ)
 */
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  UserCog,
  AlertTriangle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  ROLE_OPTIONS,
  setUserActive,
  updateUserRole,
  deleteUser,
  type InvitationRole,
  type ManagedUser,
} from "@/lib/mock-invitations";

export function UserActionsMenu({
  user,
  onChange,
  selfId,
}: {
  user: ManagedUser;
  onChange: () => void;
  selfId?: string;
}) {
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [confirmRoleChange, setConfirmRoleChange] = React.useState<InvitationRole | null>(
    null,
  );
  const [busy, setBusy] = React.useState(false);
  const isSelf = selfId && selfId === user.id;

  async function handleRole(role: InvitationRole) {
    setBusy(true);
    await updateUserRole(user.id, role);
    setBusy(false);
    setConfirmRoleChange(null);
    toast({
      title: `${user.name ?? user.email} のロールを変更しました`,
      description: `→ ${ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role}`,
      variant: "success",
    });
    onChange();
  }

  async function handleToggleActive() {
    setBusy(true);
    await setUserActive(user.id, !user.isActive);
    setBusy(false);
    toast({
      title: user.isActive
        ? `${user.name ?? user.email} を無効化しました`
        : `${user.name ?? user.email} を有効化しました`,
      variant: user.isActive ? "info" : "success",
    });
    onChange();
  }

  async function handleDelete() {
    setBusy(true);
    await deleteUser(user.id);
    setBusy(false);
    setConfirmDelete(false);
    toast({
      title: `${user.name ?? user.email} を削除しました`,
      variant: "destructive",
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
            data-testid={`user-actions-${user.id}`}
            aria-label="ユーザー操作"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>{user.name ?? user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {ROLE_OPTIONS.filter((o) => o.value !== "driver").map((o) => (
            <DropdownMenuItem
              key={o.value}
              onSelect={() => {
                if (o.value === user.role) return;
                setConfirmRoleChange(o.value);
              }}
              disabled={o.value === user.role || busy}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                <UserCog className="h-3.5 w-3.5" />
                <span>{o.label}</span>
              </span>
              {o.value === user.role && (
                <span className="text-[10px] text-muted-foreground">現在</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={handleToggleActive}
            disabled={busy || isSelf === true}
          >
            {user.isActive ? (
              <>
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                無効化する
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-wakaba-600" />
                有効化する
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setConfirmDelete(true)}
            disabled={busy || isSelf === true}
            className="text-akane-600 focus:text-akane-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            削除する
          </DropdownMenuItem>
          {isSelf && (
            <p className="px-2 py-1.5 text-[10px] text-muted-foreground">
              自分自身のロール変更・削除はできません
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ロール変更確認 */}
      <Dialog
        open={confirmRoleChange !== null}
        onOpenChange={(open) => !open && setConfirmRoleChange(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ロールを変更しますか？</DialogTitle>
            <DialogDescription>
              <strong>{user.name ?? user.email}</strong> のロールを{" "}
              <strong>
                {confirmRoleChange &&
                  ROLE_OPTIONS.find((r) => r.value === confirmRoleChange)?.label}
              </strong>{" "}
              に変更します。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={busy}>
                キャンセル
              </Button>
            </DialogClose>
            <Button
              variant="ai"
              onClick={() => confirmRoleChange && handleRole(confirmRoleChange)}
              disabled={busy}
            >
              変更する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認 */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-akane-700 dark:text-akane-300">
              <AlertTriangle className="h-4 w-4" />
              ユーザーを削除しますか？
            </DialogTitle>
            <DialogDescription>
              <strong>{user.name ?? user.email}</strong> を削除します。
              <br />
              <span className="text-akane-600 dark:text-akane-300">
                この操作は元に戻せません。本当に削除してもよろしいですか？
              </span>
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
              onClick={handleDelete}
              disabled={busy}
              data-testid="confirm-delete-user"
            >
              削除する
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
