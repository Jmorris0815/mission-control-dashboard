import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function for demo purposes
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  handler: async (ctx, { username, password }) => {
    const passwordHash = simpleHash(password);
    // Check by email or name
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", username))
      .first();

    if (!user) {
      // Try by name
      const users = await ctx.db.query("users").collect();
      const byName = users.find(
        (u) => u.name.toLowerCase() === username.toLowerCase()
      );
      if (!byName || byName.passwordHash !== passwordHash) {
        throw new Error("Invalid credentials");
      }
      await ctx.db.patch(byName._id, { lastActiveAt: Date.now() });
      return byName._id;
    }

    if (user.passwordHash !== passwordHash) {
      throw new Error("Invalid credentials");
    }
    await ctx.db.patch(user._id, { lastActiveAt: Date.now() });
    return user._id;
  },
});

export const getUser = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, { userId }) => {
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.id("users"),
    preferences: v.object({
      theme: v.union(
        v.literal("dark"),
        v.literal("light"),
        v.literal("system")
      ),
      defaultView: v.union(
        v.literal("dashboard"),
        v.literal("kanban"),
        v.literal("timeline")
      ),
      notificationsEnabled: v.boolean(),
    }),
  },
  handler: async (ctx, { userId, preferences }) => {
    await ctx.db.patch(userId, { preferences });
  },
});
