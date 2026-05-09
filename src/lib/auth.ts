import NextAuth, { type NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./prisma";
import {
  getDemoUserByRole,
  isDemoMode,
  type DemoRole,
} from "./demo-users";

const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS ?? "")
  .split(",")
  .map((d) => d.trim())
  .filter(Boolean);

const DEMO = isDemoMode();

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(db) as any,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
    // ─────────────────────────────────────────
    // デモモード用 Credentials Provider
    // role を allowlist と照合 → 固定 DEMO_USERS から解決
    // ─────────────────────────────────────────
    ...(DEMO
      ? [
          CredentialsProvider({
            id: "demo",
            name: "Demo Login",
            credentials: {
              role: { label: "Demo Role", type: "text" },
            },
            async authorize(credentials) {
              const rawRole = credentials?.role;
              const demoUser = getDemoUserByRole(
                typeof rawRole === "string" ? rawRole : null,
              );
              if (!demoUser) return null;

              // DB upsert は best-effort（Vercel SQLite がread-onlyな環境でも動くよう例外吸収）
              try {
                await db.user.upsert({
                  where: { id: demoUser.id },
                  update: {
                    name: demoUser.name,
                    email: demoUser.email,
                    image: demoUser.image,
                    role: demoUser.prismaRole,
                    position: demoUser.title,
                  },
                  create: {
                    id: demoUser.id,
                    name: demoUser.name,
                    email: demoUser.email,
                    image: demoUser.image,
                    role: demoUser.prismaRole,
                    position: demoUser.title,
                  },
                });
              } catch (err) {
                // SQLiteがread-onlyやテーブルがない場合でも、JWTセッションで動作継続
                console.warn("[demo-auth] DB upsert skipped:", String(err).slice(0, 120));
              }

              // DB の有無に関わらず、固定 DEMO_USERS から返す（JWTセッションへ焼き込み）
              return {
                id: demoUser.id,
                name: demoUser.name,
                email: demoUser.email,
                image: demoUser.image,
                // 後続の jwt() で参照できる拡張フィールド
                role: demoUser.role,
                prismaRole: demoUser.prismaRole,
                title: demoUser.title,
                permissions: demoUser.permissions,
                isDemo: true,
              } as any;
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // デモログインは無条件許可 (NextAuth v5 では Credentials の id がそのまま入る)
      if (account?.provider === "demo" || account?.type === "credentials") return true;
      if (DEMO) return true;
      if (allowedDomains.length === 0) return true;
      const email = user.email?.toLowerCase() ?? "";
      const domain = email.split("@")[1] ?? "";
      return allowedDomains.includes(domain);
    },
    async jwt({ token, user, trigger }) {
      // 初回ログイン時に user オブジェクトから JWT に焼き込む
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role ?? "staff_office";
        token.prismaRole = (user as any).prismaRole;
        token.title = (user as any).title;
        token.permissions = (user as any).permissions ?? [];
        token.isDemo = (user as any).isDemo ?? false;
      }

      // デモロールを「他のロールで試す」で切り替えた直後など、トークンを更新したいケース
      if (trigger === "update" && token.id) {
        try {
          const u = await db.user.findUnique({ where: { id: token.id as string } });
          if (u) {
            token.role = u.role as DemoRole | string;
            token.title = u.position ?? token.title;
          }
        } catch {
          // DB read fail (Vercel SQLite等) は無視。JWT に既に焼き込まれた値を維持
        }
      }

      // role が空のときの fallback (Google 経由ログイン等)
      if (token.id && !token.role) {
        try {
          const u = await db.user.findUnique({ where: { id: token.id as string } });
          token.role = u?.role ?? "staff_office";
          token.title = u?.position ?? null;
        } catch {
          token.role = "staff_office";
        }
      }

      // permissions が空のとき、デモロール定義から再構築
      if ((!token.permissions || (token.permissions as any[]).length === 0) && token.role) {
        const demo = getDemoUserByRole(token.role as string);
        if (demo) {
          token.permissions = demo.permissions;
          token.title = token.title ?? demo.title;
          token.isDemo = true;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const su = session.user as any;
        su.id = token.id as string;
        su.role = token.role as string;
        su.title = token.title as string | undefined;
        su.permissions = (token.permissions as string[] | undefined) ?? [];
        su.isDemo = (token.isDemo as boolean | undefined) ?? false;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
