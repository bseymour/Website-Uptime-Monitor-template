import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getMonitorById, updateMonitor, deleteMonitor } from "@/lib/queries";
import {
  validateMonitorName,
  validateUrl,
  validateMethod,
  validateCheckInterval,
  validateTimeout,
  validateStatusCode,
} from "@/lib/validation";

/**
 * GET /api/monitors/:id - Get a single monitor
 * PUT /api/monitors/:id - Update a monitor
 * DELETE /api/monitors/:id - Delete a monitor
 */

export async function GET(
  _request: Request,
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

    return NextResponse.json(monitor);
  } catch (error) {
    console.error("Error fetching monitor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getMonitorById(id);
    if (!existing) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
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
    const method = body.method || existing.method;
    const methodValidation = validateMethod(method);
    if (!methodValidation.valid) {
      return NextResponse.json(
        { error: methodValidation.error },
        { status: 400 }
      );
    }

    // Validate check interval
    const checkInterval = body.check_interval_seconds ?? existing.check_interval_seconds;
    const intervalValidation = validateCheckInterval(checkInterval);
    if (!intervalValidation.valid) {
      return NextResponse.json(
        { error: intervalValidation.error },
        { status: 400 }
      );
    }

    // Validate timeout
    const timeout = body.timeout_seconds ?? existing.timeout_seconds;
    const timeoutValidation = validateTimeout(timeout);
    if (!timeoutValidation.valid) {
      return NextResponse.json(
        { error: timeoutValidation.error },
        { status: 400 }
      );
    }

    // Validate status code
    const statusCode = body.expected_status_code ?? existing.expected_status_code;
    const statusValidation = validateStatusCode(statusCode);
    if (!statusValidation.valid) {
      return NextResponse.json(
        { error: statusValidation.error },
        { status: 400 }
      );
    }

    const updated = await updateMonitor(id, {
      name: body.name.trim(),
      url: body.url.trim(),
      method: method.toUpperCase(),
      check_interval_seconds: checkInterval,
      timeout_seconds: timeout,
      expected_status_code: statusCode,
      is_active: body.is_active ?? existing.is_active,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating monitor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const existing = await getMonitorById(id);
    if (!existing) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    await deleteMonitor(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting monitor:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
