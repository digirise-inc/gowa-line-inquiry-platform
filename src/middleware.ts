import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/api/auth",
  "/api/webhook",
  "/_next",
  "/favicon",
  "/api/health",
  // 招待受諾フローは未認証ユーザーが触る
  "/invite",
  "/api/invitations/accept",
];

/**
 * 管理者/マネージャー専用ルート (デモロール: kowa / finance / manager)
 * driver / staff_office / staff_field はアクセスすると / にリダイレクト (denied=… を付与)
 *
 * `/admin/users` は spec 上 manager / finance / kowa が利用するので
 * `ADMIN_ROLES` セットを共通利用する (finance を除外しない)。
 */
const ADMIN_ONLY_PREFIXES = ["/settings", "/admin"];
const ADMIN_ROLES = new Set(["kowa", "finance", "manager"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.includes(".")) return NextResponse.next(); // assets

  if (!req.auth) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const role = (req.auth.user as { role?: string } | undefined)?.role;

  // 権限ガード: 管理者専用ルートは ADMIN_ROLES のみ通す
  if (ADMIN_ONLY_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (!role || !ADMIN_ROLES.has(role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("denied", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
