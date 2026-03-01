import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const VALID_PRIORITIES = ["critical", "high", "medium", "low"] as const;
type Priority = (typeof VALID_PRIORITIES)[number];

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
 * GET /api/dispatch — Dispatch a task to an agent via query params (Jarvis web_fetch compatible)
 *
 * Params:
 *   token (required): API auth token
 *   title (required): Task title
 *   agent (required): Agent name (case-insensitive)
 *   company (optional, default: "Krystal Klean Exterior"): Company name
 *   priority (optional, default: "medium"): critical, high, medium, low
 *   description (optional): Task description
 *   tags (optional): Comma-separated tags
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const token = searchParams.get("token");
  if (token !== API_TOKEN) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const title = searchParams.get("title")?.trim();
  const agentName = searchParams.get("agent")?.trim();

  if (!title) {
    return jsonResponse({ success: false, error: "Missing required param: title" }, 400);
  }
  if (!agentName) {
    return jsonResponse({ success: false, error: "Missing required param: agent" }, 400);
  }

  const companyName = searchParams.get("company")?.trim() || "Krystal Klean Exterior";
  const rawPriority = (searchParams.get("priority") || "medium").toLowerCase();
  const priority: Priority = VALID_PRIORITIES.includes(rawPriority as Priority)
    ? (rawPriority as Priority)
    : "medium";
  const description = searchParams.get("description")?.trim() || `Dispatched to ${agentName}: ${title}`;
  const tagsRaw = searchParams.get("tags");
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : ["dispatched"];

  return dispatchTask({ title, agentName, companyName, priority, description, tags });
}

/**
 * POST /api/dispatch — Dispatch a task via JSON body
 */
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token =
    searchParams.get("token") ||
    request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token !== API_TOKEN) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json();
    const { title, agent, company, priority, description, tags } = body;

    if (!title) {
      return jsonResponse({ success: false, error: "Missing required field: title" }, 400);
    }
    if (!agent) {
      return jsonResponse({ success: false, error: "Missing required field: agent" }, 400);
    }

    const rawPriority = (priority || "medium").toLowerCase();
    const validPriority: Priority = VALID_PRIORITIES.includes(rawPriority as Priority)
      ? (rawPriority as Priority)
      : "medium";

    return dispatchTask({
      title,
      agentName: agent,
      companyName: company || "Krystal Klean Exterior",
      priority: validPriority,
      description: description || `Dispatched to ${agent}: ${title}`,
      tags: Array.isArray(tags) ? tags : tags ? tags.split(",").map((t: string) => t.trim()) : ["dispatched"],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}

async function dispatchTask(params: {
  title: string;
  agentName: string;
  companyName: string;
  priority: Priority;
  description: string;
  tags: string[];
}) {
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Find the agent by name
    const agents = await client.query(api.agents.list, {});
    const agent = agents.find(
      (a) => a.name.toLowerCase() === params.agentName.toLowerCase()
    );
    if (!agent) {
      return jsonResponse(
        {
          success: false,
          error: `Agent "${params.agentName}" not found`,
          availableAgents: agents.map((a) => a.name),
        },
        404
      );
    }

    // Find the company by name
    const companies = await client.query(api.companies.list, {});
    const company = companies.find(
      (c) => c.name.toLowerCase() === params.companyName.toLowerCase()
    );
    if (!company) {
      return jsonResponse(
        {
          success: false,
          error: `Company "${params.companyName}" not found`,
          availableCompanies: companies.map((c) => c.name),
        },
        404
      );
    }

    // Dispatch
    const result = await client.mutation(api.dispatch.dispatchTask, {
      title: params.title,
      description: params.description,
      priority: params.priority,
      companyId: company._id,
      agentId: agent._id,
      tags: params.tags,
    });

    return jsonResponse({
      success: true,
      message: `Task "${params.title}" dispatched to ${agent.name}`,
      taskId: result.taskId,
      agent: agent.name,
      company: company.name,
      priority: params.priority,
      status: "assigned",
      dashboard: "https://mission-control-dashboard-plum-two.vercel.app/kanban",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}
