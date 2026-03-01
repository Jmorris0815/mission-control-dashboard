import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ───────────────────────────────────────────────────────────────────

/** List all activity logs, newest first. Optional limit. */
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const logs = await ctx.db
      .query("activityLogs")
      .order("desc")
      .take(limit ?? 500);
    return logs;
  },
});

/** Get logs for a specific agent. */
export const byAgent = query({
  args: { agentName: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { agentName, limit }) => {
    const all = await ctx.db
      .query("activityLogs")
      .order("desc")
      .collect();
    return all
      .filter((l) => l.agentName.toLowerCase() === agentName.toLowerCase())
      .slice(0, limit ?? 200);
  },
});

/** Get logs by action type. */
export const byActionType = query({
  args: { actionType: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { actionType, limit }) => {
    const all = await ctx.db
      .query("activityLogs")
      .order("desc")
      .collect();
    return all
      .filter((l) => l.actionType.toLowerCase() === actionType.toLowerCase())
      .slice(0, limit ?? 200);
  },
});

/** Get stats summary. */
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("activityLogs").collect();
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const today = all.filter((l) => l.timestamp >= oneDayAgo);
    const lastHour = all.filter((l) => l.timestamp >= oneHourAgo);

    // Count by status
    const successCount = today.filter((l) => l.status === "success").length;
    const failCount = today.filter((l) => l.status === "fail").length;
    const pendingCount = today.filter((l) => l.status === "pending").length;

    // Count by agent
    const agentCounts: Record<string, number> = {};
    today.forEach((l) => {
      agentCounts[l.agentName] = (agentCounts[l.agentName] || 0) + 1;
    });

    // Count by action type
    const typeCounts: Record<string, number> = {};
    today.forEach((l) => {
      typeCounts[l.actionType] = (typeCounts[l.actionType] || 0) + 1;
    });

    return {
      total: all.length,
      today: today.length,
      lastHour: lastHour.length,
      successCount,
      failCount,
      pendingCount,
      agentCounts,
      typeCounts,
    };
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

/** Create a new activity log entry. */
export const create = mutation({
  args: {
    agentName: v.string(),
    actionType: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("fail"),
      v.literal("pending"),
      v.literal("info")
    ),
    metadata: v.optional(v.any()),
    company: v.optional(v.string()),
    duration: v.optional(v.number()),
    sessionId: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("activityLogs", {
      timestamp: args.timestamp ?? Date.now(),
      agentName: args.agentName,
      actionType: args.actionType,
      description: args.description,
      status: args.status,
      metadata: args.metadata,
      company: args.company,
      duration: args.duration,
      sessionId: args.sessionId,
    });
    return id;
  },
});

/** Clear all activity logs. */
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("activityLogs").collect();
    for (const log of all) {
      await ctx.db.delete(log._id);
    }
    return { removed: all.length };
  },
});
