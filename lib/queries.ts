import { getDb } from "./db";
import type {
  Monitor,
  CheckResult,
  Incident,
  MonitorWithStatus,
  DashboardStats,
} from "./types";

/**
 * Database query functions for the uptime monitor.
 * All functions use parameterized queries to prevent SQL injection.
 */

// ---------------------------------------------------------------------------
// Monitors
// ---------------------------------------------------------------------------

export async function getMonitors(): Promise<Monitor[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM monitors ORDER BY created_at DESC`;
  return rows as Monitor[];
}

export async function getMonitorById(id: string): Promise<Monitor | null> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM monitors WHERE id = ${id}`;
  return (rows[0] as Monitor) ?? null;
}

export async function getActiveMonitors(): Promise<Monitor[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM monitors WHERE is_active = true ORDER BY created_at DESC`;
  return rows as Monitor[];
}

export async function createMonitor(data: {
  name: string;
  url: string;
  method: string;
  check_interval_seconds: number;
  timeout_seconds: number;
  expected_status_code: number;
}): Promise<Monitor> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO monitors (name, url, method, check_interval_seconds, timeout_seconds, expected_status_code)
    VALUES (${data.name}, ${data.url}, ${data.method}, ${data.check_interval_seconds}, ${data.timeout_seconds}, ${data.expected_status_code})
    RETURNING *
  `;
  return rows[0] as Monitor;
}

export async function updateMonitor(
  id: string,
  data: {
    name: string;
    url: string;
    method: string;
    check_interval_seconds: number;
    timeout_seconds: number;
    expected_status_code: number;
    is_active: boolean;
  }
): Promise<Monitor> {
  const sql = getDb();
  const rows = await sql`
    UPDATE monitors SET
      name = ${data.name},
      url = ${data.url},
      method = ${data.method},
      check_interval_seconds = ${data.check_interval_seconds},
      timeout_seconds = ${data.timeout_seconds},
      expected_status_code = ${data.expected_status_code},
      is_active = ${data.is_active},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Monitor;
}

export async function deleteMonitor(id: string): Promise<void> {
  const sql = getDb();
  await sql`DELETE FROM monitors WHERE id = ${id}`;
}

// ---------------------------------------------------------------------------
// Check Results
// ---------------------------------------------------------------------------

export async function insertCheckResult(data: {
  monitor_id: string;
  status: "up" | "down" | "degraded";
  status_code: number | null;
  response_time_ms: number | null;
  ssl_valid: boolean | null;
  ssl_expires_at: string | null;
  ssl_days_remaining: number | null;
  error_message: string | null;
}): Promise<CheckResult> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO check_results (monitor_id, status, status_code, response_time_ms, ssl_valid, ssl_expires_at, ssl_days_remaining, error_message)
    VALUES (${data.monitor_id}, ${data.status}, ${data.status_code}, ${data.response_time_ms}, ${data.ssl_valid}, ${data.ssl_expires_at}, ${data.ssl_days_remaining}, ${data.error_message})
    RETURNING *
  `;
  return rows[0] as CheckResult;
}

export async function getCheckResults(
  monitorId: string,
  limit = 100
): Promise<CheckResult[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM check_results
    WHERE monitor_id = ${monitorId}
    ORDER BY checked_at DESC
    LIMIT ${limit}
  `;
  return rows as CheckResult[];
}

export async function getCheckResultsInRange(
  monitorId: string,
  startDate: Date,
  endDate: Date
): Promise<CheckResult[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM check_results
    WHERE monitor_id = ${monitorId}
      AND checked_at >= ${startDate.toISOString()}
      AND checked_at <= ${endDate.toISOString()}
    ORDER BY checked_at ASC
  `;
  return rows as CheckResult[];
}

// ---------------------------------------------------------------------------
// Uptime calculations
// ---------------------------------------------------------------------------

export async function getUptimePercentage(
  monitorId: string,
  hoursAgo: number
): Promise<number | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT
      COUNT(*) FILTER (WHERE status = 'up') as up_count,
      COUNT(*) as total_count
    FROM check_results
    WHERE monitor_id = ${monitorId}
      AND checked_at >= now() - make_interval(hours => ${hoursAgo})
  `;
  const row = rows[0] as { up_count: string; total_count: string };
  const total = parseInt(row.total_count, 10);
  if (total === 0) return null;
  return (parseInt(row.up_count, 10) / total) * 100;
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export async function getActiveIncident(
  monitorId: string
): Promise<Incident | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM incidents
    WHERE monitor_id = ${monitorId} AND status = 'ongoing'
    ORDER BY started_at DESC
    LIMIT 1
  `;
  return (rows[0] as Incident) ?? null;
}

export async function createIncident(data: {
  monitor_id: string;
  cause: string | null;
}): Promise<Incident> {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO incidents (monitor_id, cause)
    VALUES (${data.monitor_id}, ${data.cause})
    RETURNING *
  `;
  return rows[0] as Incident;
}

export async function resolveIncident(id: string): Promise<Incident> {
  const sql = getDb();
  const rows = await sql`
    UPDATE incidents SET status = 'resolved', resolved_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return rows[0] as Incident;
}

