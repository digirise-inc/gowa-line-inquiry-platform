/**
 * デモアカウント定義
 *
 * Vercel デモ環境用のワンクリックログイン対象ユーザー一覧。
 * - 4ロール (kowa / staff_office / driver / finance) にわたる権限差分を提供
 * - 配列は immutable な固定値。ユーザー入力からは絶対に生成しない
 * - role は allowlist として `DEMO_USER_ROLES` で照合してから採用する
 *
 * SECURITY: プロンプトインジェクション対策として、
 *   `getDemoUserByRole()` 経由でしかユーザー解決しない。
 */

export type DemoPermission =
  | "admin"
  | "manager"
  | "view_all"
  | "view_assigned"
  | "view_self"
  | "create_ticket"
  | "mapping"
  | "mobile"
  | "kpi";

export type DemoRole = "kowa" | "staff_office" | "driver" | "finance";

export type DemoUser = {
  /** Prisma User.id とそろえる固定 ID */
  id: string;
  role: DemoRole;
  /** Prisma User.role に保存する値 (manager | staff_office | driver | finance) */
  prismaRole: "manager" | "staff_office" | "driver" | "finance";
  name: string;
  email: string;
  image: string;
  title: string;
  permissions: DemoPermission[];
  /** カード表示用の短い説明 */
  description: string;
  /** カード装飾アイコン (lucide-react / 絵文字どちらでも) */
  emoji: string;
  /** カード表示用のアクセントカラー (Tailwind classes) */
  accent: string;
};

export const DEMO_USERS: readonly DemoUser[] = [
  {
    id: "demo-kowa",
    role: "kowa",
    prismaRole: "manager",
    name: "後和 直樹",
    email: "demo+kowa@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=GN&backgroundColor=274af0",
    title: "専務 / 管理者",
    permissions: ["admin", "manager", "view_all"],
    description: "全件閲覧・全機能利用・経営判断",
    emoji: "👨‍💼",
    accent: "from-ai-600 to-ai-500",
  },
  {
    id: "demo-nakao",
    role: "staff_office",
    prismaRole: "staff_office",
    name: "中尾 花子",
    email: "demo+nakao@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=NH&backgroundColor=28b53d",
    title: "管理部・事務員",
    permissions: ["view_assigned", "create_ticket", "mapping"],
    description: "LINE 一次対応・マッピング",
    emoji: "👩‍💻",
    accent: "from-wakaba-600 to-wakaba-500",
  },
  {
    id: "demo-tanaka",
    role: "driver",
    prismaRole: "driver",
    name: "田中 健",
    email: "demo+tanaka@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=TK&backgroundColor=8b5cf6",
    title: "営業ドライバー",
    permissions: ["view_self", "mobile"],
    description: "モバイル想定・自分担当のみ",
    emoji: "🚚",
    accent: "from-purple-600 to-purple-500",
  },
  {
    id: "demo-tsujino",
    role: "finance",
    prismaRole: "finance",
    name: "辻野 和彦",
    email: "demo+tsujino@gowa58.co.jp",
    image: "https://api.dicebear.com/9.x/initials/png?seed=TZ&backgroundColor=f59e0b",
    title: "経理 / 横断管理",
    permissions: ["view_all", "kpi"],
    description: "KPI 閲覧・数値見える化",
    emoji: "📊",
    accent: "from-amber-600 to-amber-500",
  },
] as const;

/** allowlist として安全に role を解決する */
export const DEMO_USER_ROLES: readonly DemoRole[] = DEMO_USERS.map((u) => u.role);

export function isDemoRole(value: unknown): value is DemoRole {
  return typeof value === "string" && (DEMO_USER_ROLES as readonly string[]).includes(value);
}

export function getDemoUserByRole(role: string | null | undefined): DemoUser | null {
  if (!isDemoRole(role)) return null;
  return DEMO_USERS.find((u) => u.role === role) ?? null;
}

export function getDemoUserById(id: string | null | undefined): DemoUser | null {
  if (!id) return null;
  return DEMO_USERS.find((u) => u.id === id) ?? null;
}

/** DEMO_MODE 判定 (サーバー / クライアント / Edge どちらでも安全に動く)
 *  - Server Component: DEMO_MODE が見える
 *  - Client Component: NEXT_PUBLIC_DEMO_MODE が見える
 *  - 両方を OR で見ることで、ビルド時の inline と実行時の env 両方をカバー
 *  - trim() で改行・空白の混入に対応 (Vercel CLI add時の `\n` 付与など)
 */
export function isDemoMode(): boolean {
  const a = (process.env.DEMO_MODE ?? "").trim();
  const b = (process.env.NEXT_PUBLIC_DEMO_MODE ?? "").trim();
  return a === "true" || b === "true";
}

/**
 * 権限チェックヘルパー。
 * セッションから取り出した permissions 配列に対して、必要権限が含まれるかを判定。
 */
export function hasPermission(
  permissions: string[] | undefined | null,
  required: DemoPermission,
): boolean {
  if (!permissions) return false;
  return permissions.includes(required);
}
