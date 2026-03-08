import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getCheckResults, getMonitorById } from "@/lib/queries";

/**
 * GET /api/monitors/:id/checks - Get check results for a monitor
 * Supports ?limit=N query parameter (default 100)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const monitor = await getMonitorById(id);
    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);
    const checks = await getCheckResults(id, Math.min(limit, 500));

    return NextResponse.json(checks);
  } catch (error) {
    console.error("Error fetching check results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