export async function getIncidents(
  monitorId?: string,
  limit = 50
): Promise<Incident[]> {
  const sql = getDb();
  if (monitorId) {
    const rows = await sql`
      SELECT * FROM incidents
      WHERE monitor_id = ${monitorId}
      ORDER BY started_at DESC
      LIMIT ${limit}
    `;
    return rows as Incident[];
  }
  const rows = await sql`
    SELECT * FROM incidents
    ORDER BY started_at DESC
    LIMIT ${limit}
  `;
  return rows as Incident[];
}

// ---------------------------------------------------------------------------
// Alert Log
// ---------------------------------------------------------------------------

export async function insertAlertLog(data: {
  incident_id: string;
  monitor_id: string;
  channel: "email" | "sms" | "signal";
  recipient: string;
  success: boolean;
  error_message: string | null;
}): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO alert_log (incident_id, monitor_id, channel, recipient, success, error_message)
    VALUES (${data.incident_id}, ${data.monitor_id}, ${data.channel}, ${data.recipient}, ${data.success}, ${data.error_message})
  `;
}

// ---------------------------------------------------------------------------
// Dashboard aggregates
// ---------------------------------------------------------------------------

export async function getMonitorsWithStatus(): Promise<MonitorWithStatus[]> {
  const sql = getDb();

  // Get all monitors
  const monitors = await sql`SELECT * FROM monitors ORDER BY created_at DESC`;

  if (monitors.length === 0) return [];

  // Batch-fetch latest checks for all monitors in one query
  const latestChecks = await sql`
    SELECT DISTINCT ON (monitor_id) *
    FROM check_results
    ORDER BY monitor_id, checked_at DESC
  `;
  const latestCheckMap = new Map(
    (latestChecks as CheckResult[]).map((c) => [c.monitor_id, c])
  );

  // Batch-fetch uptime percentages in one query per period
  const uptimeRows = await sql`
    SELECT
      monitor_id,
      COUNT(*) FILTER (WHERE status = 'up') as up_count,
      COUNT(*) as total_count,
      COUNT(*) FILTER (WHERE status = 'up' AND checked_at >= now() - interval '24 hours') as up_24h,
      COUNT(*) FILTER (WHERE checked_at >= now() - interval '24 hours') as total_24h,
      COUNT(*) FILTER (WHERE status = 'up' AND checked_at >= now() - interval '7 days') as up_7d,
      COUNT(*) FILTER (WHERE checked_at >= now() - interval '7 days') as total_7d
    FROM check_results
    WHERE checked_at >= now() - interval '30 days'
    GROUP BY monitor_id
  `;
  const uptimeMap = new Map<string, { h24: number | null; d7: number | null; d30: number | null }>();
  for (const row of uptimeRows) {
    const r = row as Record<string, string>;
    const total24 = parseInt(r.total_24h, 10);
    const total7d = parseInt(r.total_7d, 10);
    const total30d = parseInt(r.total_count, 10);
    uptimeMap.set(r.monitor_id, {
      h24: total24 > 0 ? (parseInt(r.up_24h, 10) / total24) * 100 : null,
      d7: total7d > 0 ? (parseInt(r.up_7d, 10) / total7d) * 100 : null,
      d30: total30d > 0 ? (parseInt(r.up_count, 10) / total30d) * 100 : null,
    });
  }

  // Batch-fetch active incidents
  const activeIncidents = await sql`
    SELECT * FROM incidents WHERE status = 'ongoing'
  `;
  const incidentMap = new Map(
    (activeIncidents as Incident[]).map((i) => [i.monitor_id, i])
  );

  return monitors.map((monitor) => {
    const id = monitor.id as string;
    const uptime = uptimeMap.get(id);
    return {
      ...(monitor as Monitor),
      latest_check: latestCheckMap.get(id) ?? null,
      uptime_24h: uptime?.h24 ?? null,
      uptime_7d: uptime?.d7 ?? null,
      uptime_30d: uptime?.d30 ?? null,
      active_incident: incidentMap.get(id) ?? null,
    };
  });
}

/**
 * Derive dashboard stats from already-fetched monitors to avoid duplicate queries.
 */
export function computeDashboardStats(monitors: MonitorWithStatus[]): DashboardStats {
  let up = 0;
  let down = 0;
  let degraded = 0;
  let uptimeSum = 0;
  let uptimeCount = 0;
  let activeIncidents = 0;

  for (const m of monitors) {
    if (m.latest_check) {
      if (m.latest_check.status === "up") up++;
      else if (m.latest_check.status === "down") down++;
      else degraded++;
    }
    if (m.uptime_24h !== null) {
      uptimeSum += m.uptime_24h;
      uptimeCount++;
    }
    if (m.active_incident) activeIncidents++;
  }

  return {
    total_monitors: monitors.length,
    monitors_up: up,
    monitors_down: down,
    monitors_degraded: degraded,
    overall_uptime_24h: uptimeCount > 0 ? uptimeSum / uptimeCount : 100,
    active_incidents: activeIncidents,
  };
}
