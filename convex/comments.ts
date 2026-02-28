import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByTask = query({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db
      .query("comments")
      .withIndex("by_task", (q) => q.eq("taskId", taskId))
      .collect();
  },
});

export const create = mutation({
  args: {
    taskId: v.id("tasks"),
    authorAgentId: v.optional(v.id("agents")),
    authorUserId: v.optional(v.id("users")),
    content: v.string(),
    type: v.union(
      v.literal("comment"),
      v.literal("status_update"),
      v.literal("question"),
      v.literal("approval_request"),
      v.literal("blocker"),
      v.literal("deliverable"),
      v.literal("review"),
      v.literal("refute")
    ),
    mentions: v.array(v.string()),
    parentCommentId: v.optional(v.id("comments")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("comments", {
      ...args,
      createdAt: now,
    });
    const task = await ctx.db.get(args.taskId);
    const authorName = args.authorAgentId
      ? (await ctx.db.get(args.authorAgentId))?.name ?? "Agent"
      : "User";
    await ctx.db.insert("activities", {
      type: "comment_added",
      companyId: task?.companyId,
      taskId: args.taskId,
      agentId: args.authorAgentId,
      userId: args.authorUserId,
      message: `${authorName} commented on "${task?.title ?? "task"}"`,
      createdAt: now,
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("comments") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
