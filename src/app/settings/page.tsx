import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { isDemoMode } from "@/lib/demo-users";
import { getUnmappedCount } from "@/lib/queries";
import {
  Bell,
  Database,
  Lock,
  MessageSquare,
  Save,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

const ADMIN_ROLES = new Set(["kowa", "finance", "manager"]);

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user) redirect("/login");
  if (!role || !ADMIN_ROLES.has(role)) redirect("/?denied=/settings");

  const unmappedCount = await getUnmappedCount();
  const user = session.user;

  return (
    <AppShell unmappedCount={unmappedCount}>
      <div className="mx-auto max-w-[900px] space-y-5 p-6">
        <header>
          <div className="flex items-center gap-2">
            <Badge variant="ai">管理者専用</Badge>
            <span className="text-xs text-muted-foreground">role: <code className="rounded bg-muted px-1 py-px font-mono">{role}</code></span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">設定</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            プロフィール・通知・LINE 連携・セキュリティ設定。Phase 1.0 のスコープ範囲内です。
          </p>
        </header>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserIcon className="h-4 w-4 text-ai-600" />
              プロフィール
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-base">{initials(user?.name ?? "?")}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-base font-bold">{user?.name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{user?.email}</div>
                <Badge variant="secondary" className="mt-1 text-[10px]">
                  デモモード: {isDemoMode() ? "ON" : "OFF"}
                </Badge>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="表示名" value={user?.name ?? ""} />
              <Field label="メールアドレス" value={user?.email ?? ""} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-ai-600" />
              通知設定
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <SwitchRow id="n-newin" label="新規受信通知" desc="LINE / メール / 電話 すべての新規受信" defaultChecked />
            <SwitchRow id="n-esc" label="30分以上未対応エスカレ" desc="@メンション付きで Google Chat へ通知" defaultChecked />
            <SwitchRow id="n-due" label="outbound期日リマインド" desc="期日24h前に担当者へDM" defaultChecked />
            <SwitchRow id="n-dl" label="日次サマリ" desc="朝9時に Google Chat スペースへ投稿" defaultChecked />
          </CardContent>
        </Card>

        {/* LINE Channel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-4 w-4 items-center justify-center rounded bg-[#06C755] text-[10px] font-bold text-white">L</span>
              LINE Messaging API 設定
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              SPEC §3 — Channel Access Token / Channel Secret は Secret Manager 管理。年1回ローテーション。
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Channel ID" value="2008XXXXXX" mask />
            <Field label="Channel Secret" value="************************" mask />
            <Field label="Channel Access Token" value="************************" mask />
            <div className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <strong className="block">本番接続前のチェックリスト</strong>
              <ul className="mt-2 list-disc space-y-1 pl-4">
                <li>Webhook URL: <code className="rounded bg-amber-200/30 px-1 font-mono">https://line-mgr.gowa58.co.jp/api/webhook/line</code></li>
                <li>署名検証 (HMAC-SHA256) 有効化済</li>
                <li>30秒タイムアウト対策の Pub/Sub 非同期キュー稼働中</li>
                <li>最小インスタンス=1 (コールドスタート回避)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Google Chat */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-orange-600" />
              Google Chat 連携
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Webhook URL" value="https://chat.googleapis.com/v1/spaces/AAAA/.../" mask />
            <Field label="DM 通知用 ServiceAccount" value="line-bot@gowa.iam.gserviceaccount.com" />
          </CardContent>
        </Card>

        {/* Inventory data source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-purple-600" />
              在庫データソース
            </CardTitle>
            <p className="text-xs text-muted-foreground">Phase 4 で BPS 基幹連携。Phase 1.0 ではダミー値のウィジェット表示のみ。</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <SwitchRow id="bps" label="BPS 基幹DB から取得" desc="参照のみ (書き込みはしない)" />
            <SwitchRow id="alt" label="代替データソース" desc="LINE受注DBの在庫スナップショット" defaultChecked />
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-wakaba-600" />
              セキュリティ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="許可ドメイン (SSO制限)" value="gowa58.co.jp, digirise.ai" />
            <Field label="データ保持期間" value="30日 (生rawペイロード) / 365日 (集計データ)" />
            <SwitchRow id="audit" label="監査ログ BigQuery 連携" desc="操作履歴を BigQuery に長期保管" defaultChecked />
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button variant="ai" size="lg" className="shadow-lg">
            <Save className="h-4 w-4" />
            設定を保存
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function Field({ label, value, disabled = false, mask = false }: { label: string; value: string; disabled?: boolean; mask?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="relative mt-1">
        <Input defaultValue={value} disabled={disabled} type={mask ? "password" : "text"} className="font-mono text-xs" />
        {mask && <Lock className="pointer-events-none absolute right-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />}
      </div>
    </div>
  );
}

function SwitchRow({ id, label, desc, defaultChecked = false }: { id: string; label: string; desc: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {label}
        </Label>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch id={id} defaultChecked={defaultChecked} />
    </div>
  );
}
