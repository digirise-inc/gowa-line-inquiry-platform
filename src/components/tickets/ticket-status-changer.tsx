"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TICKET_STATUSES, STATUS_BY_VALUE } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export function TicketStatusChanger({ ticketId, currentStatus }: { ticketId: string; currentStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [pending, setPending] = useState(false);

  async function update(v: string) {
    setStatus(v);
    setPending(true);
    try {
      await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: v }),
      });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const meta = STATUS_BY_VALUE[status as keyof typeof STATUS_BY_VALUE];

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${meta?.bg} ${meta?.color} ring-1 ${meta?.ring} px-2.5 py-1`}>{meta?.label}</Badge>
      <Select value={status} onValueChange={update} disabled={pending}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder="ステータス変更" />
        </SelectTrigger>
        <SelectContent>
          {TICKET_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
