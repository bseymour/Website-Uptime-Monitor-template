import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getIncidents } from "@/lib/queries";

/**
 * GET /api/incidents - List recent incidents
 * Supports ?monitor_id=X and ?limit=N query parameters
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const monitorId = url.searchParams.get("monitor_id") ?? undefined;
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);

  const incidents = await getIncidents(monitorId, Math.min(limit, 200));
  return NextResponse.json(incidents);
}
