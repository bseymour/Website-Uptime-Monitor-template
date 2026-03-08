"use client";

import useSWR from "swr";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CheckResult } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ResponseTimeChartProps {
  monitorId: string;
}

export function ResponseTimeChart({ monitorId }: ResponseTimeChartProps) {
  const { data: checks } = useSWR<CheckResult[]>(
    `/api/monitors/${monitorId}/checks?limit=200`,
    fetcher,
    { refreshInterval: 120000 }
  );

  const chartData = checks
    ? [...checks]
      .reverse()
      .map((check) => ({
        time: new Date(check.checked_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        responseTime: check.response_time_ms ?? 0,
        status: check.status,
      }))
    : [];

  return (
    <Card className="bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-card-foreground">
          Response Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No check data yet. Data will appear after the first check.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="responseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(220, 14%, 18%)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(220, 10%, 55%)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}ms`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(224, 18%, 10%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(210, 20%, 95%)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}ms`, "Response Time"]}
              />
              <Area
                type="monotone"
                dataKey="responseTime"
                stroke="hsl(160, 84%, 39%)"
                fill="url(#responseGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
