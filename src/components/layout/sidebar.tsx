"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ListChecks,
  KanbanSquare,
  MessagesSquare,
  Link2,
  Settings,
  ChevronRight,
  Sparkles,
  Users,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge: string | null;
  /** 表示権限。未指定なら全員 */
  roles?: ReadonlyArray<string>;
};

const ADMIN_ROLES = ["kowa", "manager", "finance"] as const;

const NAV: ReadonlyArray<NavItem> = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard, badge: null },
  { href: "/tickets", label: "チケット一覧", icon: ListChecks, badge: null },
  { href: "/kanban", label: "カンバン", icon: KanbanSquare, badge: null },
  { href: "/chat", label: "チャット統合", icon: MessagesSquare, badge: "NEW" },
  { href: "/mappings", label: "マッピング管理", icon: Link2, badge: null },
  {
    href: "/admin/users",
    label: "ユーザー管理",
    icon: Users,
    badge: null,
    roles: ADMIN_ROLES,
  },
  { href: "/settings", label: "設定", icon: Settings, badge: null, roles: ADMIN_ROLES },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const items = NAV.filter((n) => !n.roles || (role && n.roles.includes(role)));
  return (
    <aside className="hidden w-60 shrink-0 border-r bg-sumi-50/60 dark:bg-sumi-900/60 lg:flex lg:flex-col">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-ai-500 via-ai-600 to-akane-600 text-white shadow-sm">
          <Sparkles className="h-4 w-4" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold">業務管理</span>
          <span className="text-[10px] text-muted-foreground">ゴワ Phase 1.0</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active && "text-ai-600")} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="rounded bg-akane-500/15 px-1.5 py-px text-[10px] font-bold text-akane-700 dark:text-akane-300">
                  {item.badge}
                </span>
              )}
              {active && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-3 text-xs text-muted-foreground">
        <div className="rounded-lg bg-background/80 p-3 ring-1 ring-border">
          <div className="font-medium text-foreground">Phase 1.0</div>
          <div className="mt-0.5 text-[11px] leading-relaxed">受信・マッピング蓄積。<br />Phase 1.5 でPUSH配信。</div>
        </div>
      </div>
    </aside>
  );
}
