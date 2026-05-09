/**
 * サーバーサイドクエリ集約
 *
 * - DB アクセスはここに集約 (page.tsx には書かない)
 * - 型は型推論で自然に取れる
 */

import { db } from "./prisma";

export async function getDashboardSummary() {
  const [tickets, mappings] = await Promise.all([
    db.ticket.findMany({
      include: { assignee: true, customer: true },
      orderBy: { createdAt: "desc" },
    }),
    db.lineMapping.findMany(),
  ]);

  const open = tickets.filter((t) => ["open", "escalated"].includes(t.status)).length;
  const inProgress = tickets.filter((t) =>
    ["triaging", "internal_check", "supplier_quote", "awaiting_reply"].includes(t.status),
  ).length;
  const done = tickets.filter((t) => ["answered", "closed_won"].includes(t.status)).length;
  const lost = tickets.filter((t) => t.status === "closed_lost").length;
  const unmapped = mappings.filter((m) => m.status !== "linked").length;

  // AI捕捉率 = AI分類済 / 全件 (簡易)
  const withAI = tickets.filter((t) => t.aiCategories).length;
  const aiCoverage = tickets.length === 0 ? 0 : Math.round((withAI / tickets.length) * 100);

  // 平均一次応答時間 (分)
  const responded = tickets.filter((t) => t.firstResponseAt);
  const totalMin = responded.reduce(
    (sum, t) => sum + (t.firstResponseAt!.getTime() - t.createdAt.getTime()) / 60_000,
    0,
  );
  const avgFirstResponseMin = responded.length === 0 ? 0 : Math.round(totalMin / responded.length);

  // 本日処理件数
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayProcessed = tickets.filter(
    (t) => (t.answeredAt ?? t.closedAt ?? new Date(0)) >= todayStart,
  ).length;

  // トップアクション: 緊急 or 高 で open / escalated
  const topActions = tickets
    .filter((t) => ["open", "escalated"].includes(t.status))
    .sort((a, b) => {
      const pri = { urgent: 4, high: 3, normal: 2, low: 1 };
      const da = (pri as any)[a.priority] ?? 0;
      const dbb = (pri as any)[b.priority] ?? 0;
      if (da !== dbb) return dbb - da;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, 3);

  // 7日間トレンド (新規受信件数)
  const trend: { day: string; count: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(d.getDate() + 1);
    const cnt = tickets.filter((t) => t.createdAt >= d && t.createdAt < next).length;
    trend.push({ day: `${d.getMonth() + 1}/${d.getDate()}`, count: cnt });
  }

  return {
    open,
    inProgress,
    done,
    lost,
    unmappedCount: unmapped,
    aiCoverage,
    avgFirstResponseMin,
    todayProcessed,
    topActions,
    trend,
    totalTickets: tickets.length,
  };
}

export async function getTicketsList(opts?: {
  status?: string;
  assigneeId?: string;
  channel?: string;
  category?: string;
  isUnmapped?: boolean;
}) {
  const where: any = {};
  if (opts?.status && opts.status !== "all") where.status = opts.status;
  if (opts?.assigneeId && opts.assigneeId !== "all") where.assigneeId = opts.assigneeId;
  if (opts?.channel && opts.channel !== "all") where.channel = opts.channel;
  if (opts?.category && opts.category !== "all") where.category = opts.category;
  if (opts?.isUnmapped) where.isUnmapped = true;

  return db.ticket.findMany({
    where,
    include: {
      assignee: true,
      customer: true,
      messages: { orderBy: { sentAt: "asc" } },
    },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
  });
}

export async function getTicketById(id: string) {
  return db.ticket.findFirst({
    where: { OR: [{ id }, { publicId: id }] },
    include: {
      assignee: true,
      customer: true,
      messages: { orderBy: { sentAt: "asc" }, include: { sender: true } },
    },
  });
}

export async function getUsers() {
  return db.user.findMany({ orderBy: { name: "asc" } });
}

export async function getMappings() {
  return db.lineMapping.findMany({
    include: { customer: true, linkedBy: true },
    orderBy: [{ status: "asc" }, { lastSeenAt: "desc" }],
  });
}

export async function getCustomers() {
  return db.customer.findMany({ orderBy: { code: "asc" } });
}

export async function getUnmappedCount() {
  return db.lineMapping.count({ where: { status: { not: "linked" } } });
}

export async function getGchatSpaces() {
  return db.gchatSpace.findMany({
    include: {
      threads: { include: { messages: { orderBy: { createdAt: "asc" } } }, orderBy: { updatedAt: "desc" } },
    },
  });
}
