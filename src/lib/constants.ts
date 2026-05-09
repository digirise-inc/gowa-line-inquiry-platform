/**
 * チケット型コア定数
 *
 * SPEC v0.3 §5 (8段階ステータスFSM) 準拠
 */

export type TicketStatus =
  | "open"
  | "triaging"
  | "internal_check"
  | "supplier_quote"
  | "awaiting_reply"
  | "answered"
  | "closed_won"
  | "closed_lost"
  | "escalated";

export const TICKET_STATUSES: { value: TicketStatus; label: string; short: string; color: string; bg: string; ring: string }[] = [
  { value: "open", label: "未対応", short: "Open", color: "text-akane-700 dark:text-akane-300", bg: "bg-akane-50 dark:bg-akane-950/40", ring: "ring-akane-200 dark:ring-akane-800" },
  { value: "triaging", label: "一次対応中", short: "Triaging", color: "text-ai-700 dark:text-ai-300", bg: "bg-ai-50 dark:bg-ai-950/40", ring: "ring-ai-200 dark:ring-ai-800" },
  { value: "internal_check", label: "社内確認中", short: "Internal", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", ring: "ring-amber-200 dark:ring-amber-800" },
  { value: "supplier_quote", label: "仕入先見積中", short: "Quoting", color: "text-purple-700 dark:text-purple-300", bg: "bg-purple-50 dark:bg-purple-950/40", ring: "ring-purple-200 dark:ring-purple-800" },
  { value: "awaiting_reply", label: "回答待ち", short: "Awaiting", color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-950/40", ring: "ring-cyan-200 dark:ring-cyan-800" },
  { value: "answered", label: "回答完了", short: "Answered", color: "text-wakaba-700 dark:text-wakaba-300", bg: "bg-wakaba-50 dark:bg-wakaba-950/40", ring: "ring-wakaba-200 dark:ring-wakaba-800" },
  { value: "closed_won", label: "案件完了", short: "Won", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", ring: "ring-emerald-200 dark:ring-emerald-800" },
  { value: "closed_lost", label: "失注", short: "Lost", color: "text-sumi-700 dark:text-sumi-300", bg: "bg-sumi-50 dark:bg-sumi-900/40", ring: "ring-sumi-300 dark:ring-sumi-700" },
];

export const KANBAN_COLUMNS: TicketStatus[] = [
  "open",
  "triaging",
  "internal_check",
  "supplier_quote",
  "awaiting_reply",
  "answered",
  "closed_won",
  "closed_lost",
];

export const STATUS_BY_VALUE: Record<TicketStatus, (typeof TICKET_STATUSES)[number]> = TICKET_STATUSES.reduce(
  (acc, s) => {
    acc[s.value] = s;
    return acc;
  },
  {} as Record<TicketStatus, (typeof TICKET_STATUSES)[number]>,
);

export const CHANNELS = [
  { value: "official_line", label: "LINE", icon: "L", color: "text-[#06C755]", bg: "bg-[#06C755]/10" },
  { value: "email", label: "メール", icon: "@", color: "text-blue-700", bg: "bg-blue-100" },
  { value: "phone", label: "電話", icon: "T", color: "text-purple-700", bg: "bg-purple-100" },
  { value: "manual", label: "手動", icon: "M", color: "text-slate-700", bg: "bg-slate-100" },
  { value: "gchat", label: "Chat", icon: "G", color: "text-orange-700", bg: "bg-orange-100" },
];

export const CATEGORIES = [
  { value: "inquiry", label: "問合せ" },
  { value: "order", label: "注文" },
  { value: "delivery", label: "配送" },
  { value: "billing", label: "請求" },
  { value: "claim", label: "クレーム" },
  { value: "other", label: "その他" },
];

export const PRIORITIES = [
  { value: "urgent", label: "緊急", color: "bg-akane-600 text-white" },
  { value: "high", label: "高", color: "bg-akane-100 text-akane-800 dark:bg-akane-950/60 dark:text-akane-200" },
  { value: "normal", label: "通常", color: "bg-sumi-100 text-sumi-700 dark:bg-sumi-800 dark:text-sumi-200" },
  { value: "low", label: "低", color: "bg-sumi-50 text-sumi-500 dark:bg-sumi-900 dark:text-sumi-400" },
];

export const LOST_REASONS = [
  { value: "out_of_stock", label: "在庫切れ" },
  { value: "timing", label: "タイミング" },
  { value: "price", label: "価格" },
  { value: "competitor", label: "他社購入" },
  { value: "other", label: "その他" },
];

export const ASK_TEMPLATES: Record<string, { label: string; body: string }> = {
  ASK_QUANTITY_DATE: {
    label: "数量・必要日を聞く",
    body: "お世話になっております。\nご希望の本数と必要日を教えていただけますでしょうか？",
  },
  ASK_URGENCY: {
    label: "急ぎ確認",
    body: "ご連絡ありがとうございます。\nお急ぎでしょうか？納期目安をお聞かせいただけますと幸いです。",
  },
  ASK_BUDGET: {
    label: "予算感を聞く",
    body: "ご相談ありがとうございます。\nご予算感を教えていただけますか？最適なご提案ができればと思います。",
  },
};

export const MAPPING_STATUS = [
  { value: "linked", label: "紐付け済", color: "bg-wakaba-100 text-wakaba-800 dark:bg-wakaba-900/40 dark:text-wakaba-200" },
  { value: "unverified", label: "未紐付け", color: "bg-akane-100 text-akane-800 dark:bg-akane-950/40 dark:text-akane-200" },
  { value: "multiple_candidates", label: "複数候補", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200" },
  { value: "failed", label: "該当なし", color: "bg-sumi-200 text-sumi-700 dark:bg-sumi-800 dark:text-sumi-300" },
];

// ─────────────────────────────────────────────
// ロール / 招待関連
// ─────────────────────────────────────────────
/** 招待時に付与可能な Prisma 側ロール allowlist */
export const INVITATION_ROLES = [
  "manager",
  "staff_office",
  "staff_field",
  "finance",
  "driver",
] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];

export const INVITATION_ROLE_LABEL: Record<InvitationRole, string> = {
  manager: "マネージャー / 管理者",
  staff_office: "管理部・事務員",
  staff_field: "現場スタッフ",
  driver: "配送ドライバー",
  finance: "経理 / 横断管理",
};

/** 管理者(招待・ユーザー編集 権限) と判定するロール (Prismaロール / デモロール混在) */
export const MANAGER_ROLES = ["manager", "kowa"] as const;

/** /admin/* にアクセス可能なロール (manager に加え finance を含む) */
export const ADMIN_AREA_ROLES = ["manager", "kowa", "finance"] as const;

export const INVITATION_STATUSES = ["pending", "accepted", "expired", "revoked"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

/** 招待ロールに対するデフォルト権限セット */
export function defaultPermissionsForRole(role: InvitationRole): string[] {
  switch (role) {
    case "manager":
      return ["admin", "manager", "view_all"];
    case "finance":
      return ["view_all", "kpi"];
    case "staff_office":
      return ["view_assigned", "create_ticket", "mapping"];
    case "staff_field":
      return ["view_self", "mobile"];
    case "driver":
      return ["view_self", "mobile"];
    default:
      return ["view_self"];
  }
}
