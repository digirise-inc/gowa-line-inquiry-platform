import { AppShell } from "@/components/layout/app-shell";
import { ChatWorkspace } from "@/components/chat/chat-workspace";
import { db } from "@/lib/prisma";
import { getUnmappedCount } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const [tickets, mappings, gchatSpaces, unmappedCount] = await Promise.all([
    db.ticket.findMany({
      where: { channel: { in: ["official_line", "email"] } },
      include: { messages: { orderBy: { sentAt: "asc" } }, customer: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.lineMapping.findMany({ include: { customer: true } }),
    db.gchatSpace.findMany({
      include: { threads: { include: { messages: { orderBy: { createdAt: "asc" } } } } },
    }),
    getUnmappedCount(),
  ]);

  return (
    <AppShell unmappedCount={unmappedCount}>
      <div className="mx-auto max-w-[1800px] p-4 lg:p-6">
        <header className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">チャット統合</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            LINE / Google Chat / メール を1画面で受信・返信。送信は本プラットフォームから直接実行。
          </p>
        </header>
        <ChatWorkspace
          tickets={tickets as any}
          mappings={mappings as any}
          gchatSpaces={gchatSpaces as any}
        />
      </div>
    </AppShell>
  );
}
