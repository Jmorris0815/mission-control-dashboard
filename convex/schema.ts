import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("viewer")),
    preferences: v.optional(
      v.object({
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
      })
    ),
    lastActiveAt: v.number(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  companies: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
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
    metadata: v.optional(
      v.object({
        website: v.optional(v.string()),
        revenue: v.optional(v.string()),
        stage: v.optional(v.string()),
        notes: v.optional(v.string()),
      })
    ),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  agents: defineTable({
    name: v.string(),
    role: v.string(),
    roleTitle: v.optional(v.string()),
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
    currentTaskId: v.optional(v.id("tasks")),
    currentTaskTitle: v.optional(v.string()),
    personality: v.optional(v.string()),
    lastHeartbeat: v.optional(v.number()),
    lastAction: v.optional(v.string()),
    lastStatusChange: v.optional(v.number()),
    tasksCompletedToday: v.optional(v.number()),
    totalTasksCompleted: v.number(),
    totalTokensUsed: v.optional(v.number()),
    openclawSessionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_name", ["name"]),

  tasks: defineTable({
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
    createdByAgentId: v.optional(v.id("agents")),
    createdByUserId: v.optional(v.id("users")),
    parentTaskId: v.optional(v.id("tasks")),
    tags: v.array(v.string()),
    dueDate: v.optional(v.number()),
    estimatedMinutes: v.optional(v.number()),
    actualMinutes: v.optional(v.number()),
    sortOrder: v.number(),
    deliverables: v.optional(
      v.array(
        v.object({
          type: v.string(),
          name: v.string(),
          path: v.optional(v.string()),
          url: v.optional(v.string()),
        })
      )
    ),
    metadata: v.optional(v.any()),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"])
    .index("by_agent", ["assignedAgentId"])
    .index("by_priority", ["priority"])
    .index("by_company_status", ["companyId", "status"])
    .index("by_parent", ["parentTaskId"]),

  comments: defineTable({
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
    reactions: v.optional(
      v.array(
        v.object({
          emoji: v.string(),
          agentId: v.optional(v.id("agents")),
          userId: v.optional(v.id("users")),
        })
      )
    ),
    createdAt: v.number(),
  })
    .index("by_task", ["taskId"])
    .index("by_parent", ["parentCommentId"]),

  activities: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_type", ["type"])
    .index("by_created", ["createdAt"])
    .index("by_agent", ["agentId"]),

  documents: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    type: v.union(
      v.literal("document"),
      v.literal("code"),
      v.literal("research"),
      v.literal("report"),
      v.literal("template"),
      v.literal("other")
    ),
    companyId: v.id("companies"),
    taskId: v.optional(v.id("tasks")),
    createdByAgentId: v.optional(v.id("agents")),
    fileUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_task", ["taskId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("mention"),
      v.literal("task_complete"),
      v.literal("agent_error"),
      v.literal("blocker"),
      v.literal("approval_needed"),
      v.literal("milestone"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),

  missions: defineTable({
    title: v.string(),
    description: v.string(),
    companyId: v.id("companies"),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused")
    ),
    progress: v.number(),
    linkedTaskIds: v.array(v.id("tasks")),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_company", ["companyId"])
    .index("by_status", ["status"]),
});
