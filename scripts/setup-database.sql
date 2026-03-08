-- Uptime Monitor Database Schema
-- This script creates all tables needed for the uptime monitoring service.

-- Monitors table: stores the endpoints to monitor
CREATE TABLE IF NOT EXISTS monitors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  check_interval_seconds INTEGER NOT NULL DEFAULT 3600,
  timeout_seconds INTEGER NOT NULL DEFAULT 30,
  expected_status_code INTEGER NOT NULL DEFAULT 200,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Check results table: stores individual check results
CREATE TABLE IF NOT EXISTS check_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('up', 'down', 'degraded')),
  status_code INTEGER,
  response_time_ms INTEGER,
  ssl_valid BOOLEAN,
  ssl_expires_at TIMESTAMPTZ,
  ssl_days_remaining INTEGER,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Incidents table: tracks when a monitor goes down and recovers
CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ongoing' CHECK (status IN ('ongoing', 'resolved')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  cause TEXT
);

-- Alert log table: tracks notifications sent
CREATE TABLE IF NOT EXISTS alert_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  incident_id TEXT NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  monitor_id TEXT NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'signal')),
  recipient TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_results_monitor_id ON check_results(monitor_id);
CREATE INDEX IF NOT EXISTS idx_check_results_checked_at ON check_results(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_check_results_monitor_checked ON check_results(monitor_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_monitor_id ON incidents(monitor_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_alert_log_incident_id ON alert_log(incident_id);
