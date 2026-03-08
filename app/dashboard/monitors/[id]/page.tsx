import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMonitorById } from "@/lib/queries";
import { DashboardHeader } from "@/components/dashboard-header";
import { MonitorDetail } from "@/components/monitor-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MonitorDetailPage({ params }: Props) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const monitor = await getMonitorById(id);

  if (!monitor) {
    notFound();
  }

  return (
    <div className="min-h-svh bg-background">
      <DashboardHeader user={session} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <MonitorDetail monitor={monitor} />
      </main>
    </div>
  );
}
