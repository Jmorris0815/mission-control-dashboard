import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ── Queries ───────────────────────────────────────────────────────────────────

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

// ── Mutations ─────────────────────────────────────────────────────────────────

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
    totalTasksCompleted: v.optional(v.number()),
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

/** Find an agent by exact name (case-insensitive) and update their fields. */
export const updateByName = mutation({
  args: {
    name: v.string(),
    status: v.optional(
      v.union(
        v.literal("online"),
        v.literal("busy"),
        v.literal("idle"),
        v.literal("offline"),
        v.literal("error")
      )
    ),
    description: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
    totalTasksCompleted: v.optional(v.number()),
    currentTaskId: v.optional(v.id("tasks")),
  },
  handler: async (ctx, { name, ...updates }) => {
    const all = await ctx.db.query("agents").collect();
    const agent = all.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (!agent) throw new Error(`Agent "${name}" not found`);

    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(agent._id, filtered);

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
        agentId: agent._id,
        companyId: agent.companyId,
        message: `${agent.name} is now ${updates.status}`,
        createdAt: Date.now(),
      });
    }

    return agent._id;
  },
});

/** Delete an agent by exact name (case-insensitive). */
export const removeByName = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const all = await ctx.db.query("agents").collect();
    const agent = all.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (!agent) throw new Error(`Agent "${name}" not found`);
    await ctx.db.insert("activities", {
      type: "agent_offline",
      agentId: agent._id,
      companyId: agent.companyId,
      message: `Agent "${agent.name}" has been removed`,
      createdAt: Date.now(),
    });
    await ctx.db.delete(agent._id);
    return agent._id;
  },
});

/** Remove ALL agents (used for fresh-start migrations). */
export const clearAll = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("agents").collect();
    for (const agent of all) {
      await ctx.db.delete(agent._id);
    }
    return { removed: all.length };
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
