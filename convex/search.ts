import { query } from "./_generated/server";
import { v } from "convex/values";

export const globalSearch = query({
  args: { query: v.string() },
  handler: async (ctx, { query: q }) => {
    if (!q || q.length < 2) return { tasks: [], agents: [], documents: [], comments: [] };
    const lower = q.toLowerCase();

    const allTasks = await ctx.db.query("tasks").collect();
    const tasks = allTasks
      .filter(
        (t) =>
          t.title.toLowerCase().includes(lower) ||
          t.description.toLowerCase().includes(lower)
      )
      .slice(0, 10);

    const allAgents = await ctx.db.query("agents").collect();
    const agents = allAgents
      .filter(
        (a) =>
          a.name.toLowerCase().includes(lower) ||
          a.role.toLowerCase().includes(lower)
      )
      .slice(0, 10);

    const allDocs = await ctx.db.query("documents").collect();
    const documents = allDocs
      .filter(
        (d) =>
          d.title.toLowerCase().includes(lower) ||
          (d.content && d.content.toLowerCase().includes(lower))
      )
      .slice(0, 10);

    const allComments = await ctx.db.query("comments").collect();
    const comments = allComments
      .filter((c) => c.content.toLowerCase().includes(lower))
      .slice(0, 10);

    return { tasks, agents, documents, comments };
  },
});
