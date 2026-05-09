"use client";

import Link from "next/link";
import {
  Bell,
  Search,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Wand2,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function Topbar({ unmappedCount = 0 }: { unmappedCount?: number }) {
  const { data: session } = useSession();
  const { setTheme, theme } = useTheme();
  const user = session?.user as
    | { name?: string | null; email?: string | null; image?: string | null; role?: string; title?: string | null; isDemo?: boolean }
    | undefined;
  const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || user?.isDemo === true;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* search */}
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="チケット・顧客・LINEユーザーを検索…" className="h-9 pl-8 text-sm" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {unmappedCount > 0 && (
          <Badge variant="warning" className="px-2 py-1">
            <Wand2 className="h-3 w-3" />
            <span>未紐付け {unmappedCount}件</span>
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="テーマ切替"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" aria-label="通知">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? ""} />
                <AvatarFallback>{initials(user?.name ?? "?")}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left leading-tight md:block">
                <div className="text-xs font-medium">{user?.name ?? "ゲスト"}</div>
                <div className="text-[10px] text-muted-foreground">
                  {user?.title ?? user?.role ?? "—"}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserIcon className="h-4 w-4" />
              プロフィール
            </DropdownMenuItem>
            {isDemo && (
              <DropdownMenuItem asChild>
                <Link
                  href="/login?demo=true"
                  data-testid="switch-demo-role"
                  className="flex w-full cursor-pointer items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  他のロールで試す
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4" />
              ログアウト
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
