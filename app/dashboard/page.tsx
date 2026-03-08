import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardView } from "@/components/dashboard-view";

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader user={session} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <DashboardView />
      </main>
    </div>
  );
}
