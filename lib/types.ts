/**
 * Core types for the Uptime Monitor application.
 */

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: string;
  check_interval_seconds: number;
  timeout_seconds: number;
  expected_status_code: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CheckResult {
  id: string;
  monitor_id: string;
  status: "up" | "down" | "degraded";
  status_code: number | null;
  response_time_ms: number | null;
  ssl_valid: boolean | null;
  ssl_expires_at: string | null;
  ssl_days_remaining: number | null;
  error_message: string | null;
  checked_at: string;
}

export interface Incident {
  id: string;
  monitor_id: string;
  status: "ongoing" | "resolved";
  started_at: string;
  resolved_at: string | null;
  cause: string | null;
}

export interface AlertLogEntry {
  id: string;
  incident_id: string;
  monitor_id: string;
  channel: "email" | "sms" | "signal";
  recipient: string;
  sent_at: string;
  success: boolean;
  error_message: string | null;
}

/** Monitor with its latest check result and uptime stats */
export interface MonitorWithStatus extends Monitor {
  latest_check: CheckResult | null;
  uptime_24h: number | null;
  uptime_7d: number | null;
  uptime_30d: number | null;
  active_incident: Incident | null;
}

/** Dashboard summary statistics */
export interface DashboardStats {
  total_monitors: number;
  monitors_up: number;
  monitors_down: number;
  monitors_degraded: number;
  overall_uptime_24h: number;
  active_incidents: number;
}

/** Form data for creating/updating a monitor */
export interface MonitorFormData {
  name: string;
  url: string;
  method: string;
  check_interval_seconds: number;
  timeout_seconds: number;
  expected_status_code: number;
  is_active: boolean;
}

/** Authenticated user session */
export interface UserSession {
  email: string;
  name: string;
  avatar_url: string | null;
}
