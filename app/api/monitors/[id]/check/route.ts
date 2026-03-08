import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMonitorById, insertCheckResult, getActiveIncident, createIncident, resolveIncident } from "@/lib/queries";
import { performCheck } from "@/lib/checker";
import { sendDownAlert, sendRecoveryAlert } from "@/lib/alerts";

/**
 * POST /api/monitors/:id/check - Manually trigger a check for a monitor
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const monitor = await getMonitorById(id);
  if (!monitor) {
    return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
  }

  // Perform the check
  const checkResult = await performCheck(monitor);

  // Store the result
  const stored = await insertCheckResult({
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

  if (checkResult.status === "down" && !activeIncident) {
    const incident = await createIncident({
      monitor_id: monitor.id,
      cause: checkResult.error_message,
    });
    sendDownAlert(monitor, incident, checkResult).catch(console.error);
  } else if (checkResult.status === "up" && activeIncident) {
    await resolveIncident(activeIncident.id);
    sendRecoveryAlert(monitor, activeIncident).catch(console.error);
  }

  return NextResponse.json(stored);
}
