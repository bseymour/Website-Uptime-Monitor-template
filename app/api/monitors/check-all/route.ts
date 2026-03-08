import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getActiveMonitors, insertCheckResult, getActiveIncident, createIncident, resolveIncident } from "@/lib/queries";
import { performCheck } from "@/lib/checker";
import { sendDownAlert, sendRecoveryAlert } from "@/lib/alerts";

/**
 * POST /api/monitors/check-all
 *
 * Manually triggers a health check for every active monitor.
 * Unlike the cron endpoint, this skips the interval check and
 * runs all monitors immediately. Requires session auth.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monitors = await getActiveMonitors();

    if (monitors.length === 0) {
      return NextResponse.json({ message: "No active monitors", checked: 0 });
    }

    const results: Array<{
      monitor_id: string;
      name: string;
      status: string;
      response_time_ms: number | null;
    }> = [];

    // Run all checks in parallel for speed
    await Promise.all(
      monitors.map(async (monitor) => {
        try {
          const checkResult = await performCheck(monitor);

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
              const incident = await createIncident({
                monitor_id: monitor.id,
                cause: checkResult.error_message,
              });
              sendDownAlert(monitor, incident, checkResult).catch(console.error);
            }
          } else if (checkResult.status === "up" && activeIncident) {
            await resolveIncident(activeIncident.id);
            sendRecoveryAlert(monitor, activeIncident).catch(console.error);
          }

          results.push({
            monitor_id: monitor.id,
            name: monitor.name,
            status: checkResult.status,
            response_time_ms: checkResult.response_time_ms,
          });
        } catch (error) {
          console.error(`Error checking monitor ${monitor.id}:`, error);
          // Continue with other monitors even if one fails
        }
      }),
    );

    return NextResponse.json({
      message: `Checked ${results.length} monitor(s)`,
      checked: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in check-all endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
