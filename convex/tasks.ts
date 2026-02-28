import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("tasks").collect();
  },
});

export const get = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByCompany = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, { companyId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_company", (q) => q.eq("companyId", companyId))
      .collect();
  },
});

export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, { status }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", status as any))
      .collect();
  },
});

export const getByParent = query({
  args: { parentTaskId: v.id("tasks") },
  handler: async (ctx, { parentTaskId }) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_parent", (q) => q.eq("parentTaskId", parentTaskId))
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("backlog"),
      v.literal("assigned"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("blocked"),
      v.literal("cancelled")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    companyId: v.id("companies"),
    assignedAgentId: v.optional(v.id("agents")),
    createdByUserId: v.optional(v.id("users")),
    parentTaskId: v.optional(v.id("tasks")),
    tags: v.array(v.string()),
    dueDate: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const tasks = await ctx.db.query("tasks").collect();
    const id = await ctx.db.insert("tasks", {
      ...args,
      sortOrder: tasks.length,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      type: "task_created",
      companyId: args.companyId,
      taskId: id,
      agentId: args.assignedAgentId,
      userId: args.createdByUserId,
      message: `Task "${args.title}" created`,
      createdAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("tasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("backlog"),
        v.literal("assigned"),
        v.literal("in_progress"),
        v.literal("in_review"),
        v.literal("done"),
        v.literal("blocked"),
        v.literal("cancelled")
      )
    ),
    priority: v.optional(
      v.union(
        v.literal("critical"),
        v.literal("high"),
        v.literal("medium"),
        v.literal("low")
      )
    ),
    assignedAgentId: v.optional(v.id("agents")),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    actualMinutes: v.optional(v.number()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const task = await ctx.db.get(id);
    if (!task) throw new Error("Task not found");
    const now = Date.now();
    const filtered: Record<string, any> = { updatedAt: now };
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) filtered[key] = val;
    }

    if (updates.status && updates.status !== task.status) {
      if (updates.status === "done") {
        filtered.completedAt = now;
        if (task.assignedAgentId) {
          const agent = await ctx.db.get(task.assignedAgentId);
          if (agent) {
            await ctx.db.patch(agent._id, {
              totalTasksCompleted: agent.totalTasksCompleted + 1,
              currentTaskId: undefined,
            });
          }
        }
        await ctx.db.insert("activities", {
          type: "task_completed",
          companyId: task.companyId,
          taskId: id,
          agentId: task.assignedAgentId,
          message: `Task "${task.title}" completed`,
          createdAt: now,
        });
      } else if (updates.status === "blocked") {
        await ctx.db.insert("activities", {
          type: "task_blocked",
          companyId: task.companyId,
          taskId: id,
          agentId: task.assignedAgentId,
          message: `Task "${task.title}" is blocked`,
          createdAt: now,
        });
      } else {
        await ctx.db.insert("activities", {
          type: "task_updated",
          companyId: task.companyId,
          taskId: id,
          agentId: task.assignedAgentId,
          message: `Task "${task.title}" moved to ${updates.status.replace("_", " ")}`,
          createdAt: now,
        });
      }
    }

    if (
      updates.assignedAgentId &&
      updates.assignedAgentId !== task.assignedAgentId
    ) {
      const agent = await ctx.db.get(updates.assignedAgentId);
      if (agent) {
        await ctx.db.patch(updates.assignedAgentId, { currentTaskId: id });
        await ctx.db.insert("activities", {
          type: "task_assigned",
          companyId: task.companyId,
          taskId: id,
          agentId: updates.assignedAgentId,
          message: `Task "${task.title}" assigned to ${agent.name}`,
          createdAt: now,
        });
      }
    }

    await ctx.db.patch(id, filtered);
  },
});

export const remove = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, { id }) => {
    const task = await ctx.db.get(id);
    if (task) {
      await ctx.db.insert("activities", {
        type: "task_updated",
        companyId: task.companyId,
        taskId: id,
        message: `Task "${task.title}" deleted`,
        createdAt: Date.now(),
      });
    }
    await ctx.db.delete(id);
  },
});
