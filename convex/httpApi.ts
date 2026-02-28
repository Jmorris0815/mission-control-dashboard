import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
    },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}

function validateAuth(request: Request): boolean {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "").trim();
  return token === API_TOKEN;
}

// ─── POST /api/tasks ─────────────────────────────────────────────────────────
// Creates a new task in the inbox from external sources (Discord, API, etc.)
export const createTask = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Auth check
  if (!validateAuth(request)) {
    return errorResponse("Unauthorized. Provide a valid Bearer token.", 401);
  }

  // Parse body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }

  // Validate required fields
  if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
    return errorResponse("Field 'title' is required and must be a non-empty string.", 400);
  }

  // Validate priority
  const validPriorities = ["critical", "high", "medium", "low"];
  const priority = body.priority || "medium";
  if (!validPriorities.includes(priority)) {
    return errorResponse(`Invalid priority. Must be one of: ${validPriorities.join(", ")}`, 400);
  }

  // Validate type (used as a tag)
  const validTypes = ["idea", "task", "project", "bug"];
  const taskType = body.type || "idea";
  if (!validTypes.includes(taskType)) {
    return errorResponse(`Invalid type. Must be one of: ${validTypes.join(", ")}`, 400);
  }

  // Validate source
  const validSources = ["discord", "api", "manual", "zapier", "n8n"];
  const source = body.source || "api";
  if (!validSources.includes(source)) {
    return errorResponse(`Invalid source. Must be one of: ${validSources.join(", ")}`, 400);
  }

  // Look up company — find by name or use first company
  let companyId: any = null;
  const allCompanies = await ctx.runQuery(api.companies.list);

  if (body.company) {
    const match = allCompanies.find(
      (c: any) =>
        c.name.toLowerCase() === body.company.toLowerCase() ||
        c.name.toLowerCase().includes(body.company.toLowerCase())
    );
    if (match) {
      companyId = match._id;
    } else {
      return errorResponse(
        `Company '${body.company}' not found. Available: ${allCompanies.map((c: any) => c.name).join(", ")}`,
        404
      );
    }
  } else {
    // Default to first company (Krystal Klean Exterior)
    if (allCompanies.length > 0) {
      companyId = allCompanies[0]._id;
    } else {
      return errorResponse("No companies found in the system.", 500);
    }
  }

  // Build tags from type and source
  const tags: string[] = [taskType];
  if (source !== "manual") {
    tags.push(`source:${source}`);
  }
  if (body.tags && Array.isArray(body.tags)) {
    tags.push(...body.tags);
  }

  // Build description
  const description = body.description || `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} submitted via ${source}`;

  // Create the task via the existing mutation
  const taskId = await ctx.runMutation(api.tasks.create, {
    title: body.title.trim(),
    description,
    status: "inbox",
    priority: priority as any,
    companyId,
    tags,
  });

  // Create a specific activity entry for external submissions
  const sourceLabel = source === "discord" ? "Discord" : source === "api" ? "API" : source;
  await ctx.runMutation(api.activities.create, {
    type: "task_created",
    companyId,
    taskId,
    message: `New ${taskType} submitted from ${sourceLabel}: "${body.title.trim()}"`,
    metadata: { source, type: taskType, external: true },
  });

  // Look up company name for the response
  const company = allCompanies.find((c: any) => c._id === companyId);

  return jsonResponse({
    success: true,
    taskId,
    message: `${taskType.charAt(0).toUpperCase() + taskType.slice(1)} "${body.title.trim()}" created in inbox`,
    task: {
      id: taskId,
      title: body.title.trim(),
      description,
      status: "inbox",
      priority,
      type: taskType,
      source,
      company: company?.name || "Unknown",
      tags,
      createdAt: new Date().toISOString(),
    },
  });
});

// ─── POST /api/tasks/list ────────────────────────────────────────────────────
// Returns all tasks, optionally filtered by company or status
export const listTasks = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Auth check
  if (!validateAuth(request)) {
    return errorResponse("Unauthorized. Provide a valid Bearer token.", 401);
  }

  // Parse optional filters from body (or empty body for all tasks)
  let filters: any = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      filters = JSON.parse(text);
    }
  } catch {
    // No body is fine — return all tasks
  }

  // Get all tasks
  let tasks = await ctx.runQuery(api.tasks.list);

  // Get all companies for name resolution
  const allCompanies = await ctx.runQuery(api.companies.list);
  const companyMap = new Map(allCompanies.map((c: any) => [c._id, c]));

  // Get all agents for name resolution
  const allAgents = await ctx.runQuery(api.agents.list);
  const agentMap = new Map(allAgents.map((a: any) => [a._id, a]));

  // Apply filters
  if (filters.company) {
    const match = allCompanies.find(
      (c: any) =>
        c.name.toLowerCase() === filters.company.toLowerCase() ||
        c.name.toLowerCase().includes(filters.company.toLowerCase())
    );
    if (match) {
      tasks = tasks.filter((t: any) => t.companyId === match._id);
    }
  }

  if (filters.status) {
    tasks = tasks.filter((t: any) => t.status === filters.status);
  }

  if (filters.priority) {
    tasks = tasks.filter((t: any) => t.priority === filters.priority);
  }

  // Enrich tasks with company and agent names
  const enrichedTasks = tasks.map((t: any) => {
    const company = companyMap.get(t.companyId);
    const agent = t.assignedAgentId ? agentMap.get(t.assignedAgentId) : null;
    return {
      id: t._id,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      company: company?.name || "Unknown",
      companyColor: company?.color || "#666",
      assignedAgent: agent?.name || null,
      tags: t.tags,
      dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
      createdAt: new Date(t.createdAt).toISOString(),
      updatedAt: new Date(t.updatedAt).toISOString(),
      completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
    };
  });

  return jsonResponse({
    success: true,
    count: enrichedTasks.length,
    tasks: enrichedTasks,
    filters: {
      company: filters.company || null,
      status: filters.status || null,
      priority: filters.priority || null,
    },
  });
});

// ─── CORS preflight handler ──────────────────────────────────────────────────
export const corsPreflightTasks = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

export const corsPreflightTasksList = httpAction(async () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});
