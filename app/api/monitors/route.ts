import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMonitors, createMonitor } from "@/lib/queries";
import {
  validateMonitorName,
  validateUrl,
  validateMethod,
  validateCheckInterval,
  validateTimeout,
  validateStatusCode,
} from "@/lib/validation";

/**
 * GET /api/monitors - List all monitors
 * POST /api/monitors - Create a new monitor
 */

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monitors = await getMonitors();
    return NextResponse.json(monitors);
  } catch (error) {
    console.error("Error fetching monitors:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate name
    const nameValidation = validateMonitorName(body.name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { error: nameValidation.error },
        { status: 400 }
      );
    }

    // Validate URL
    const urlValidation = validateUrl(body.url);
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error },
        { status: 400 }
      );
    }

    // Validate method
    const method = body.method || "GET";
    const methodValidation = validateMethod(method);
    if (!methodValidation.valid) {
      return NextResponse.json(
        { error: methodValidation.error },
        { status: 400 }
      );
    }

    // Validate check interval
    const checkInterval = body.check_interval_seconds || 3600;
    const intervalValidation = validateCheckInterval(checkInterval);
    if (!intervalValidation.valid) {
      return NextResponse.json(
        { error: intervalValidation.error },
        { status: 400 }
      );
    }

    // Validate timeout
    const timeout = body.timeout_seconds || 30;
    const timeoutValidation = validateTimeout(timeout);
    if (!timeoutValidation.valid) {
      return NextResponse.json(
        { error: timeoutValidation.error },
        { status: 400 }
      );
    }

    // Validate status code
    const statusCode = body.expected_status_code || 200;
    const statusValidation = validateStatusCode(statusCode);
    if (!statusValidation.valid) {
      return NextResponse.json(
        { error: statusValidation.error },
        { status: 400 }
      );
    }

    const monitor = await createMonitor({
      name: body.name.trim(),
      url: body.url.trim(),
      method: method.toUpperCase(),
      check_interval_seconds: checkInterval,
      timeout_seconds: timeout,
      expected_status_code: statusCode,
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch (error) {
    console.error("Error creating monitor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
