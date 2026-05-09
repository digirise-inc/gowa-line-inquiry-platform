"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CHANNELS, KANBAN_COLUMNS, PRIORITIES, STATUS_BY_VALUE } from "@/lib/constants";
import { cn, initials, timeAgo } from "@/lib/utils";
import { AlertOctagon, Clock, MessageSquare, Wand2, GripVertical } from "lucide-react";
import type { Ticket, User, Customer } from "@prisma/client";
import Link from "next/link";

type TicketLite = Ticket & { assignee: User | null; customer: Customer | null };

const WIP_LIMITS: Record<string, number> = {
  open: 10,
  triaging: 8,
  internal_check: 6,
  supplier_quote: 5,
  awaiting_reply: 8,
  answered: 999,
  closed_won: 999,
  closed_lost: 999,
};

export function KanbanBoard({ initialTickets }: { initialTickets: TicketLite[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // sync external updates
  useEffect(() => setTickets(initialTickets), [initialTickets]);

  const grouped = useMemo(() => {
    const g: Record<string, TicketLite[]> = {};
    KANBAN_COLUMNS.forEach((c) => (g[c] = []));
    for (const t of tickets) {
      if (!g[t.status]) g[t.status] = [];
      g[t.status].push(t);
    }
    return g;
  }, [tickets]);

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const overId = e.over?.id ? String(e.over.id) : null;
    const ticketId = String(e.active.id);
    if (!overId) return;
    // 同じカラム内なら何もしない
    const t = tickets.find((tt) => tt.id === ticketId);
    if (!t || t.status === overId) return;

    // optimistic update
    setTickets((prev) => prev.map((tt) => (tt.id === ticketId ? ({ ...tt, status: overId } as TicketLite) : tt)));

    // server
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: overId }),
      });
    } catch (err) {
      // revert
      setTickets((prev) => prev.map((tt) => (tt.id === ticketId ? ({ ...tt, status: t.status } as TicketLite) : tt)));
    }
  }

  const active = activeId ? tickets.find((t) => t.id === activeId) : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex w-full gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <Column key={col} status={col} tickets={grouped[col] ?? []} />
        ))}
      </div>
      <DragOverlay>{active ? <TicketChip ticket={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}

function Column({ status, tickets }: { status: string; tickets: TicketLite[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_BY_VALUE[status as keyof typeof STATUS_BY_VALUE];
  const wip = WIP_LIMITS[status] ?? 999;
  const overWip = tickets.length > wip;

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className={cn("rounded-t-xl border-x border-t bg-card px-3 py-2.5", overWip && "border-akane-400")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", meta?.bg.replace("bg-", "bg-").replace("/40", ""))} />
            <span className="text-sm font-bold">{meta?.label}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] tabular-nums">
              {tickets.length}
            </Badge>
          </div>
          {wip < 999 && (
            <span className={cn("text-[10px] tabular-nums", overWip ? "text-akane-600 font-bold" : "text-muted-foreground")}>
              WIP {tickets.length}/{wip}
            </span>
          )}
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[400px] flex-1 flex-col gap-2 rounded-b-xl border bg-sumi-50/40 p-2 transition-colors dark:bg-sumi-900/20",
          isOver && "bg-ai-50 ring-2 ring-ai-300 dark:bg-ai-950/30",
        )}
      >
        {tickets.map((t) => (
          <DraggableCard key={t.id} ticket={t} />
        ))}
        {tickets.length === 0 && (
          <div className="flex h-20 items-center justify-center text-[11px] text-muted-foreground/60">
            ドラッグして移動
          </div>
        )}
      </div>
    </div>
  );
}

function DraggableCard({ ticket }: { ticket: TicketLite }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ticket.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn("touch-none", isDragging && "opacity-30")}
    >
      <TicketChip ticket={ticket} listeners={listeners} />
    </div>
  );
}

function TicketChip({
  ticket,
  listeners,
  dragging = false,
}: {
  ticket: TicketLite;
  listeners?: any;
  dragging?: boolean;
}) {
  const channel = CHANNELS.find((c) => c.value === ticket.channel) ?? CHANNELS[0];
  const pri = PRIORITIES.find((p) => p.value === ticket.priority);
  const isEscalated = ticket.status === "escalated";

  return (
    <div
      className={cn(
        "rounded-lg border bg-card shadow-sm transition-all",
        dragging ? "rotate-2 cursor-grabbing shadow-xl" : "hover:shadow-md",
        isEscalated && "border-akane-300 ring-1 ring-akane-200 dark:border-akane-700 dark:ring-akane-900",
      )}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          {...listeners}
          className="flex h-6 w-4 shrink-0 cursor-grab items-center justify-center text-muted-foreground/40 hover:text-muted-foreground"
          aria-label="ドラッグハンドル"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <Link href={`/tickets/${ticket.publicId}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-muted-foreground">{ticket.publicId}</span>
            <Badge variant="outline" className={`px-1 py-0 text-[10px] ${channel.bg} ${channel.color}`}>
              {channel.label}
            </Badge>
            {pri && pri.value !== "normal" && pri.value !== "low" && (
              <Badge className={`${pri.color} px-1 py-0 text-[10px]`}>{pri.label}</Badge>
            )}
            {isEscalated && <AlertOctagon className="h-3 w-3 text-akane-600" />}
          </div>
          <div className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug">{ticket.subject}</div>
          {ticket.customerName && (
            <div className="mt-0.5 text-[10px] text-muted-foreground">{ticket.customerName}</div>
          )}
          <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground">{ticket.preview}</p>
          {ticket.isUnmapped && (
            <Badge variant="warning" className="mt-1.5 px-1 py-0 text-[10px]">
              <Wand2 className="h-3 w-3" /> 未紐付け
            </Badge>
          )}
        </Link>
      </div>
      <div className="flex items-center justify-between border-t px-3 py-1.5 text-[10px]">
        <div className="flex items-center gap-1">
          <Avatar className="h-5 w-5">
            <AvatarImage src={ticket.assignee?.image ?? undefined} />
            <AvatarFallback>{initials(ticket.assignee?.name ?? "?")}</AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground">{ticket.assignee?.name?.split(" ")[0] ?? "未割当"}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          {timeAgo(ticket.createdAt)}
        </div>
      </div>
    </div>
  );
}
