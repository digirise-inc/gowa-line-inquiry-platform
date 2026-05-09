/**
 * RoleBadge — ロールに応じた色付きバッジ。
 * `getRoleOption()` の color クラスを利用。
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getRoleOption, type InvitationRole } from "@/lib/mock-invitations";

export function RoleBadge({
  role,
  className,
  showDescription = false,
}: {
  role: InvitationRole;
  className?: string;
  showDescription?: boolean;
}) {
  const meta = getRoleOption(role);
  if (!meta) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-md bg-sumi-100 px-2 py-0.5 text-xs font-medium text-sumi-700 ring-1 ring-sumi-200 dark:bg-sumi-800 dark:text-sumi-200 dark:ring-sumi-700",
          className,
        )}
      >
        {role}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1",
        meta.color,
        className,
      )}
      title={meta.description}
    >
      <span>{meta.label}</span>
      {showDescription && (
        <span className="ml-1 text-[10px] opacity-70">{meta.description}</span>
      )}
    </span>
  );
}
