/**
 * InvitationAcceptCard — 招待トークンの受諾カード本体。
 * `/invite/[token]` から使用される client component。
 *
 *  - 起動時に lookupInvitationByToken() で照合
 *  - OK: 招待詳細を表示し、表示名フィールド + 受諾ボタン
 *  - NG: reason に応じたエラーカード
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/toast";
import {
  Loader2,
  ShieldCheck,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  acceptInvitation,
  lookupInvitationByToken,
  type InviteLookupResult,
  type Invitation,
} from "@/lib/mock-invitations";
import { RoleBadge } from "./role-badge";
import { formatJpDateTime } from "@/lib/utils";

export function InvitationAcceptCard({ token }: { token: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = React.useState<
    | { status: "loading" }
    | { status: "ok"; invitation: Invitation }
    | { status: "error"; result: InviteLookupResult }
  >({ status: "loading" });
  const [name, setName] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    lookupInvitationByToken(token).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "ok", invitation: result.invitation });
        if (result.invitation.name) setName(result.invitation.name);
      } else {
        setState({ status: "error", result });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state.status === "loading") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">招待を確認しています…</p>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "error") {
    return <ErrorCard result={state.result} />;
  }

  const inv = state.invitation;
  const expiresAt = formatJpDateTime(inv.expiresAt);

  async function handleAccept(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const result = await acceptInvitation(token, name.trim() || undefined);
    if (result.ok) {
      toast({
        title: "招待を承諾しました",
        description: "ログイン画面に進みます",
        variant: "success",
      });
      const loginUrl = `/login?email=${encodeURIComponent(inv.email)}`;
      router.push(loginUrl);
    } else {
      toast({
        title: "受諾に失敗しました",
        description: "もう一度お試しください",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  return (
    <Card data-testid="invitation-accept-card">
      <CardContent className="space-y-5 p-7">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-bold">ようこそ</h2>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{inv.invitedByName}</strong> さんが
            あなたを業務管理プラットフォームに招待しました。
          </p>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-3 text-sm">
          <Row label="招待者">
            <div>
              <div className="font-medium">{inv.invitedByName}</div>
              <div className="text-xs text-muted-foreground">{inv.invitedByEmail}</div>
            </div>
          </Row>
          <Row label="あなたのメールアドレス">
            <span className="font-mono text-xs">{inv.email}</span>
          </Row>
          <Row label="あなたのロール">
            <RoleBadge role={inv.role} showDescription />
          </Row>
          {inv.title && (
            <Row label="役職">
              <span>{inv.title}</span>
            </Row>
          )}
        </div>

        {inv.message && (
          <div className="rounded-lg border border-ai-200 bg-ai-50/50 p-4 dark:border-ai-800 dark:bg-ai-950/20">
            <div className="text-[11px] font-medium uppercase tracking-wider text-ai-700 dark:text-ai-300">
              招待者からのメッセージ
            </div>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {inv.message}
            </p>
          </div>
        )}

        <form onSubmit={handleAccept} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="invite-accept-name" className="text-xs font-medium">
              表示名 <span className="text-muted-foreground">(任意)</span>
            </Label>
            <Input
              id="invite-accept-name"
              placeholder="後和 直樹"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              data-testid="invite-accept-name"
            />
            <p className="text-[10px] text-muted-foreground">
              他のメンバーに表示される名前です。後から設定で変更できます。
            </p>
          </div>

          <Button
            type="submit"
            variant="ai"
            className="w-full"
            disabled={submitting}
            data-testid="invite-accept-submit"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                処理中…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                招待を承諾してログイン
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="flex items-center justify-between border-t pt-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3 w-3" />
            この招待は <strong className="text-foreground">{expiresAt}</strong> に失効します
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-right">{children}</div>
    </div>
  );
}

function ErrorCard({ result }: { result: InviteLookupResult }) {
  if (result.ok) return null;
  switch (result.reason) {
    case "expired":
      return (
        <ErrorState
          icon={<Clock className="h-8 w-8 text-akane-600" />}
          title="この招待は失効しています"
          description="招待の有効期限が過ぎています。お手数ですが、招待者に新しい招待を依頼してください。"
          variant="warning"
          extra={
            result.invitation && (
              <p className="text-xs text-muted-foreground">
                招待者: <strong>{result.invitation.invitedByName}</strong> ({result.invitation.invitedByEmail})
              </p>
            )
          }
        />
      );
    case "revoked":
      return (
        <ErrorState
          icon={<Ban className="h-8 w-8 text-sumi-500" />}
          title="この招待は取り消されました"
          description="管理者により招待が取り消されました。誤って取り消された場合は、招待者に再度ご連絡ください。"
          variant="info"
          extra={
            result.invitation && (
              <p className="text-xs text-muted-foreground">
                招待者: <strong>{result.invitation.invitedByName}</strong> ({result.invitation.invitedByEmail})
              </p>
            )
          }
        />
      );
    case "accepted":
      return (
        <ErrorState
          icon={<CheckCircle2 className="h-8 w-8 text-wakaba-600" />}
          title="この招待は既に承諾済みです"
          description="そのままログイン画面へ進んでください。"
          variant="success"
          extra={
            <Button asChild variant="ai">
              <Link
                href={
                  result.invitation
                    ? `/login?email=${encodeURIComponent(result.invitation.email)}`
                    : "/login"
                }
              >
                ログイン画面へ
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          }
        />
      );
    case "not_found":
    default:
      return (
        <ErrorState
          icon={<AlertTriangle className="h-8 w-8 text-akane-600" />}
          title="招待リンクが無効です"
          description="リンクが正しくコピーされていない可能性があります。招待メール内のリンクから再度アクセスしてください。"
          variant="destructive"
        />
      );
  }
}

function ErrorState({
  icon,
  title,
  description,
  variant,
  extra,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: React.ComponentProps<typeof Alert>["variant"];
  extra?: React.ReactNode;
}) {
  return (
    <Card data-testid="invitation-error-card">
      <CardContent className="space-y-4 p-7 text-center">
        <div className="flex justify-center">{icon}</div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
        {extra}
        <div className="pt-2">
          <Alert variant={variant}>
            <AlertTitle>サポートが必要ですか？</AlertTitle>
            <AlertDescription>
              管理者にメールでご連絡ください。新しい招待リンクをお送りします。
            </AlertDescription>
          </Alert>
        </div>
        <Button asChild variant="outline">
          <Link href="/login">ログイン画面へ</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
