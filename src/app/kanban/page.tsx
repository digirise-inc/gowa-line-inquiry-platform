import { AppShell } from "@/components/layout/app-shell";
import { KanbanBoard } from "@/components/kanban/board";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTicketsList, getUnmappedCount, getUsers } from "@/lib/queries";
import { Plus, KanbanSquare, Filter } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KanbanPage() {
  const [tickets, users, unmappedCount] = await Promise.all([
    getTicketsList(),
    getUsers(),
    getUnmappedCount(),
  ]);

  const inboundCount = tickets.filter((t) => t.kind === "inbound").length;
  const outboundCount = tickets.filter((t) => t.kind === "outbound").length;

  return (
    <AppShell unmappedCount={unmappedCount}>
      <div className="mx-auto h-full max-w-[1800px] space-y-4 p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="ai">
                <KanbanSquare className="h-3 w-3" />
                Kanban
              </Badge>
              <span className="text-xs text-muted-foreground">8段階ステータスFSM (SPEC §5.2)</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">カンバンビュー</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              ドラッグで状態変更。WIPリミット超過は赤枠で警告。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="px-2.5 py-1 text-xs">
              inbound: {inboundCount}
            </Badge>
            <Badge variant="secondary" className="px-2.5 py-1 text-xs">
              outbound: {outboundCount}
            </Badge>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4" />
              フィルタ
            </Button>
            <Button variant="ai" size="sm">
              <Plus className="h-4 w-4" />
              新規チケット
            </Button>
          </div>
        </header>

        <KanbanBoard initialTickets={tickets} />
      </div>
    </AppShell>
  );
}
