"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./message-bubble";
import { Composer } from "./composer";
import { initials, timeAgo } from "@/lib/utils";
import { Search, Phone, MessageSquare, MailOpen, Wand2, Building2, Hash, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type ChatTicket = {
  id: string;
  publicId: string;
  channel: string;
  customerName: string | null;
  subject: string;
  isUnmapped: boolean;
  lineUserId: string | null;
  customer: any;
  messages: {
    id: string;
    direction: string;
    channel: string;
    senderName: string;
    content: string;
    sentAt: Date | string;
  }[];
  updatedAt: Date | string;
};

type GChatSpaceWithThreads = {
  id: string;
  name: string;
  description: string | null;
  threads: {
    id: string;
    subject: string;
    messages: { id: string; senderName: string; senderImg?: string | null; content: string; createdAt: Date | string }[];
    updatedAt: Date | string;
  }[];
};

export function ChatWorkspace({
  tickets,
  mappings,
  gchatSpaces,
}: {
  tickets: ChatTicket[];
  mappings: any[];
  gchatSpaces: GChatSpaceWithThreads[];
}) {
  const [tab, setTab] = useState("line");
  const lineThreads = useMemo(() => tickets.filter((t) => t.channel === "official_line"), [tickets]);
  const mailThreads = useMemo(() => tickets.filter((t) => t.channel === "email"), [tickets]);

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-3">
      <TabsList className="h-9">
        <TabsTrigger value="line" className="gap-2">
          <span className="flex h-4 w-4 items-center justify-center rounded bg-[#06C755] text-[10px] font-bold text-white">L</span>
          LINE
          <Badge variant="secondary" className="text-[10px]">{lineThreads.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="gchat" className="gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-orange-600" />
          Google Chat
          <Badge variant="secondary" className="text-[10px]">
            {gchatSpaces.reduce((s, sp) => s + sp.threads.length, 0)}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="mail" className="gap-2">
          <MailOpen className="h-3.5 w-3.5 text-blue-600" />
          メール
          <Badge variant="secondary" className="text-[10px]">{mailThreads.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="line">
        <ChatLayout
          threads={lineThreads.map((t) => ({
            id: t.id,
            title: t.customerName ?? "(未紐付け)",
            subtitle: t.subject,
            preview: t.messages.at(-1)?.content ?? "",
            unread: t.messages.filter((m) => m.direction === "inbound").length > 0,
            updatedAt: t.updatedAt,
            isUnmapped: t.isUnmapped,
            ticket: t,
            chip: "LINE",
          }))}
          gchat={false}
        />
      </TabsContent>

      <TabsContent value="gchat">
        <ChatLayoutGChat spaces={gchatSpaces} />
      </TabsContent>

      <TabsContent value="mail">
        <ChatLayout
          threads={mailThreads.map((t) => ({
            id: t.id,
            title: t.customerName ?? "(未紐付け)",
            subtitle: t.subject,
            preview: t.messages.at(-1)?.content ?? "",
            unread: t.messages.filter((m) => m.direction === "inbound").length > 0,
            updatedAt: t.updatedAt,
            isUnmapped: t.isUnmapped,
            ticket: t,
            chip: "Mail",
          }))}
          gchat={false}
        />
      </TabsContent>
    </Tabs>
  );
}

function ChatLayout({
  threads,
  gchat,
}: {
  threads: {
    id: string;
    title: string;
    subtitle: string;
    preview: string;
    unread: boolean;
    updatedAt: Date | string;
    isUnmapped: boolean;
    ticket: ChatTicket;
    chip: string;
  }[];
  gchat: boolean;
}) {
  const [active, setActive] = useState<string | null>(threads[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const filtered = threads.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()) || t.subtitle.toLowerCase().includes(query.toLowerCase()),
  );
  const current = threads.find((t) => t.id === active);

  return (
    <div className="grid h-[calc(100vh-220px)] grid-cols-[280px_1fr_300px] overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Left: Threads */}
      <div className="flex flex-col border-r bg-sumi-50/50 dark:bg-sumi-900/30">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="顧客名で検索…" className="h-8 pl-8 text-xs" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-muted-foreground">スレッドがありません</div>
          )}
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "flex w-full items-start gap-2 border-b border-border/50 p-3 text-left transition-colors hover:bg-background/60",
                active === t.id && "bg-background",
              )}
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback>{initials(t.title)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-bold">{t.title}</span>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(t.updatedAt)}</span>
                </div>
                <div className="truncate text-[11px] text-muted-foreground">{t.subtitle}</div>
                <div className="mt-1 line-clamp-1 text-[11px] text-foreground/70">{t.preview}</div>
                <div className="mt-1.5 flex items-center gap-1">
                  {t.isUnmapped && (
                    <Badge variant="warning" className="h-4 px-1 py-0 text-[9px]">
                      <Wand2 className="h-2.5 w-2.5" />
                      未紐付け
                    </Badge>
                  )}
                  {t.unread && (
                    <Badge className="h-4 bg-akane-600 px-1.5 py-0 text-[9px] text-white">未読</Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Center: Conversation */}
      <div className="flex flex-col">
        {current ? (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{current.title}</span>
                  <Badge variant="outline">{current.chip}</Badge>
                  {current.isUnmapped && <Badge variant="warning">未紐付け</Badge>}
                </div>
                <div className="text-[11px] text-muted-foreground">{current.subtitle}</div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={`/tickets/${current.ticket.publicId}`}>
                  チケット詳細を開く
                </Link>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto bg-sumi-50/40 px-4 py-3 dark:bg-sumi-900/30">
              {current.ticket.messages.map((m) => (
                <MessageBubble key={m.id} msg={m as any} />
              ))}
            </div>
            <div className="border-t p-3">
              <Composer
                ticketId={current.ticket.id}
                channel={current.chip === "LINE" ? "line" : "email"}
                placeholder={`${current.chip} で返信送信…`}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">スレッドを選択</div>
        )}
      </div>

      {/* Right: Customer panel */}
      <div className="flex flex-col border-l bg-sumi-50/40 p-4 dark:bg-sumi-900/30">
        {current?.ticket.customer ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">顧客マスタ</div>
              <div className="mt-1 text-sm font-bold">{current.ticket.customer.name}</div>
              <div className="text-[11px] font-mono text-muted-foreground">{current.ticket.customer.code}</div>
            </div>
            <Separator2 />
            {current.ticket.customer.contactName && <Row label="担当者" value={current.ticket.customer.contactName} />}
            {current.ticket.customer.phone && <Row label="電話" value={current.ticket.customer.phone} />}
            {current.ticket.customer.area && <Row label="エリア" value={current.ticket.customer.area} />}
            {current.ticket.customer.segment && <Row label="業態" value={current.ticket.customer.segment} />}
            <Separator2 />
            <div className="text-xs font-bold">最近の問合せ履歴</div>
            <div className="text-[11px] text-muted-foreground">この顧客の関連チケット数: {current.ticket.messages.length}</div>
          </div>
        ) : current ? (
          <div className="space-y-3 text-sm">
            <Badge variant="warning"><Wand2 className="h-3 w-3" /> 未紐付け</Badge>
            <p className="text-xs text-muted-foreground leading-relaxed">
              この LINE userId はまだ顧客マスタに紐付いていません。
              紐付け後、過去の問合せ履歴と統合表示されます。
            </p>
            <Button asChild size="sm" className="w-full" variant="ai">
              <Link href="/mappings">
                <Sparkles className="h-3 w-3" /> 紐付けToDoへ
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ChatLayoutGChat({ spaces }: { spaces: GChatSpaceWithThreads[] }) {
  const allThreads = spaces.flatMap((sp) => sp.threads.map((t) => ({ ...t, spaceName: sp.name })));
  const [active, setActive] = useState<string | null>(allThreads[0]?.id ?? null);
  const current = allThreads.find((t) => t.id === active);

  return (
    <div className="grid h-[calc(100vh-220px)] grid-cols-[280px_1fr_300px] overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-col border-r bg-sumi-50/50 dark:bg-sumi-900/30">
        <div className="border-b p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            Google Chat スペース
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {spaces.map((sp) => (
            <div key={sp.id}>
              <div className="bg-sumi-100/50 px-3 py-1 text-[10px] font-bold uppercase text-muted-foreground dark:bg-sumi-800/50">
                # {sp.name}
              </div>
              {sp.threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActive(t.id)}
                  className={cn(
                    "flex w-full items-center gap-2 border-b border-border/50 p-3 text-left text-sm hover:bg-background/60",
                    active === t.id && "bg-background",
                  )}
                >
                  <span className="text-orange-600">#</span>
                  <span className="truncate">{t.subject}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        {current ? (
          <>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <div className="font-bold"># {current.subject}</div>
                <div className="text-[11px] text-muted-foreground">{current.spaceName} スペース</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-sumi-50/40 px-4 py-3 dark:bg-sumi-900/30">
              {current.messages.map((m) => (
                <div key={m.id} className="flex gap-2 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={m.senderImg ?? undefined} />
                    <AvatarFallback>{initials(m.senderName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold">{m.senderName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(m.createdAt).toLocaleString("ja-JP")}
                      </span>
                    </div>
                    <div className="text-sm text-foreground/90 leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-3">
              <Composer channel="gchat" placeholder="このスレッドに投稿…" />
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">スレッドを選択</div>
        )}
      </div>
      <div className="flex flex-col border-l bg-sumi-50/40 p-4 dark:bg-sumi-900/30">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">スペース情報</div>
        {current && (
          <div className="mt-2 space-y-2 text-sm">
            <div className="font-bold"># {current.spaceName}</div>
            <p className="text-xs text-muted-foreground">業務管理プラットフォーム連携用スペース</p>
            <Separator2 />
            <Row label="参加者" value={`${current.messages.length} 人`} />
            <Row label="メッセージ数" value={`${current.messages.length}`} />
          </div>
        )}
      </div>
    </div>
  );
}

function Separator2() {
  return <div className="my-2 border-t" />;
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">{value}</span>
    </div>
  );
}
