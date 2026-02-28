import { httpRouter } from "convex/server";
import {
  createTask,
  listTasks,
  corsPreflightTasks,
  corsPreflightTasksList,
} from "./httpApi";

const http = httpRouter();

// ─── External API Endpoints ──────────────────────────────────────────────────

// POST /api/tasks — Create a new task from external sources (Discord, API, etc.)
http.route({
  path: "/api/tasks",
  method: "POST",
  handler: createTask,
});

// OPTIONS /api/tasks — CORS preflight
http.route({
  path: "/api/tasks",
  method: "OPTIONS",
  handler: corsPreflightTasks,
});

// POST /api/tasks/list — List all tasks with optional filters
http.route({
  path: "/api/tasks/list",
  method: "POST",
  handler: listTasks,
});

// OPTIONS /api/tasks/list — CORS preflight
http.route({
  path: "/api/tasks/list",
  method: "OPTIONS",
  handler: corsPreflightTasksList,
});

// ─── Future OpenClaw Integration ─────────────────────────────────────────────
// POST /api/openclaw/heartbeat
// POST /api/openclaw/task-update
// POST /api/openclaw/task-complete
// POST /api/openclaw/comment
// POST /api/openclaw/activity

export default http;
