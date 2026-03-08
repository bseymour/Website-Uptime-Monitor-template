"use client";

import useSWR from "swr";
import type { CheckResult } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface UptimeBarProps {
  monitorId: string;
}

/**
 * A visual bar showing the last 30 check results as colored segments.
 * Green = up, Red = down, Yellow = degraded, Gray = no data.
 */
export function UptimeBar({ monitorId }: UptimeBarProps) {
  const { data: checks } = useSWR<CheckResult[]>(
    `/api/monitors/${monitorId}/checks?limit=30`,
    fetcher,
    { refreshInterval: 120000 }
  );

  const segments = 30;
  const results = checks ? [...checks].reverse() : [];

  return (
    <div className="flex items-center gap-0.5" aria-label="Uptime history">
      {Array.from({ length: segments }).map((_, i) => {
        const check = results[i];
        let colorClass = "bg-muted";
        if (check) {
          if (check.status === "up") colorClass = "bg-success";
          else if (check.status === "down") colorClass = "bg-destructive";
          else if (check.status === "degraded") colorClass = "bg-warning";
        }
        return (
          <div
            key={`${monitorId}-${i}`}
            className={`h-6 flex-1 rounded-sm ${colorClass}`}
            title={
              check
                ? `${check.status} - ${new Date(check.checked_at).toLocaleString()}`
                : "No data"
            }
          />
        );
      })}
    </div>
  );
}
