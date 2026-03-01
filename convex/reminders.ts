import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ───────────────────────────────────────────────────────────────────

/** List all reminders, newest first. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("reminders").order("desc").collect();
  },
});

/** Get a single reminder by ID. */
export const get = query({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

/** List reminders by status. */
export const getByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("triggered"),
      v.literal("snoozed"),
      v.literal("dismissed"),
      v.literal("completed")
    ),
  },
  handler: async (ctx, { status }) => {
    return await ctx.db
      .query("reminders")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .collect();
  },
});

/** List reminders by company. */
export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("reminders")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .order("desc")
      .collect();
  },
});

/** List reminders assigned to a specific agent. */
export const getByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    return await ctx.db
      .query("reminders")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .order("desc")
      .collect();
  },
});

/** Get all pending reminders that are due (dueAt <= now). */
export const getDue = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const pending = await ctx.db
      .query("reminders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    const snoozed = await ctx.db
      .query("reminders")
      .withIndex("by_status", (q) => q.eq("status", "snoozed"))
      .collect();
    const due = [...pending, ...snoozed].filter((r) => {
      if (r.status === "snoozed" && r.snoozedUntil) {
        return r.snoozedUntil <= now;
      }
      return r.dueAt <= now;
    });
    return due;
  },
});

/** Get upcoming reminders (due in the next N hours, default 24). */
export const getUpcoming = query({
  args: { hoursAhead: v.optional(v.number()) },
  handler: async (ctx, { hoursAhead }) => {
    const now = Date.now();
    const horizon = now + (hoursAhead ?? 24) * 60 * 60 * 1000;
    const pending = await ctx.db
      .query("reminders")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
    return pending.filter((r) => r.dueAt > now && r.dueAt <= horizon);
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new reminder. */
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    dueAt: v.number(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    recurrence: v.optional(
      v.union(
        v.literal("none"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      )
    ),
    companyId: v.optional(v.id("companies")),
    agentId: v.optional(v.id("agents")),
    taskId: v.optional(v.id("tasks")),
    createdBy: v.string(),
    tags: v.optional(v.array(v.string())),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("reminders", {
      ...args,
      status: "pending",
      recurrence: args.recurrence ?? "none",
      createdAt: now,
      updatedAt: now,
    });
    // Log activity
    await ctx.db.insert("activities", {
      type: "system",
      companyId: args.companyId,
      agentId: args.agentId,
      message: `Reminder set: "${args.title}" — due ${new Date(args.dueAt).toLocaleString()}`,
      createdAt: now,
    });
    return id;
  },
});

/** Update a reminder's fields. */
export const update = mutation({
  args: {
    id: v.id("reminders"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    priority: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("triggered"),
        v.literal("snoozed"),
        v.literal("dismissed"),
        v.literal("completed")
      )
    ),
    recurrence: v.optional(
      v.union(
        v.literal("none"),
        v.literal("daily"),
        v.literal("weekly"),
        v.literal("monthly")
      )
    ),
    tags: v.optional(v.array(v.string())),
    snoozedUntil: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) throw new Error("Reminder not found");

    const now = Date.now();
    const filtered: Record<string, unknown> = { updatedAt: now };
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }

    // Track status transitions
    if (updates.status && updates.status !== reminder.status) {
      if (updates.status === "triggered") {
        filtered.triggeredAt = now;
      }
      if (updates.status === "completed") {
        filtered.completedAt = now;
      }
    }

    await ctx.db.patch(id, filtered);
    return id;
  },
});

/** Mark a reminder as triggered. */
export const trigger = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) throw new Error("Reminder not found");
    const now = Date.now();
    await ctx.db.patch(id, {
      status: "triggered",
      triggeredAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      type: "system",
      companyId: reminder.companyId,
      agentId: reminder.agentId,
      message: `Reminder triggered: "${reminder.title}"`,
      createdAt: now,
    });
    return id;
  },
});

/** Snooze a reminder for a given number of minutes. */
export const snooze = mutation({
  args: {
    id: v.id("reminders"),
    minutes: v.number(),
  },
  handler: async (ctx, { id, minutes }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) throw new Error("Reminder not found");
    const now = Date.now();
    const snoozedUntil = now + minutes * 60 * 1000;
    await ctx.db.patch(id, {
      status: "snoozed",
      snoozedUntil,
      updatedAt: now,
    });
    return { id, snoozedUntil };
  },
});

/** Complete a reminder. If recurring, create the next occurrence. */
export const complete = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) throw new Error("Reminder not found");
    const now = Date.now();

    await ctx.db.patch(id, {
      status: "completed",
      completedAt: now,
      updatedAt: now,
    });

    // If recurring, create the next occurrence
    if (reminder.recurrence && reminder.recurrence !== "none") {
      let nextDue = reminder.dueAt;
      const DAY = 24 * 60 * 60 * 1000;
      if (reminder.recurrence === "daily") nextDue += DAY;
      else if (reminder.recurrence === "weekly") nextDue += 7 * DAY;
      else if (reminder.recurrence === "monthly") nextDue += 30 * DAY;

      // Ensure next due is in the future
      while (nextDue <= now) {
        if (reminder.recurrence === "daily") nextDue += DAY;
        else if (reminder.recurrence === "weekly") nextDue += 7 * DAY;
        else nextDue += 30 * DAY;
      }

      const nextId = await ctx.db.insert("reminders", {
        title: reminder.title,
        description: reminder.description,
        dueAt: nextDue,
        status: "pending",
        priority: reminder.priority,
        recurrence: reminder.recurrence,
        companyId: reminder.companyId,
        agentId: reminder.agentId,
        taskId: reminder.taskId,
        createdBy: reminder.createdBy,
        tags: reminder.tags,
        metadata: reminder.metadata,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("activities", {
        type: "system",
        companyId: reminder.companyId,
        agentId: reminder.agentId,
        message: `Recurring reminder "${reminder.title}" — next due ${new Date(nextDue).toLocaleString()}`,
        createdAt: now,
      });

      return { completedId: id, nextId, nextDue };
    }

    return { completedId: id };
  },
});

/** Dismiss a reminder. */
export const dismiss = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    const reminder = await ctx.db.get(id);
    if (!reminder) throw new Error("Reminder not found");
    await ctx.db.patch(id, {
      status: "dismissed",
      updatedAt: Date.now(),
    });
    return id;
  },
});

/** Delete a reminder permanently. */
export const remove = mutation({
  args: { id: v.id("reminders") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
    return id;
  },
});
