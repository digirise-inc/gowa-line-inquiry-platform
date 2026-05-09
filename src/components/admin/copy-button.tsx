/**
 * CopyButton — テキストをクリップボードにコピーする小型ボタン。
 * 招待URLのコピーで使用。
 */
"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function CopyButton({
  value,
  label = "コピー",
  variant = "outline",
  size = "sm",
  className,
}: {
  value: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const handleClick = React.useCallback(async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard API not available");
      }
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast({
        title: "コピーしました",
        description: value.length > 60 ? `${value.slice(0, 60)}…` : value,
        variant: "success",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "コピーに失敗しました",
        description: "ブラウザがクリップボードをサポートしていない可能性があります",
        variant: "destructive",
      });
    }
  }, [value, toast]);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("gap-1.5", className)}
      data-testid="copy-button"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span>{copied ? "コピー済" : label}</span>
    </Button>
  );
}
