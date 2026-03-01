import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const VALID_PRIORITIES = ["critical", "high", "medium", "low"] as const;
const VALID_TYPES = ["idea", "task", "project", "bug"] as const;
const VALID_SOURCES = ["discord", "api", "manual", "zapier", "n8n", "jarvis"] as const;

type Priority = (typeof VALID_PRIORITIES)[number];
type TaskType = (typeof VALID_TYPES)[number];

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ── Auth ─────────────────────────────────────────────────────────────────
  const token = searchParams.get("token");
  if (!token || token !== API_TOKEN) {
    return jsonResponse(
      {
        success: false,
        error: "Unauthorized. Provide a valid token parameter.",
        hint: "Add ?token=mc-api-2026-krystalklean to your request",
      },
      401
    );
  }

  // ── Required fields ───────────────────────────────────────────────────────
  const title = searchParams.get("title")?.trim();
  if (!title) {
    return jsonResponse(
      {
        success: false,
        error: "Missing required parameter: title",
        hint: "Add ?title=Your+Task+Title to your request",
      },
      400
    );
  }

  // ── Optional fields with defaults ─────────────────────────────────────────
  const rawPriority = (searchParams.get("priority") || "medium").toLowerCase();
  const priority: Priority = VALID_PRIORITIES.includes(rawPriority as Priority)
    ? (rawPriority as Priority)
    : "medium";

  const rawType = (searchParams.get("type") || "idea").toLowerCase();
  const taskType: TaskType = VALID_TYPES.includes(rawType as TaskType)
    ? (rawType as TaskType)
    : "idea";

  const rawSource = (searchParams.get("source") || "discord").toLowerCase();
  const source = VALID_SOURCES.includes(rawSource as (typeof VALID_SOURCES)[number])
    ? rawSource
    : "discord";

  const companyName = searchParams.get("company") || "Krystal Klean Exterior";
  const description =
    searchParams.get("description") ||
    `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} submitted via ${source}`;

  // ── Convex client ─────────────────────────────────────────────────────────
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Look up all companies to find the matching one
    const allCompanies = await client.query(api.companies.list);

    let companyId = allCompanies[0]?._id; // Default to first company
    const matchedCompany = allCompanies.find(
      (c) =>
        c.name.toLowerCase() === companyName.toLowerCase() ||
        c.name.toLowerCase().includes(companyName.toLowerCase())
    );

    if (matchedCompany) {
      companyId = matchedCompany._id;
    } else if (!companyId) {
      return jsonResponse(
        {
          success: false,
          error: `Company "${companyName}" not found`,
          availableCompanies: allCompanies.map((c) => c.name),
        },
        404
      );
    }

    // Build tags
    const tags: string[] = [taskType, `source:${source}`];

    // Create the task via the existing Convex mutation
    const taskId = await client.mutation(api.tasks.create, {
      title,
      description,
      status: "inbox",
      priority,
      companyId,
      tags,
    });

    // Log an activity entry for the external submission
    await client.mutation(api.activities.create, {
      type: "task_created",
      companyId,
      taskId,
      message: `New ${taskType} from ${source}: "${title}"`,
      metadata: { source, type: taskType, external: true, via: "webhook-get" },
    });

    const company = matchedCompany || allCompanies[0];

    return jsonResponse({
      success: true,
      taskId,
      message: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} "${title}" created in inbox`,
      task: {
        id: taskId,
        title,
        description,
        status: "inbox",
        priority,
        type: taskType,
        source,
        company: company?.name || companyName,
        tags,
        createdAt: new Date().toISOString(),
      },
      dashboard: "https://mission-control-dashboard-plum-two.vercel.app/kanban",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Convex error:", message);
    return jsonResponse(
      {
        success: false,
        error: "Failed to create task in Convex",
        details: message,
      },
      500
    );
  }
}
