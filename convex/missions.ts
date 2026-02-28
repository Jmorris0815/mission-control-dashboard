import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("missions").collect();
  },
});

export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("missions")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
  },
});

export const get = query({
  args: { id: v.id("missions") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    companyId: v.id("companies"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused")
    ),
    linkedTaskIds: v.array(v.id("tasks")),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("missions", {
      ...args,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("missions"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("completed"),
        v.literal("paused")
      )
    ),
    linkedTaskIds: v.optional(v.array(v.id("tasks"))),
    progress: v.optional(v.number()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const recalculateProgress = mutation({
  args: { id: v.id("missions") },
  handler: async (ctx, { id }) => {
    const mission = await ctx.db.get(id);
    if (!mission) return;
    if (mission.linkedTaskIds.length === 0) {
      await ctx.db.patch(id, { progress: 0, updatedAt: Date.now() });
      return;
    }
    let done = 0;
    for (const taskId of mission.linkedTaskIds) {
      const task = await ctx.db.get(taskId);
      if (task && task.status === "done") done++;
    }
    const progress = Math.round((done / mission.linkedTaskIds.length) * 100);
    await ctx.db.patch(id, { progress, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("missions") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
