import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let session;
  try {
    session = await auth();
  } catch {
    session = null;
  }
  if (!session) redirect("/login");

  const user = (session.user as any) ?? {};

  return (
    <AppShell unmappedCount={5}>
      <DashboardClient
        userName={user.name ?? "ユーザー"}
        userTitle={user.title ?? "—"}
        userRole={user.role ?? "staff_office"}
      />
    </AppShell>
  );
}
