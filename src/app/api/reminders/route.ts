import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const API_TOKEN = "mc-api-2026-krystalklean";

function auth(req: NextRequest): boolean {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  return token === API_TOKEN;
}

function parseDate(value: string): number | null {
  // Support ISO strings, unix timestamps (ms), or relative like "+2h", "+30m", "+1d"
  const relMatch = value.match(/^\+(\d+)(m|h|d|w)$/);
  if (relMatch) {
    const n = parseInt(relMatch[1]);
    const unit = relMatch[2];
    const ms = unit === "m" ? n * 60000 : unit === "h" ? n * 3600000 : unit === "d" ? n * 86400000 : n * 604800000;
    return Date.now() + ms;
  }
  const num = Number(value);
  if (!isNaN(num) && num > 1e12) return num; // unix ms
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.getTime();
  return null;
}

// GET /api/reminders — List reminders OR create one (for Jarvis web_fetch)
export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  if (!auth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const action = url.searchParams.get("action") ?? "list";

  // ── CREATE via GET ──────────────────────────────────────────────────────
  if (action === "create") {
    const title = url.searchParams.get("title");
    if (!title) {
      return NextResponse.json({ success: false, error: "Missing required param: title" }, { status: 400 });
    }

    const dueStr = url.searchParams.get("due") ?? url.searchParams.get("dueAt");
    if (!dueStr) {
      return NextResponse.json({ success: false, error: "Missing required param: due (e.g., +2h, +30m, +1d, or ISO date)" }, { status: 400 });
    }
    const dueAt = parseDate(dueStr);
    if (!dueAt) {
      return NextResponse.json({ success: false, error: `Invalid due format: "${dueStr}". Use +2h, +30m, +1d, ISO date, or unix ms.` }, { status: 400 });
    }

    const priority = (url.searchParams.get("priority") ?? "medium") as "critical" | "high" | "medium" | "low";
    const recurrence = (url.searchParams.get("recurrence") ?? "none") as "none" | "daily" | "weekly" | "monthly";
    const createdBy = url.searchParams.get("createdBy") ?? url.searchParams.get("agent") ?? "api";
    const description = url.searchParams.get("description") ?? undefined;
    const tagsStr = url.searchParams.get("tags");
    const tags = tagsStr ? tagsStr.split(",").map((t) => t.trim()) : undefined;

    // Resolve company by name
    let companyId: string | undefined;
    const companyName = url.searchParams.get("company");
    if (companyName) {
      const companies = await convex.query(api.companies.list);
      const match = companies.find((c: { name: string }) => c.name.toLowerCase() === companyName.toLowerCase());
      if (match) companyId = match._id;
    }

    // Resolve agent by name
    let agentId: string | undefined;
    const agentName = url.searchParams.get("agent");
    if (agentName) {
      const agents = await convex.query(api.agents.list);
      const match = agents.find((a: { name: string }) => a.name.toLowerCase() === agentName.toLowerCase());
      if (match) agentId = match._id;
    }

    try {
      const id = await convex.mutation(api.reminders.create, {
        title,
        description,
        dueAt,
        priority,
        recurrence,
        createdBy,
        tags,
        ...(companyId ? { companyId: companyId as any } : {}),
        ...(agentId ? { agentId: agentId as any } : {}),
      });

      return NextResponse.json({
        success: true,
        message: `Reminder "${title}" created — due ${new Date(dueAt).toISOString()}`,
        reminderId: id,
        dueAt: new Date(dueAt).toISOString(),
        priority,
        recurrence,
        createdBy,
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── COMPLETE via GET ────────────────────────────────────────────────────
  if (action === "complete") {
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing required param: id" }, { status: 400 });
    }
    try {
      const result = await convex.mutation(api.reminders.complete, { id: id as any });
      return NextResponse.json({ success: true, ...result });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── SNOOZE via GET ──────────────────────────────────────────────────────
  if (action === "snooze") {
    const id = url.searchParams.get("id");
    const minutes = parseInt(url.searchParams.get("minutes") ?? "30");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing required param: id" }, { status: 400 });
    }
    try {
      const result = await convex.mutation(api.reminders.snooze, { id: id as any, minutes });
      return NextResponse.json({ success: true, ...result, snoozedUntil: new Date(result.snoozedUntil).toISOString() });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── DISMISS via GET ─────────────────────────────────────────────────────
  if (action === "dismiss") {
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing required param: id" }, { status: 400 });
    }
    try {
      await convex.mutation(api.reminders.dismiss, { id: id as any });
      return NextResponse.json({ success: true, message: "Reminder dismissed" });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── TRIGGER via GET ─────────────────────────────────────────────────────
  if (action === "trigger") {
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing required param: id" }, { status: 400 });
    }
    try {
      await convex.mutation(api.reminders.trigger, { id: id as any });
      return NextResponse.json({ success: true, message: "Reminder triggered" });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── CHECK DUE via GET ───────────────────────────────────────────────────
  if (action === "check-due") {
    try {
      const due = await convex.query(api.reminders.getDue);
      return NextResponse.json({
        success: true,
        count: due.length,
        reminders: due.map((r: any) => ({
          id: r._id,
          title: r.title,
          description: r.description,
          dueAt: new Date(r.dueAt).toISOString(),
          priority: r.priority,
          createdBy: r.createdBy,
          status: r.status,
        })),
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── UPCOMING via GET ────────────────────────────────────────────────────
  if (action === "upcoming") {
    const hours = parseInt(url.searchParams.get("hours") ?? "24");
    try {
      const upcoming = await convex.query(api.reminders.getUpcoming, { hoursAhead: hours });
      return NextResponse.json({
        success: true,
        count: upcoming.length,
        hoursAhead: hours,
        reminders: upcoming.map((r: any) => ({
          id: r._id,
          title: r.title,
          description: r.description,
          dueAt: new Date(r.dueAt).toISOString(),
          priority: r.priority,
          createdBy: r.createdBy,
        })),
      });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── DELETE via GET ──────────────────────────────────────────────────────
  if (action === "delete") {
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing required param: id" }, { status: 400 });
    }
    try {
      await convex.mutation(api.reminders.remove, { id: id as any });
      return NextResponse.json({ success: true, message: "Reminder deleted" });
    } catch (err: any) {
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
  }

  // ── LIST (default) ──────────────────────────────────────────────────────
  try {
    const statusFilter = url.searchParams.get("status");
    let reminders;
    if (statusFilter && ["pending", "triggered", "snoozed", "dismissed", "completed"].includes(statusFilter)) {
      reminders = await convex.query(api.reminders.getByStatus, { status: statusFilter as any });
    } else {
      reminders = await convex.query(api.reminders.list);
    }

    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    return NextResponse.json({
      success: true,
      count: reminders.length,
      reminders: reminders.slice(0, limit).map((r: any) => ({
        id: r._id,
        title: r.title,
        description: r.description,
        dueAt: new Date(r.dueAt).toISOString(),
        status: r.status,
        priority: r.priority,
        recurrence: r.recurrence,
        createdBy: r.createdBy,
        tags: r.tags,
        createdAt: new Date(r.createdAt).toISOString(),
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/reminders — Create a reminder with JSON body
export async function POST(req: NextRequest) {
  if (!auth(req)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, due, dueAt: dueAtRaw, priority, recurrence, createdBy, agent, company, tags, metadata } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: "Missing required field: title" }, { status: 400 });
    }

    const dueStr = due ?? dueAtRaw;
    if (!dueStr) {
      return NextResponse.json({ success: false, error: "Missing required field: due or dueAt" }, { status: 400 });
    }
    const dueAt = typeof dueStr === "number" ? dueStr : parseDate(String(dueStr));
    if (!dueAt) {
      return NextResponse.json({ success: false, error: `Invalid due format: "${dueStr}"` }, { status: 400 });
    }

    // Resolve company
    let companyId: string | undefined;
    if (company) {
      const companies = await convex.query(api.companies.list);
      const match = companies.find((c: { name: string }) => c.name.toLowerCase() === company.toLowerCase());
      if (match) companyId = match._id;
    }

    // Resolve agent
    let agentId: string | undefined;
    const agentName = agent ?? createdBy;
    if (agentName) {
      const agents = await convex.query(api.agents.list);
      const match = agents.find((a: { name: string }) => a.name.toLowerCase() === agentName.toLowerCase());
      if (match) agentId = match._id;
    }

    const id = await convex.mutation(api.reminders.create, {
      title,
      description,
      dueAt,
      priority: priority ?? "medium",
      recurrence: recurrence ?? "none",
      createdBy: createdBy ?? agent ?? "api",
      tags,
      metadata,
      ...(companyId ? { companyId: companyId as any } : {}),
      ...(agentId ? { agentId: agentId as any } : {}),
    });

    return NextResponse.json({
      success: true,
      message: `Reminder "${title}" created`,
      reminderId: id,
      dueAt: new Date(dueAt).toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
