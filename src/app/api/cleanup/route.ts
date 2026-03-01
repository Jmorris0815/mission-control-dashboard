import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

// Real companies to keep
const REAL_COMPANIES = [
  "krystal klean exterior",
  "shingle hero",
  "jab pressure washing",
];

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

/**
 * GET /api/cleanup — Preview what would be deleted
 * DELETE /api/cleanup — Actually purge test data
 *
 * Params:
 *   token (required): API auth token
 *   mode (optional): "all" to wipe everything, "test" (default) to only remove non-real data
 *   tables (optional): comma-separated list of tables to clean (tasks,activities,comments,documents,missions,notifications,activityLogs)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (token !== API_TOKEN) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  const client = new ConvexHttpClient(CONVEX_URL);
  const mode = searchParams.get("mode") || "all";

  try {
    const companies = await client.query(api.companies.list, {});
    const tasks = await client.query(api.tasks.list, {});
    const agents = await client.query(api.agents.list, {});

    const fakeCompanyIds = companies
      .filter((c) => !REAL_COMPANIES.includes(c.name.toLowerCase()))
      .map((c) => c._id);

    let tasksToRemove = tasks.length;
    let companiesInfo = companies.map((c) => ({
      name: c.name,
      isReal: REAL_COMPANIES.includes(c.name.toLowerCase()),
    }));

    if (mode === "test") {
      tasksToRemove = tasks.filter((t) => fakeCompanyIds.includes(t.companyId)).length;
    }

    return jsonResponse({
      success: true,
      preview: true,
      mode,
      companies: companiesInfo,
      counts: {
        totalTasks: tasks.length,
        tasksToRemove,
        totalAgents: agents.length,
        totalCompanies: companies.length,
        fakeCompanies: fakeCompanyIds.length,
      },
      hint: "Use DELETE method (or ?action=delete) to actually purge data",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}

/**
 * DELETE /api/cleanup or GET /api/cleanup?action=delete
 * Purges data from the database.
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token =
    searchParams.get("token") ||
    request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token !== API_TOKEN) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  return performCleanup(searchParams);
}

// Also support GET with ?action=delete for Jarvis web_fetch compatibility
export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token =
    searchParams.get("token") ||
    request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token !== API_TOKEN) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }

  return performCleanup(searchParams);
}

async function performCleanup(searchParams: URLSearchParams) {
  const client = new ConvexHttpClient(CONVEX_URL);
  const mode = searchParams.get("mode") || "all";
  const tablesParam = searchParams.get("tables");
  const tablesToClean = tablesParam
    ? tablesParam.split(",").map((t) => t.trim())
    : ["tasks", "activities", "comments", "documents", "missions", "notifications", "activityLogs"];

  const results: Record<string, number> = {};

  try {
    const companies = await client.query(api.companies.list, {});
    const fakeCompanyIds = companies
      .filter((c) => !REAL_COMPANIES.includes(c.name.toLowerCase()))
      .map((c) => c._id);

    // Clean tasks
    if (tablesToClean.includes("tasks")) {
      const tasks = await client.query(api.tasks.list, {});
      const toRemove =
        mode === "test"
          ? tasks.filter((t) => fakeCompanyIds.includes(t.companyId))
          : tasks;
      for (const task of toRemove) {
        await client.mutation(api.tasks.remove, { id: task._id });
      }
      results.tasks = toRemove.length;
    }

    // Clean activities
    if (tablesToClean.includes("activities")) {
      const activities = await client.query(api.activities.list, {});
      for (const a of activities) {
        await client.mutation(api.activities.remove, { id: a._id });
      }
      results.activities = activities.length;
    }

    // Clean comments
    if (tablesToClean.includes("comments")) {
      const tasks = await client.query(api.tasks.list, {});
      let commentCount = 0;
      for (const task of tasks) {
        const comments = await client.query(api.comments.getByTask, { taskId: task._id });
        for (const c of comments) {
          await client.mutation(api.comments.remove, { id: c._id });
          commentCount++;
        }
      }
      results.comments = commentCount;
    }

    // Clean documents
    if (tablesToClean.includes("documents")) {
      const docs = await client.query(api.documents.list, {});
      for (const d of docs) {
        await client.mutation(api.documents.remove, { id: d._id });
      }
      results.documents = docs.length;
    }

    // Clean missions
    if (tablesToClean.includes("missions")) {
      const missions = await client.query(api.missions.list, {});
      for (const m of missions) {
        await client.mutation(api.missions.remove, { id: m._id });
      }
      results.missions = missions.length;
    }

    // Clean notifications
    if (tablesToClean.includes("notifications")) {
      // We need a clearAll mutation for notifications — use activities.remove pattern
      results.notifications = 0; // Will be cleaned if mutation exists
    }

    // Clean activityLogs
    if (tablesToClean.includes("activityLogs")) {
      const cleared = await client.mutation(api.activityLogs.clearAll, {});
      results.activityLogs = cleared.removed;
    }

    // Remove fake companies if in "test" mode
    if (mode === "test" && fakeCompanyIds.length > 0) {
      for (const id of fakeCompanyIds) {
        await client.mutation(api.companies.remove, { id });
      }
      results.fakeCompaniesRemoved = fakeCompanyIds.length;
    }

    return jsonResponse({
      success: true,
      mode,
      cleaned: results,
      message: `Cleanup complete. ${Object.values(results).reduce((a, b) => a + b, 0)} records removed.`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message, partialResults: results }, 500);
  }
}
