/**
 * InviteDialog — 招待を新規作成するモーダル。
 *
 *  - email / name(任意) / role / title(任意) / message(任意) を入力
 *  - 送信成功で「成功画面」に切り替え、招待URLをコピー可能に表示
 *  - DEMO 時は実際にメールが飛ばないため、デモ用のメッセージを併記
 */
"use client";

import * as React from "react";
import { Loader2, Send, Sparkles, Mail } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import {
  ROLE_OPTIONS,
  createInvitation,
  type CreateInvitationInput,
  type Invitation,
  type InvitationRole,
} from "@/lib/mock-invitations";
import { CopyButton } from "./copy-button";
import { RoleBadge } from "./role-badge";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (invitation: Invitation) => void;
  invitedBy: { id: string; name: string; email: string };
  isDemo?: boolean;
};

export function InviteDialog({
  open,
  onOpenChange,
  onCreated,
  invitedBy,
  isDemo,
}: InviteDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = React.useState("");
  const [name, setName] = React.useState("");
  const [role, setRole] = React.useState<InvitationRole>("staff_office");
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState<{
    invitation: Invitation;
    inviteUrl: string;
  } | null>(null);
  const [emailError, setEmailError] = React.useState<string | null>(null);

  // ダイアログを開いた / 閉じた時にフォーム初期化
  React.useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setEmail("");
        setName("");
        setRole("staff_office");
        setTitle("");
        setMessage("");
        setSubmitting(false);
        setSuccess(null);
        setEmailError(null);
      }, 200);
    }
  }, [open]);

  function validate(): boolean {
    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください");
      return false;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("メールアドレスの形式が正しくありません");
      return false;
    }
    setEmailError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const input: CreateInvitationInput = {
        email: email.trim(),
        name: name.trim() || null,
        role,
        title: title.trim() || null,
        message: message.trim() || null,
      };
      const result = await createInvitation(input, invitedBy);
      setSuccess(result);
      toast({
        title: "招待を送信しました",
        description: `${result.invitation.email} に招待メールを送信しました`,
        variant: "success",
      });
      onCreated?.(result.invitation);
    } catch (err) {
      toast({
        title: "招待の送信に失敗しました",
        description: err instanceof Error ? err.message : "不明なエラー",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        {success ? (
          <div className="space-y-4" data-testid="invite-success">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span aria-hidden>🎉</span>
                招待を送信しました
              </DialogTitle>
              <DialogDescription>
                {success.invitation.email} に招待メールを送りました。
                {isDemo && (
                  <>
                    <br />
                    <span className="text-amber-700 dark:text-amber-300">
                      デモモード中はメールは送信されません。下の URL でフローを試せます。
                    </span>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                招待 URL（招待者がアクセスして受諾します）
              </div>
              <div
                className="break-all rounded border bg-background p-3 font-mono text-xs"
                data-testid="invite-url"
              >
                {success.inviteUrl}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>有効期限:</span>
                  <span className="font-medium text-foreground">
                    {new Date(success.invitation.expiresAt).toLocaleString("ja-JP")}
                  </span>
                </div>
                <CopyButton value={success.inviteUrl} label="URLをコピー" />
              </div>
            </div>

            <Alert variant="info">
              <Sparkles className="h-4 w-4" />
              <AlertTitle>次のステップ</AlertTitle>
              <AlertDescription>
                招待された方は URL からアクセスして受諾し、ログイン画面に進みます。
                招待は「ペンディング招待」タブから取消・再送できます。
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">閉じる</Button>
              </DialogClose>
              <Button
                variant="ai"
                onClick={() => {
                  setSuccess(null);
                  setEmail("");
                  setName("");
                  setMessage("");
                }}
              >
                続けて別の招待を送る
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="invite-form">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-4 w-4 text-ai-600" />
                招待を送る
              </DialogTitle>
              <DialogDescription>
                メールアドレスとロールを指定して、新しいメンバーを招待します。
              </DialogDescription>
            </DialogHeader>

            {isDemo && (
              <Alert variant="warning">
                <AlertTitle>デモモード</AlertTitle>
                <AlertDescription>
                  実際のメール送信は行わず、画面上に招待URLを表示します。
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="invite-email" className="text-xs font-medium">
                  メールアドレス <span className="text-akane-600">*</span>
                </Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  placeholder="member@gowa58.co.jp"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  data-testid="invite-email-input"
                  autoComplete="email"
                />
                {emailError && (
                  <p className="text-xs text-akane-600 dark:text-akane-300">{emailError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-name" className="text-xs font-medium">
                  表示名 <span className="text-muted-foreground">(任意)</span>
                </Label>
                <Input
                  id="invite-name"
                  placeholder="後和 直樹"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="invite-title" className="text-xs font-medium">
                  役職 <span className="text-muted-foreground">(任意)</span>
                </Label>
                <Input
                  id="invite-title"
                  placeholder="管理部・事務員"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="invite-role" className="text-xs font-medium">
                  ロール <span className="text-akane-600">*</span>
                </Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as InvitationRole)}
                >
                  <SelectTrigger id="invite-role" data-testid="invite-role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.filter((o) => o.value !== "driver").map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">{o.label}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {o.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="pt-1">
                  <RoleBadge role={role} showDescription />
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="invite-message" className="text-xs font-medium">
                  メッセージ <span className="text-muted-foreground">(任意)</span>
                </Label>
                <Textarea
                  id="invite-message"
                  placeholder="招待メールに添付するメッセージ..."
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                />
                <p className="text-[10px] text-muted-foreground">
                  招待メールの本文に転載されます。
                </p>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  キャンセル
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant="ai"
                disabled={submitting}
                data-testid="invite-submit"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    送信中…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    招待を送る
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
