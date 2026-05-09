"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, formatJpDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CHANNELS } from "@/lib/constants";

export type ChatMessage = {
  id: string;
  direction: string; // inbound | outbound | internal
  channel: string;
  senderName: string;
  senderImage?: string | null;
  content: string;
  contentType?: string;
  sentAt: Date | string;
};

export function MessageBubble({ msg }: { msg: ChatMessage }) {
  const sentAt = typeof msg.sentAt === "string" ? new Date(msg.sentAt) : msg.sentAt;
  const isInbound = msg.direction === "inbound";
  const isInternal = msg.direction === "internal";
  const channel = CHANNELS.find((c) => c.value === msg.channel) ?? CHANNELS[0];

  if (isInternal) {
    return (
      <div className="my-2 mx-auto max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        <span className="mr-1 font-bold">📝 内部メモ</span>
        <span className="font-medium">{msg.senderName}:</span> {msg.content}
        <div className="mt-0.5 text-[10px] opacity-60">{formatJpDateTime(sentAt)}</div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 my-2", isInbound ? "justify-start" : "justify-end")}>
      {isInbound && (
        <Avatar className="h-7 w-7">
          <AvatarImage src={msg.senderImage ?? undefined} />
          <AvatarFallback>{initials(msg.senderName)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn("max-w-[70%] flex flex-col", isInbound ? "items-start" : "items-end")}>
        <div className="mb-0.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="font-medium">{msg.senderName}</span>
          <span className={`px-1 py-0 rounded ${channel.bg} ${channel.color} text-[9px] font-bold`}>{channel.label}</span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
            isInbound
              ? "bg-white text-foreground rounded-tl-sm border border-sumi-200 dark:bg-sumi-800 dark:border-sumi-700"
              : "bg-[#06C755] text-white rounded-tr-sm",
          )}
        >
          {msg.content}
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">{formatJpDateTime(sentAt)}</div>
      </div>
      {!isInbound && (
        <Avatar className="h-7 w-7">
          <AvatarImage src={msg.senderImage ?? undefined} />
          <AvatarFallback>{initials(msg.senderName)}</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
