/**
 * NextAuth.js v5 ルートハンドラー
 *
 * `handlers` には GET / POST が両方入っている (App Router 規約)。
 * Provider・コールバック等の設定は `@/lib/auth` に集約。
 */
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// Edge ではなく Node.js ランタイムで動かす (Prisma の都合)
export const runtime = "nodejs";
