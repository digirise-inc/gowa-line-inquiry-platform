/**
 * StatusBadge — pending / accepted / revoked / expired の色付きバッジ。
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  INVITATION_STATUS_META,
  type InvitationStatus,
} from "@/lib/mock-invitations";

export function StatusBadge({
  status,
  className,
}: {
  status: InvitationStatus;
  className?: string;
}) {
  const meta = INVITATION_STATUS_META[status];
  return (
    <span
      title={meta.description}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
        meta.color,
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      {meta.label}
    </span>
  );
}
