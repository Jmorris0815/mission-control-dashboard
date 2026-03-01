import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const VALID_STATUSES = ["success", "fail", "pending", "info"] as const;
type LogStatus = (typeof VALID_STATUSES)[number];

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

/**
 * GET /api/activity-log
 *
 * Two modes:
 *   1. RETRIEVE logs: ?token=...&action=list[&agent=Jarvis&type=exec_command&limit=50]
 *   2. CREATE a log:  ?token=...&agentName=Jarvis&actionType=exec_command&description=...&status=success
 *
 * If `agentName` is present → create mode. Otherwise → list mode.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const token = searchParams.get("token");
  if (token !== API_TOKEN) {
    return jsonResponse(
      { success: false, error: "Unauthorized. Provide ?token=mc-api-2026-krystalklean" },
      401
    );
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  // ── Detect mode ───────────────────────────────────────────────────────────
  const agentName = searchParams.get("agentName")?.trim() || searchParams.get("agent_name")?.trim();
  const actionType = searchParams.get("actionType")?.trim() || searchParams.get("action_type")?.trim() || searchParams.get("type")?.trim();

  // If agentName AND actionType AND description are present → CREATE mode
  const description = searchParams.get("description")?.trim();
  if (agentName && actionType && description) {
    return handleCreate(client, searchParams, agentName, actionType, description);
  }

  // Otherwise → LIST mode
  return handleList(client, searchParams);
}

/**
 * POST /api/activity-log — Create a log entry via JSON body
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Auth via query param or Authorization header
  const token =
    searchParams.get("token") ||
    request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token !== API_TOKEN) {
    return jsonResponse(
      { success: false, error: "Unauthorized" },
      401
    );
  }

  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    const body = await request.json();
    const { agentName, actionType, description, status, metadata, company, duration, sessionId } = body;

    if (!agentName || !actionType || !description) {
      return jsonResponse(
        { success: false, error: "Missing required fields: agentName, actionType, description" },
        400
      );
    }

    const rawStatus = (status || "info").toLowerCase();
    const validStatus: LogStatus = VALID_STATUSES.includes(rawStatus as LogStatus)
      ? (rawStatus as LogStatus)
      : "info";

    const logId = await client.mutation(api.activityLogs.create, {
      agentName,
      actionType,
      description,
      status: validStatus,
      metadata: metadata || undefined,
      company: company || undefined,
      duration: typeof duration === "number" ? duration : undefined,
      sessionId: sessionId || undefined,
    });

    return jsonResponse({
      success: true,
      logId,
      message: `Activity logged for ${agentName}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}

// ── Handlers ────────────────────────────────────────────────────────────────

async function handleCreate(
  client: ConvexHttpClient,
  searchParams: URLSearchParams,
  agentName: string,
  actionType: string,
  description: string
) {
  const rawStatus = (searchParams.get("status") || "info").toLowerCase();
  const status: LogStatus = VALID_STATUSES.includes(rawStatus as LogStatus)
    ? (rawStatus as LogStatus)
    : "info";

  const company = searchParams.get("company") || undefined;
  const durationRaw = searchParams.get("duration");
  const duration = durationRaw && !isNaN(Number(durationRaw)) ? Number(durationRaw) : undefined;
  const sessionId = searchParams.get("sessionId") || searchParams.get("session_id") || undefined;

  // Parse metadata from JSON string if provided
  let metadata: any = undefined;
  const metadataRaw = searchParams.get("metadata");
  if (metadataRaw) {
    try {
      metadata = JSON.parse(metadataRaw);
    } catch {
      metadata = { raw: metadataRaw };
    }
  }

  try {
    const logId = await client.mutation(api.activityLogs.create, {
      agentName,
      actionType,
      description,
      status,
      metadata,
      company,
      duration,
      sessionId,
    });

    return jsonResponse({
      success: true,
      logId,
      message: `Activity logged for ${agentName}`,
      entry: {
        agentName,
        actionType,
        description,
        status,
        company,
        duration,
        timestamp: new Date().toISOString(),
      },
      dashboard: "https://mission-control-dashboard-plum-two.vercel.app/logs",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}

async function handleList(
  client: ConvexHttpClient,
  searchParams: URLSearchParams
) {
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw && !isNaN(Number(limitRaw)) ? Number(limitRaw) : 100;

  const agentFilter = searchParams.get("agent")?.trim();
  const typeFilter = searchParams.get("type")?.trim() || searchParams.get("actionType")?.trim();
  const statusFilter = searchParams.get("status")?.trim();
  const sinceRaw = searchParams.get("since");

  try {
    let logs = await client.query(api.activityLogs.list, { limit: 500 });

    // Apply filters
    if (agentFilter) {
      logs = logs.filter(
        (l) => l.agentName.toLowerCase() === agentFilter.toLowerCase()
      );
    }
    if (typeFilter) {
      logs = logs.filter(
        (l) => l.actionType.toLowerCase() === typeFilter.toLowerCase()
      );
    }
    if (statusFilter) {
      logs = logs.filter(
        (l) => l.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    if (sinceRaw) {
      const sinceTs = new Date(sinceRaw).getTime();
      if (!isNaN(sinceTs)) {
        logs = logs.filter((l) => l.timestamp >= sinceTs);
      }
    }

    logs = logs.slice(0, limit);

    return jsonResponse({
      success: true,
      count: logs.length,
      logs,
      dashboard: "https://mission-control-dashboard-plum-two.vercel.app/logs",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}
