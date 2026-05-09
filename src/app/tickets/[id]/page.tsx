import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageBubble } from "@/components/chat/message-bubble";
import { Composer } from "@/components/chat/composer";
import { TicketStatusChanger } from "@/components/tickets/ticket-status-changer";
import { CATEGORIES, CHANNELS, LOST_REASONS, PRIORITIES } from "@/lib/constants";
import { getTicketById, getUnmappedCount } from "@/lib/queries";
import { formatJpDateTime, initials, timeAgo } from "@/lib/utils";
import { ArrowLeft, Building2, Hash, Mail, Phone, MessageSquare, Sparkles, Wand2, AlertOctagon, ExternalLink, Package, History } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, unmappedCount] = await Promise.all([getTicketById(params.id), getUnmappedCount()]);
  if (!ticket) notFound();

  const channel = CHANNELS.find((c) => c.value === ticket.channel) ?? CHANNELS[0];
  const category = CATEGORIES.find((c) => c.value === ticket.category);
  const pri = PRIORITIES.find((p) => p.value === ticket.priority);
  const lostReason = ticket.lostReason ? LOST_REASONS.find((l) => l.value === ticket.lostReason) : null;
  const aiCats = ticket.aiCategories ? (JSON.parse(ticket.aiCategories) as string[]) : [];

  return (
    <AppShell unmappedCount={unmappedCount}>
      <div className="mx-auto max-w-[1400px] space-y-4 p-6">
        {/* Back button */}
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tickets">
              <ArrowLeft className="h-4 w-4" />
              チケット一覧へ戻る
            </Link>
          </Button>
        </div>

        {/* Header card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{ticket.publicId}</span>
                  <Badge variant="outline" className={`${channel.bg} ${channel.color}`}>
                    {channel.label}
                  </Badge>
                  {category && <Badge variant="outline">{category.label}</Badge>}
                  {pri && pri.value !== "normal" && <Badge className={pri.color}>{pri.label}</Badge>}
                  {ticket.kind === "outbound" && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
                      outbound
                    </Badge>
                  )}
                  {ticket.isUnmapped && (
                    <Badge variant="warning">
                      <Wand2 className="h-3 w-3" />
                      未紐付け
                    </Badge>
                  )}
                  {ticket.status === "escalated" && (
                    <Badge className="bg-akane-600 text-white">
                      <AlertOctagon className="h-3 w-3" />
                      エスカレ
                    </Badge>
                  )}
                </div>
                <h1 className="mt-2 text-xl font-bold tracking-tight">{ticket.subject}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{ticket.preview}</p>
                {aiCats.length > 0 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-ai-600" />
                    <span className="text-[11px] text-muted-foreground">AIカテゴリ:</span>
                    {aiCats.map((c) => (
                      <Badge key={c} variant="ai" className="text-[10px]">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <TicketStatusChanger ticketId={ticket.id} currentStatus={ticket.status} />
                <div className="text-[10px] text-muted-foreground tabular-nums">
                  作成 {formatJpDateTime(ticket.createdAt)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Body grid */}
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Center: chat */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4 text-ai-600" />
                  メッセージスレッド
                  <Badge variant="secondary" className="ml-auto">{ticket.messages.length}件</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto bg-sumi-50/50 dark:bg-sumi-900/30">
                {ticket.messages.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">まだメッセージはありません</div>
                ) : (
                  ticket.messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      msg={{
                        id: m.id,
                        direction: m.direction,
                        channel: m.channel,
                        senderName: m.senderName,
                        senderImage: (m as any).sender?.image ?? null,
                        content: m.content,
                        sentAt: m.sentAt,
                      }}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Composer (LINE/email等で返信) */}
            <Composer
              ticketId={ticket.id}
              channel={ticket.channel === "official_line" ? "line" : (ticket.channel as any)}
              suggestedTemplateId={ticket.suggestedTemplateId}
              placeholder={`${channel.label} で返信を送信…`}
            />

            {/* 失注理由 */}
            {ticket.status === "closed_lost" && (
              <Card className="border-akane-200 dark:border-akane-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertOctagon className="h-4 w-4 text-akane-600" />
                    失注理由
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge className="bg-akane-100 text-akane-800 dark:bg-akane-950/40 dark:text-akane-200">
                      {lostReason?.label ?? ticket.lostReason}
                    </Badge>
                    {ticket.lostReasonNote && (
                      <p className="text-sm text-muted-foreground">{ticket.lostReasonNote}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 引き継ぎメモ */}
            {ticket.handoverNote && (
              <Card className="border-amber-200 dark:border-amber-900">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <span>📝</span>
                    次の担当者へのメモ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{ticket.handoverNote}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-4">
            {/* Customer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-ai-600" />
                  顧客情報
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.customer ? (
                  <>
                    <div>
                      <div className="text-sm font-bold">{ticket.customer.name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">{ticket.customer.code}</div>
                    </div>
                    <Separator />
                    {ticket.customer.contactName && (
                      <Row icon={<Hash className="h-3 w-3" />} label="担当者" value={ticket.customer.contactName} />
                    )}
                    {ticket.customer.phone && <Row icon={<Phone className="h-3 w-3" />} label="電話" value={ticket.customer.phone} />}
                    {ticket.customer.email && <Row icon={<Mail className="h-3 w-3" />} label="メール" value={ticket.customer.email} />}
                    {ticket.customer.area && <Row icon={<Building2 className="h-3 w-3" />} label="エリア" value={ticket.customer.area} />}
                    {ticket.customer.segment && <Row icon={<Package className="h-3 w-3" />} label="業態" value={ticket.customer.segment} />}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {ticket.customerName ?? "未登録"}
                    {ticket.isUnmapped && (
                      <Button asChild variant="outline" size="xs" className="mt-2 w-full">
                        <Link href="/mappings">
                          <Wand2 className="h-3 w-3" />
                          紐付けToDoへ
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assignee / Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">担当・期日</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={ticket.assignee?.image ?? undefined} />
                      <AvatarFallback>{initials(ticket.assignee?.name ?? "?")}</AvatarFallback>
                    </Avatar>
                    <div className="leading-tight">
                      <div className="text-sm font-medium">{ticket.assignee?.name ?? "未割当"}</div>
                      <div className="text-[10px] text-muted-foreground">{(ticket.assignee as any)?.position ?? ""}</div>
                    </div>
                  </div>
                </div>
                {ticket.dueAt && (
                  <Row icon={<History className="h-3 w-3" />} label="期日" value={formatJpDateTime(ticket.dueAt)} />
                )}
                <Row icon={<History className="h-3 w-3" />} label="経過" value={timeAgo(ticket.createdAt)} />
                {ticket.firstResponseAt && (
                  <Row
                    icon={<History className="h-3 w-3" />}
                    label="初回応答"
                    value={timeAgo(ticket.firstResponseAt)}
                  />
                )}
              </CardContent>
            </Card>

            {/* External links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">外部連携</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button asChild variant="outline" size="sm" className="w-full justify-between">
                  <a href="https://account.line.biz/" target="_blank" rel="noreferrer">
                    LINE管理画面で開く
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-between" disabled>
                  BPS基幹で取引履歴
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Phase 1.0 では参照のみ。Phase 4 で在庫常時可視化を実装予定。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}
