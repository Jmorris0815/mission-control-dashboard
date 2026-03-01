import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Dispatch a task to an agent.
 * Creates the task in "assigned" status, links it to the agent, and updates the agent's currentTaskTitle.
 */
export const dispatchTask = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    companyId: v.id("companies"),
    agentId: v.id("agents"),
    tags: v.optional(v.array(v.string())),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const agent = await ctx.db.get(args.agentId);
    if (!agent) throw new Error("Agent not found");

    const tasks = await ctx.db.query("tasks").collect();

    // Create the task in "assigned" status
    const taskId = await ctx.db.insert("tasks", {
      title: args.title,
      description: args.description,
      status: "assigned",
      priority: args.priority,
      companyId: args.companyId,
      assignedAgentId: args.agentId,
      tags: args.tags ?? ["dispatched"],
      sortOrder: tasks.length,
      createdAt: now,
      updatedAt: now,
    });

    // Update the agent
    await ctx.db.patch(args.agentId, {
      currentTaskId: taskId,
      currentTaskTitle: args.title,
      status: "busy",
      lastAction: `Dispatched: ${args.title}`,
      lastStatusChange: now,
      lastHeartbeat: now,
    });

    // Log activity — task created
    await ctx.db.insert("activities", {
      type: "task_created",
      companyId: args.companyId,
      taskId: taskId,
      agentId: args.agentId,
      message: `Task "${args.title}" created and dispatched to ${agent.name}`,
      createdAt: now,
    });

    // Log activity — task assigned
    await ctx.db.insert("activities", {
      type: "task_assigned",
      companyId: args.companyId,
      taskId: taskId,
      agentId: args.agentId,
      message: `${agent.name} assigned to "${args.title}" [${args.priority}]`,
      createdAt: now,
    });

    return { taskId, agentName: agent.name };
  },
});
