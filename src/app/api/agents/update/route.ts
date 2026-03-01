import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const VALID_STATUSES = ["online", "busy", "idle", "offline", "error"] as const;
type AgentStatus = (typeof VALID_STATUSES)[number];

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (searchParams.get("token") !== API_TOKEN) {
    return jsonResponse(
      { success: false, error: "Unauthorized. Provide ?token=mc-api-2026-krystalklean" },
      401
    );
  }

  // ── Required ──────────────────────────────────────────────────────────────
  const name = searchParams.get("name")?.trim();
  if (!name) {
    return jsonResponse(
      { success: false, error: "Missing required parameter: name" },
      400
    );
  }

  // ── Optional updates ──────────────────────────────────────────────────────
  const rawStatus = searchParams.get("status")?.toLowerCase();
  const status: AgentStatus | undefined =
    rawStatus && VALID_STATUSES.includes(rawStatus as AgentStatus)
      ? (rawStatus as AgentStatus)
      : undefined;

  const tasksCompletedRaw = searchParams.get("tasksCompleted");
  const totalTasksCompleted =
    tasksCompletedRaw !== null && !isNaN(Number(tasksCompletedRaw))
      ? Number(tasksCompletedRaw)
      : undefined;

  const tasksCompletedTodayRaw = searchParams.get("tasksCompletedToday");
  const tasksCompletedToday =
    tasksCompletedTodayRaw !== null && !isNaN(Number(tasksCompletedTodayRaw))
      ? Number(tasksCompletedTodayRaw)
      : undefined;

  const description = searchParams.get("description") ?? undefined;
  const roleTitle = searchParams.get("roleTitle") ?? searchParams.get("title") ?? undefined;
  const currentTaskTitle = searchParams.get("currentTask") ?? undefined;
  const lastAction = searchParams.get("lastAction") ?? undefined;

  const specialtiesRaw = searchParams.get("specialties");
  const capabilities = specialtiesRaw
    ? specialtiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : undefined;

  // Require at least one field to update
  if (
    status === undefined &&
    totalTasksCompleted === undefined &&
    tasksCompletedToday === undefined &&
    description === undefined &&
    roleTitle === undefined &&
    currentTaskTitle === undefined &&
    lastAction === undefined &&
    capabilities === undefined
  ) {
    return jsonResponse(
      {
        success: false,
        error:
          "Provide at least one field to update: status, tasksCompleted, tasksCompletedToday, description, roleTitle, currentTask, lastAction, specialties",
      },
      400
    );
  }

  // ── Convex ────────────────────────────────────────────────────────────────
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    const agentId = await client.mutation(api.agents.updateByName, {
      name,
      ...(status !== undefined && { status }),
      ...(totalTasksCompleted !== undefined && { totalTasksCompleted }),
      ...(tasksCompletedToday !== undefined && { tasksCompletedToday }),
      ...(description !== undefined && { description }),
      ...(roleTitle !== undefined && { roleTitle }),
      ...(currentTaskTitle !== undefined && { currentTaskTitle }),
      ...(lastAction !== undefined && { lastAction }),
      ...(capabilities !== undefined && { capabilities }),
    });

    const changes: Record<string, unknown> = {};
    if (status !== undefined) changes.status = status;
    if (totalTasksCompleted !== undefined) changes.totalTasksCompleted = totalTasksCompleted;
    if (tasksCompletedToday !== undefined) changes.tasksCompletedToday = tasksCompletedToday;
    if (description !== undefined) changes.description = description;
    if (roleTitle !== undefined) changes.roleTitle = roleTitle;
    if (currentTaskTitle !== undefined) changes.currentTaskTitle = currentTaskTitle;
    if (lastAction !== undefined) changes.lastAction = lastAction;
    if (capabilities !== undefined) changes.capabilities = capabilities;

    return jsonResponse({
      success: true,
      agentId,
      message: `Agent "${name}" updated successfully`,
      changes,
      dashboard: "https://mission-control-dashboard-plum-two.vercel.app/agents",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const httpStatus = message.includes("not found") ? 404 : 500;
    return jsonResponse({ success: false, error: message }, httpStatus);
  }
}
