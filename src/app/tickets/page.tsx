import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TicketCard } from "@/components/tickets/ticket-card";
import { FilterBar } from "@/components/tickets/filter-bar";
import { getTicketsList, getUnmappedCount, getUsers } from "@/lib/queries";
import { Plus, Inbox } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TicketsPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const [tickets, users, unmappedCount] = await Promise.all([
    getTicketsList({
      status: searchParams?.status,
      assigneeId: searchParams?.assigneeId,
      channel: searchParams?.channel,
      category: searchParams?.category,
      isUnmapped: searchParams?.isUnmapped === "1",
    }),
    getUsers(),
    getUnmappedCount(),
  ]);

  return (
    <AppShell unmappedCount={unmappedCount}>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">チケット一覧</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              全チャネル横断で {tickets.length} 件のチケットを表示中
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="ai" size="sm">
              <Plus className="h-4 w-4" />
              新規チケット
            </Button>
          </div>
        </header>

        <FilterBar users={users} />

        {tickets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 p-16 text-center">
              <Inbox className="h-12 w-12 text-muted-foreground/40" />
              <div className="font-medium">該当するチケットはありません</div>
              <div className="text-sm text-muted-foreground">フィルタを変更してお試しください</div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tickets.map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
