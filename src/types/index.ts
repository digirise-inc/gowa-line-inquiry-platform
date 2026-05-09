import type { Customer, LineMapping, Message, Ticket, User } from "@prisma/client";
import type { DemoPermission } from "@/lib/demo-users";

export type TicketWithRelations = Ticket & {
  assignee: User | null;
  customer: Customer | null;
  messages: Message[];
};

export type MappingWithCustomer = LineMapping & {
  customer: Customer | null;
  linkedBy: User | null;
};

export type DashboardSummary = {
  open: number;
  inProgress: number;
  done: number;
  lost: number;
  unmappedCount: number;
  aiCoverage: number;
  avgFirstResponseMin: number;
  todayProcessed: number;
  topActions: TicketWithRelations[];
  trend: { day: string; count: number }[];
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      title?: string | null;
      permissions?: DemoPermission[] | string[];
      isDemo?: boolean;
    };
  }
}

// NextAuth v5 では Session interface を直接拡張 + JWT は jwt callback 内で型推論
// （next-auth/jwt または @auth/core/jwt のサブパスエクスポートは存在しないバージョンがあるため declare module はスキップ）
