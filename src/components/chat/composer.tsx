"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, Sparkles, Wand2, Smile, Paperclip } from "lucide-react";
import { ASK_TEMPLATES } from "@/lib/constants";

export function Composer({
  ticketId,
  channel = "line",
  suggestedTemplateId,
  placeholder = "返信を入力…",
  onSent,
}: {
  ticketId?: string;
  channel?: "line" | "email" | "gchat" | "manual";
  suggestedTemplateId?: string | null;
  placeholder?: string;
  onSent?: () => void;
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  const tpl = suggestedTemplateId ? ASK_TEMPLATES[suggestedTemplateId] : null;

  async function send() {
    if (!text.trim()) return;
    setPending(true);
    try {
      // ticketId が無い場合はクライアント完結 (Google Chat 単独投稿等)
      if (ticketId) {
        await fetch("/api/messages/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId, channel, content: text }),
        });
      } else {
        // mock: 送信成功演出のみ
        await new Promise((r) => setTimeout(r, 400));
      }
      setText("");
      router.refresh();
      onSent?.();
    } finally {
      setPending(false);
    }
  }

  function applyTemplate(key: keyof typeof ASK_TEMPLATES) {
    setText(ASK_TEMPLATES[key].body);
  }

  return (
    <div className="space-y-2 rounded-xl border bg-card p-3">
      {tpl && (
        <div className="flex items-center gap-2 rounded-lg bg-ai-50 p-2 text-xs ring-1 ring-ai-200 dark:bg-ai-950/40 dark:ring-ai-900">
          <Sparkles className="h-3.5 w-3.5 text-ai-600" />
          <div className="flex-1">
            <span className="font-bold text-ai-700 dark:text-ai-300">AIサジェスト:</span>
            <span className="ml-1 text-foreground">{tpl.label}</span>
          </div>
          <Button
            type="button"
            size="xs"
            variant="ai"
            onClick={() => applyTemplate(suggestedTemplateId as keyof typeof ASK_TEMPLATES)}
          >
            <Wand2 className="h-3 w-3" />
            下書きにコピー
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1">
        <Badge variant="outline" className="bg-[#06C755]/10 text-[#06C755]">
          送信先: {channel === "line" ? "LINE" : channel === "gchat" ? "Google Chat" : channel === "email" ? "Email" : "Manual"}
        </Badge>
        <span className="text-[10px] text-muted-foreground">テンプレ:</span>
        {Object.entries(ASK_TEMPLATES).map(([k, v]) => (
          <Button key={k} type="button" size="xs" variant="ghost" onClick={() => applyTemplate(k as keyof typeof ASK_TEMPLATES)}>
            {v.label}
          </Button>
        ))}
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="min-h-[88px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send();
        }}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
            <Smile className="h-4 w-4" />
          </Button>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8">
            <Paperclip className="h-4 w-4" />
          </Button>
          <span className="text-[11px]">⌘+Enter で送信</span>
        </div>
        <Button onClick={send} disabled={pending || !text.trim()} variant="default" size="sm">
          {pending ? "送信中…" : (
            <>
              <Send className="h-4 w-4" />
              送信
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
