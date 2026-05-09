"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CHANNELS, PRIORITIES, STATUS_BY_VALUE } from "@/lib/constants";
import { initials, timeAgo } from "@/lib/utils";
import { Clock, Wand2, ArrowUpRight, MessageSquare, AlertOctagon, CornerUpRight } from "lucide-react";
import type { Ticket, User, Customer } from "@prisma/client";

export type TicketLite = Ticket & {
  assignee: User | null;
  customer: Customer | null;
  messages?: { id: string }[];
};

export function TicketCard({ ticket, dense = false }: { ticket: TicketLite; dense?: boolean }) {
  const status = STATUS_BY_VALUE[ticket.status as keyof typeof STATUS_BY_VALUE] ?? STATUS_BY_VALUE.open;
  const channel = CHANNELS.find((c) => c.value === ticket.channel) ?? CHANNELS[0];
  const pri = PRIORITIES.find((p) => p.value === ticket.priority);
  const isEscalated = ticket.status === "escalated";

  return (
    <Link
      href={`/tickets/${ticket.publicId}`}
      className={`group block rounded-xl border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md ${
        isEscalated ? "border-akane-300 ring-1 ring-akane-200 dark:border-akane-700 dark:ring-akane-900" : ""
      }`}
    >
      <div className={dense ? "p-3" : "p-4"}>
        <div className="flex items-start justify-between gap-2">
          <Badge className={`${status.bg} ${status.color} ring-1 ${status.ring}`}>
            {isEscalated && <AlertOctagon className="h-3 w-3" />}
            {status.label}
          </Badge>
          {pri && pri.value !== "normal" && <Badge className={pri.color}>{pri.label}</Badge>}
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="font-mono text-muted-foreground">{ticket.publicId}</span>
          <span className="text-muted-foreground">·</span>
          <Badge variant="outline" className={`px-1.5 py-0 ${channel.bg} ${channel.color}`}>
            {channel.label}
          </Badge>
          {ticket.kind === "outbound" && (
            <Badge variant="outline" className="px-1.5 py-0 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300">
              <CornerUpRight className="h-3 w-3" />
              outbound
            </Badge>
          )}
          {ticket.isUnmapped && (
            <Badge variant="warning" className="px-1.5 py-0">
              <Wand2 className="h-3 w-3" />
              未紐付け
            </Badge>
          )}
        </div>

        <div className="mt-2">
          <div className="text-sm font-bold leading-snug">{ticket.subject}</div>
          {ticket.customerName && (
            <div className="mt-0.5 text-[11px] text-muted-foreground">{ticket.customerName}</div>
          )}
          <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-foreground/80">{ticket.preview}</p>
          {ticket.handoverNote && (
            <div className="mt-2 rounded-md bg-amber-50 p-2 text-[11px] leading-snug text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900">
              📝 引き継ぎ: {ticket.handoverNote.length > 80 ? `${ticket.handoverNote.slice(0, 80)}…` : ticket.handoverNote}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={ticket.assignee?.image ?? undefined} />
              <AvatarFallback>{initials(ticket.assignee?.name ?? "?")}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">{ticket.assignee?.name ?? "未割当"}</span>
            {ticket.messages && ticket.messages.length > 0 && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {ticket.messages.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(ticket.createdAt)}
          </div>
        </div>
      </div>
    </Link>
  );
}
