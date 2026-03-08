import {
  Activity,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashboardStats } from "@/lib/types";

interface StatCardsProps {
  stats: DashboardStats;
}

export function StatCards({ stats }: StatCardsProps) {
  const cards = [
    {
      label: "Total Monitors",
      value: stats.total_monitors,
      icon: Activity,
      iconClass: "text-primary bg-primary/10",
    },
    {
      label: "Monitors Up",
      value: stats.monitors_up,
      icon: ArrowUp,
      iconClass: "text-success bg-success/10",
    },
    {
      label: "Monitors Down",
      value: stats.monitors_down,
      icon: ArrowDown,
      iconClass: "text-destructive bg-destructive/10",
    },
    {
      label: "Overall Uptime (24h)",
      value: `${stats.overall_uptime_24h.toFixed(1)}%`,
      icon: Shield,
      iconClass: "text-primary bg-primary/10",
    },
    {
      label: "Active Incidents",
      value: stats.active_incidents,
      icon: AlertTriangle,
      iconClass:
        stats.active_incidents > 0
          ? "text-destructive bg-destructive/10"
          : "text-muted-foreground bg-muted",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.label} className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconClass}`}
            >
              <card.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs text-muted-foreground">
                {card.label}
              </p>
              <p className="text-lg font-semibold text-card-foreground">
                {card.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
