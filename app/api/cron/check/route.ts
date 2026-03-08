import { NextResponse } from "next/server";
import {
  getActiveMonitors,
  insertCheckResult,
  getActiveIncident,
  createIncident,
  resolveIncident,
} from "@/lib/queries";
import { performCheck } from "@/lib/checker";
import { sendDownAlert, sendRecoveryAlert } from "@/lib/alerts";
import { getDb } from "@/lib/db";

/**
 * Cron endpoint: POST /api/cron/check
 *
 * Called by Vercel Cron on a regular schedule (e.g. every minute).
 * It checks which monitors are due for a check based on their interval,
 * runs the health check, stores results, and manages incidents/alerts.
 *
 * Security: Vercel sets the Authorization header with the CRON_SECRET.
 */
export async function GET(request: Request) {
  // Verify the cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const monitors = await getActiveMonitors();

  if (monitors.length === 0) {
    return NextResponse.json({ message: "No active monitors", checked: 0 });
  }

  const sql = getDb();
  const results: Array<{
    monitor_id: string;
    name: string;
    status: string;
  }> = [];

  for (const monitor of monitors) {
    // Check if this monitor is due for a check
    const lastCheckRows = await sql`
      SELECT checked_at FROM check_results
      WHERE monitor_id = ${monitor.id}
      ORDER BY checked_at DESC
      LIMIT 1
    `;

    if (lastCheckRows.length > 0) {
      const lastCheckedAt = new Date(
        lastCheckRows[0].checked_at as string
      );
      const secondsSinceLastCheck =
        (Date.now() - lastCheckedAt.getTime()) / 1000;

      // Skip if not yet due (with 10s buffer for cron timing)
      if (secondsSinceLastCheck < monitor.check_interval_seconds - 10) {
        continue;
      }
    }

    // Perform the health check
    const checkResult = await performCheck(monitor);

    // Store the result
    await insertCheckResult({
      monitor_id: monitor.id,
      status: checkResult.status,
      status_code: checkResult.status_code,
      response_time_ms: checkResult.response_time_ms,
      ssl_valid: checkResult.ssl_valid,
      ssl_expires_at: checkResult.ssl_expires_at,
      ssl_days_remaining: checkResult.ssl_days_remaining,
      error_message: checkResult.error_message,
    });

    // Handle incident management
    const activeIncident = await getActiveIncident(monitor.id);

    if (checkResult.status === "down") {
      if (!activeIncident) {
        // New incident - create and send alert
        const incident = await createIncident({
          monitor_id: monitor.id,
          cause: checkResult.error_message,
        });

        // Send down alert (fire and forget - don't block cron)
        sendDownAlert(monitor, incident, checkResult).catch(console.error);
      }
    } else if (checkResult.status === "up" && activeIncident) {
      // Monitor recovered - resolve incident
      await resolveIncident(activeIncident.id);

      // Send recovery alert
      sendRecoveryAlert(monitor, activeIncident).catch(console.error);
    }

    results.push({
      monitor_id: monitor.id,
      name: monitor.name,
      status: checkResult.status,
    });
  }

  // ---------------------------------------------------------------------------
  // Data retention: prune old records to stay within Neon free tier storage
  // ---------------------------------------------------------------------------
  let pruned = 0;
  try {
    // Delete check results older than 30 days
    const deleted = await sql`
      DELETE FROM check_results
      WHERE checked_at < now() - interval '30 days'
      RETURNING id
    `;
    pruned = deleted.length;

    // Delete resolved incidents older than 90 days
    await sql`
      DELETE FROM incidents
      WHERE status = 'resolved'
        AND resolved_at < now() - interval '90 days'
    `;
  } catch (err) {
    console.error("Error pruning old data:", err);
  }

  return NextResponse.json({
    message: `Checked ${results.length} monitor(s), pruned ${pruned} old records`,
    checked: results.length,
    pruned,
    results,
  });
}
