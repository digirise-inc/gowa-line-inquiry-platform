"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function AppShell({
  children,
  unmappedCount = 0,
}: {
  children: React.ReactNode;
  unmappedCount?: number;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar unmappedCount={unmappedCount} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
