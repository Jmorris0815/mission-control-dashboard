import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("companies").collect();
  },
});

export const get = query({
  args: { id: v.id("companies") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getByOwner = query({
  args: { ownerId: v.id("users") },
  handler: async (ctx, { ownerId }) => {
    return await ctx.db
      .query("companies")
      .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
      .collect();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    color: v.string(),
    industry: v.optional(v.string()),
    status: v.union(
      v.literal("ideation"),
      v.literal("building"),
      v.literal("launched"),
      v.literal("scaling"),
      v.literal("paused"),
      v.literal("archived")
    ),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const companies = await ctx.db.query("companies").collect();
    const now = Date.now();
    const id = await ctx.db.insert("companies", {
      ...args,
      sortOrder: companies.length,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("activities", {
      type: "company_created",
      companyId: id,
      userId: args.ownerId,
      message: `New company "${args.name}" created`,
      createdAt: now,
    });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    industry: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("ideation"),
        v.literal("building"),
        v.literal("launched"),
        v.literal("scaling"),
        v.literal("paused"),
        v.literal("archived")
      )
    ),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(id, { ...filtered, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id);
  },
});
