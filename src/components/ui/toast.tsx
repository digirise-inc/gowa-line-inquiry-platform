/**
 * 軽量トーストプロバイダ。Radix の Toast プリミティブを使う。
 * 招待作成・取消・再送等のフィードバックに使用。
 *
 * 使い方:
 *   const { toast } = useToast();
 *   toast({ title: "保存しました", variant: "success" });
 */
"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        success:
          "border-wakaba-300 bg-wakaba-50 text-wakaba-900 dark:border-wakaba-700 dark:bg-wakaba-950/60 dark:text-wakaba-100",
        info: "border-ai-300 bg-ai-50 text-ai-900 dark:border-ai-700 dark:bg-ai-950/60 dark:text-ai-100",
        destructive:
          "border-akane-300 bg-akane-50 text-akane-900 dark:border-akane-700 dark:bg-akane-950/60 dark:text-akane-100",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

type ToastEntry = {
  id: string;
  title?: string;
  description?: React.ReactNode;
  variant?: VariantProps<typeof toastVariants>["variant"];
  duration?: number;
};

type ToastContextValue = {
  toasts: ToastEntry[];
  toast: (entry: Omit<ToastEntry, "id">) => string;
  dismiss: (id: string) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    // プロバイダ外でも例外にせず no-op で動作させる(SSR・テスト時のため)
    return {
      toasts: [],
      toast: () => "",
      dismiss: () => {},
    } satisfies ToastContextValue;
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>((entry) => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, duration: 4000, ...entry }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            duration={t.duration}
            onOpenChange={(open) => {
              if (!open) dismiss(t.id);
            }}
            className={cn(toastVariants({ variant: t.variant }))}
          >
            <div className="flex-1 space-y-1">
              {t.title && (
                <ToastPrimitive.Title className="text-sm font-semibold leading-tight">
                  {t.title}
                </ToastPrimitive.Title>
              )}
              {t.description && (
                <ToastPrimitive.Description className="text-xs leading-relaxed opacity-90">
                  {t.description}
                </ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              aria-label="閉じる"
              className="absolute right-2 top-2 rounded-md p-1 opacity-60 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 outline-none" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
