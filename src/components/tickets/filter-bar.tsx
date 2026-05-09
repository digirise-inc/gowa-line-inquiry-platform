"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CATEGORIES, CHANNELS, TICKET_STATUSES } from "@/lib/constants";
import { X } from "lucide-react";
import type { User } from "@prisma/client";

export function FilterBar({ users }: { users: User[] }) {
  const params = useSearchParams();
  const router = useRouter();

  function set(key: string, val: string | null) {
    const np = new URLSearchParams(params.toString());
    if (!val || val === "all") np.delete(key);
    else np.set(key, val);
    router.replace(`/tickets?${np.toString()}`);
  }
  function toggleUnmapped() {
    const np = new URLSearchParams(params.toString());
    if (np.get("isUnmapped") === "1") np.delete("isUnmapped");
    else np.set("isUnmapped", "1");
    router.replace(`/tickets?${np.toString()}`);
  }
  function clear() {
    router.replace("/tickets");
  }

  const status = params.get("status") ?? "all";
  const assignee = params.get("assigneeId") ?? "all";
  const channel = params.get("channel") ?? "all";
  const category = params.get("category") ?? "all";
  const isUnmapped = params.get("isUnmapped") === "1";
  const hasFilter = status !== "all" || assignee !== "all" || channel !== "all" || category !== "all" || isUnmapped;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <Select value={status} onValueChange={(v) => set("status", v)}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <SelectValue placeholder="ステータス" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全ステータス</SelectItem>
          {TICKET_STATUSES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={assignee} onValueChange={(v) => set("assigneeId", v)}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue placeholder="担当者" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全担当者</SelectItem>
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id}>
              {u.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={channel} onValueChange={(v) => set("channel", v)}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="チャネル" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全チャネル</SelectItem>
          {CHANNELS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={category} onValueChange={(v) => set("category", v)}>
        <SelectTrigger className="h-8 w-[120px] text-xs">
          <SelectValue placeholder="カテゴリ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全カテゴリ</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-2 flex items-center gap-2 rounded-lg border bg-amber-50/50 px-3 py-1.5 dark:bg-amber-950/20">
        <Switch checked={isUnmapped} onCheckedChange={toggleUnmapped} id="unmapped" />
        <Label htmlFor="unmapped" className="cursor-pointer text-xs">
          未紐付けのみ
        </Label>
      </div>

      {hasFilter && (
        <Button variant="ghost" size="xs" onClick={clear}>
          <X className="h-3 w-3" />
          クリア
        </Button>
      )}
    </div>
  );
}
