import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("agents").collect();
  },
});

export const get = query({
  args: { id: v.id("agents") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    description: v.string(),
    avatar: v.optional(v.string()),
    status: v.union(
      v.literal("online"),
      v.literal("busy"),
      v.literal("idle"),
      v.literal("offline"),
      v.literal("error")
    ),
    companyId: v.optional(v.id("companies")),
    capabilities: v.array(v.string()),
    personality: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("agents", {
      ...args,
      totalTasksCompleted: 0,
      lastHeartbeat: now,
      createdAt: now,
    });
    await ctx.db.insert("activities", {
      type: "agent_online",
      agentId: id,
      companyId: args.companyId,
      message: `Agent "${args.name}" (${args.role}) has been created`,
      createdAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    description: v.optional(v.string()),
    avatar: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("online"),
        v.literal("busy"),
        v.literal("idle"),
        v.literal("offline"),
        v.literal("error")
      )
    ),
    companyId: v.optional(v.id("companies")),
    capabilities: v.optional(v.array(v.string())),
    personality: v.optional(v.string()),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, { id, ...updates }) => {
    const agent = await ctx.db.get(id);
    if (!agent) throw new Error("Agent not found");
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, filtered);

    if (updates.status && updates.status !== agent.status) {
      const type =
        updates.status === "online"
          ? ("agent_online" as const)
          : updates.status === "offline"
            ? ("agent_offline" as const)
            : updates.status === "error"
              ? ("agent_error" as const)
              : ("system" as const);
      await ctx.db.insert("activities", {
        type,
        agentId: id,
        companyId: agent.companyId,
        message: `${agent.name} is now ${updates.status}`,
        createdAt: Date.now(),
      });
    }
  },
});

export const heartbeat = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { lastHeartbeat: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
