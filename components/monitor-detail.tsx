"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowLeft,
  Globe,
  Clock,
  Shield,
  ExternalLink,
  Trash2,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { UptimeBar } from "@/components/uptime-bar";
import { ResponseTimeChart } from "@/components/response-time-chart";
import { EditMonitorDialog } from "@/components/edit-monitor-dialog";
import type { Monitor, CheckResult, Incident } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function formatInterval(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  return `${Math.round(seconds / 3600)} hour${Math.round(seconds / 3600) > 1 ? "s" : ""}`;
}

interface MonitorDetailProps {
  monitor: Monitor;
}

export function MonitorDetail({ monitor: initialMonitor }: MonitorDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [checking, setChecking] = useState(false);

  const { data: monitor } = useSWR<Monitor>(
    `/api/monitors/${initialMonitor.id}`,
    fetcher,
    { fallbackData: initialMonitor, refreshInterval: 60000 }
  );

  const { data: checks, mutate: mutateChecks } = useSWR<CheckResult[]>(
    `/api/monitors/${initialMonitor.id}/checks?limit=50`,
    fetcher,
    { refreshInterval: 60000 }
  );

  const { data: incidents } = useSWR<Incident[]>(
    `/api/incidents?monitor_id=${initialMonitor.id}&limit=10`,
    fetcher,
    { refreshInterval: 120000 }
  );

  const latestCheck = checks?.[0];
  const currentMonitor = monitor ?? initialMonitor;

  async function handleRunCheck() {
    setChecking(true);
    try {
      await fetch(`/api/monitors/${currentMonitor.id}/check`, { method: "POST" });
      mutateChecks();
    } finally {
      setChecking(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    setDeleting(true);
    await fetch(`/api/monitors/${currentMonitor.id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back link + title */}
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">
              {currentMonitor.name}
            </h1>
            <StatusBadge status={latestCheck?.status ?? "unknown"} />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleRunCheck}
              disabled={checking}
            >
              <Play className="h-3.5 w-3.5" />
              {checking ? "Checking..." : "Run Check"}
            </Button>
            <EditMonitorDialog
              monitor={currentMonitor}
              onSave={() => router.refresh()}
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Monitor info cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">URL</p>
              <a
                href={currentMonitor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 truncate text-sm font-mono text-card-foreground hover:text-primary"
              >
                {currentMonitor.url}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Check Interval</p>
              <p className="text-sm font-medium text-card-foreground">
                {formatInterval(currentMonitor.check_interval_seconds)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">SSL Certificate</p>
              <p className="text-sm font-medium text-card-foreground">
                {latestCheck?.ssl_days_remaining != null
                  ? `${latestCheck.ssl_days_remaining} days remaining`
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="flex items-center gap-3 p-4">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Response Time</p>
              <p className="text-sm font-mono font-medium text-card-foreground">
                {latestCheck?.response_time_ms != null
                  ? `${latestCheck.response_time_ms}ms`
                  : "--"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uptime bar */}
      <Card className="bg-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium text-card-foreground">
            Uptime History (Last 30 checks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UptimeBar monitorId={currentMonitor.id} />
        </CardContent>
      </Card>

      {/* Response time chart */}
      <ResponseTimeChart monitorId={currentMonitor.id} />

      {/* Recent checks */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-card-foreground">
            Recent Checks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!checks || checks.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No checks recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {checks.slice(0, 20).map((check) => (
                <div
                  key={check.id}
                  className="flex items-center gap-4 px-4 py-3 text-sm sm:px-6"
                >
                  <StatusBadge status={check.status} size="sm" />
                  <span className="font-mono text-xs text-muted-foreground">
                    {check.status_code ?? "--"}
                  </span>
                  <span className="font-mono text-xs text-card-foreground">
                    {check.response_time_ms != null
                      ? `${check.response_time_ms}ms`
                      : "--"}
                  </span>
                  {check.error_message && (
                    <span className="truncate text-xs text-destructive">
                      {check.error_message}
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(check.checked_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incidents */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium text-card-foreground">
            Incidents
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!incidents || incidents.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No incidents recorded.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between px-4 py-3 text-sm sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <StatusBadge
                      status={incident.status === "ongoing" ? "down" : "up"}
                      size="sm"
                    />
                    <span className="text-card-foreground">
                      {incident.cause || "No details"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Started:{" "}
                      {new Date(incident.started_at).toLocaleString()}
                    </span>
                    {incident.resolved_at && (
                      <span>
                        Resolved:{" "}
                        {new Date(incident.resolved_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
