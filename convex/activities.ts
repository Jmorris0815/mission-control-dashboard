import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("activities").order("desc").take(200);
  },
});

export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .order("desc")
      .take(200);
  },
});

export const getByAgent = query({
  args: { agentId: v.id("agents") },
  handler: async (ctx, { agentId }) => {
    return await ctx.db
      .query("activities")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .order("desc")
      .take(100);
  },
});

export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    return await ctx.db
      .query("activities")
      .order("desc")
      .take(limit ?? 50);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal("task_created"),
      v.literal("task_updated"),
      v.literal("task_completed"),
      v.literal("task_assigned"),
      v.literal("task_blocked"),
      v.literal("agent_online"),
      v.literal("agent_offline"),
      v.literal("agent_error"),
      v.literal("comment_added"),
      v.literal("mention"),
      v.literal("deliverable_uploaded"),
      v.literal("company_created"),
      v.literal("milestone_reached"),
      v.literal("heartbeat"),
      v.literal("system")
    ),
    companyId: v.optional(v.id("companies")),
    taskId: v.optional(v.id("tasks")),
    agentId: v.optional(v.id("agents")),
    userId: v.optional(v.id("users")),
    message: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("activities", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("activities") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
