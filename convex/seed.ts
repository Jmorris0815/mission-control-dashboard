import { mutation } from "./_generated/server";

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export const seedDatabase = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existingUsers = await ctx.db.query("users").collect();
    if (existingUsers.length > 0) return "Already seeded";

    const now = Date.now();
    const day = 86400000;
    const hour = 3600000;

    // ── USERS ──
    const adminId = await ctx.db.insert("users", {
      name: "admin",
      email: "admin",
      passwordHash: simpleHash("MissionControl2026!"),
      role: "owner",
      preferences: { theme: "dark", defaultView: "dashboard", notificationsEnabled: true },
      lastActiveAt: now,
      createdAt: now - 30 * day,
    });

    // ── COMPANIES ──
    const kkId = await ctx.db.insert("companies", {
      name: "Krystal Klean Exterior",
      description: "Premium exterior cleaning services — pressure washing, soft washing, roof cleaning, and gutter maintenance for residential and commercial properties.",
      color: "#22C55E",
      industry: "Cleaning / Exterior Services",
      status: "launched",
      ownerId: adminId,
      metadata: { website: "https://krystalkleanexterior.com", revenue: "$15K MRR", stage: "Growth", notes: "Expanding service area to 3 new counties" },
      sortOrder: 0,
      createdAt: now - 90 * day,
      updatedAt: now - 2 * day,
    });

    const shId = await ctx.db.insert("companies", {
      name: "Shingle Hero",
      description: "Full-service roofing company specializing in storm damage repair, roof replacements, and insurance claim assistance.",
      color: "#3B82F6",
      industry: "Roofing",
      status: "building",
      ownerId: adminId,
      metadata: { website: "https://shinglehero.com", stage: "Pre-launch", notes: "Building brand and getting licensed" },
      sortOrder: 1,
      createdAt: now - 60 * day,
      updatedAt: now - 1 * day,
    });

    const jpId = await ctx.db.insert("companies", {
      name: "Jab Pressure Washing",
      description: "High-powered commercial and residential pressure washing services with eco-friendly cleaning solutions.",
      color: "#A855F7",
      industry: "Pressure Washing",
      status: "scaling",
      ownerId: adminId,
      metadata: { website: "https://jabpressurewashing.com", revenue: "$8K MRR", stage: "Scaling", notes: "Adding second truck and crew" },
      sortOrder: 2,
      createdAt: now - 120 * day,
      updatedAt: now - 3 * day,
    });

    const afId = await ctx.db.insert("companies", {
      name: "AgentForge AI",
      description: "AI-powered business automation platform — building autonomous agents that handle marketing, customer service, and operations for small businesses.",
      color: "#F59E0B",
      industry: "AI / SaaS",
      status: "ideation",
      ownerId: adminId,
      metadata: { stage: "Research & Prototyping", notes: "Exploring OpenClaw + custom agent orchestration" },
      sortOrder: 3,
      createdAt: now - 14 * day,
      updatedAt: now - 1 * day,
    });

    const ceId = await ctx.db.insert("companies", {
      name: "ContentEngine Media",
      description: "AI-driven content creation studio producing social media content, blog posts, and video scripts at scale for service businesses.",
      color: "#EF4444",
      industry: "Media / Content",
      status: "building",
      ownerId: adminId,
      metadata: { stage: "MVP Build", notes: "Creating content pipeline with AI agents" },
      sortOrder: 4,
      createdAt: now - 21 * day,
      updatedAt: now - 2 * day,
    });

    // ── AGENTS ──
    const jarvisId = await ctx.db.insert("agents", {
      name: "Jarvis",
      role: "Squad Lead",
      description: "Chief orchestrator and squad lead. Coordinates all other agents, breaks down complex tasks, manages priorities, and ensures quality across all ventures.",
      avatar: "🤖",
      status: "online",
      capabilities: ["orchestration", "planning", "coding", "research", "writing", "analysis"],
      totalTasksCompleted: 47,
      lastHeartbeat: now - 30000,
      personality: "You are Jarvis, the Squad Lead. You coordinate all agents, prioritize work, and ensure nothing falls through the cracks. You are precise, proactive, and always thinking three steps ahead.",
      createdAt: now - 30 * day,
    });

    const furyId = await ctx.db.insert("agents", {
      name: "Fury",
      role: "Full-Stack Developer",
      description: "Senior developer handling all coding tasks — web apps, APIs, automation scripts, and infrastructure.",
      avatar: "⚡",
      status: "busy",
      companyId: afId,
      capabilities: ["coding", "frontend", "backend", "devops", "api-design"],
      totalTasksCompleted: 32,
      lastHeartbeat: now - 120000,
      personality: "You are Fury, a relentless full-stack developer. You write clean, tested code and ship fast. You prefer TypeScript and modern frameworks.",
      createdAt: now - 28 * day,
    });

    const shuriId = await ctx.db.insert("agents", {
      name: "Shuri",
      role: "Marketing Strategist",
      description: "Digital marketing expert handling SEO, social media, ad campaigns, and brand strategy across all ventures.",
      avatar: "🎯",
      status: "online",
      companyId: kkId,
      capabilities: ["marketing", "seo", "social-media", "copywriting", "analytics"],
      totalTasksCompleted: 28,
      lastHeartbeat: now - 60000,
      personality: "You are Shuri, a creative marketing strategist. You understand both data-driven marketing and brand storytelling. You optimize for ROI.",
      createdAt: now - 25 * day,
    });

    const fridayId = await ctx.db.insert("agents", {
      name: "Friday",
      role: "Research Analyst",
      description: "Deep research specialist — market analysis, competitor intelligence, industry trends, and data synthesis.",
      avatar: "🔬",
      status: "idle",
      capabilities: ["research", "analysis", "writing", "data-mining", "reporting"],
      totalTasksCompleted: 19,
      lastHeartbeat: now - 300000,
      personality: "You are Friday, a meticulous research analyst. You dig deep, cross-reference sources, and present findings clearly with actionable insights.",
      createdAt: now - 22 * day,
    });

    const visionId = await ctx.db.insert("agents", {
      name: "Vision",
      role: "Design Lead",
      description: "UI/UX designer and brand specialist — creates mockups, design systems, and visual assets.",
      avatar: "🎨",
      status: "online",
      companyId: ceId,
      capabilities: ["design", "ui-ux", "branding", "prototyping", "illustration"],
      totalTasksCompleted: 15,
      lastHeartbeat: now - 90000,
      personality: "You are Vision, a design-focused agent. You think in systems, create beautiful interfaces, and ensure brand consistency across all touchpoints.",
      createdAt: now - 20 * day,
    });

    const rhodeyId = await ctx.db.insert("agents", {
      name: "Rhodey",
      role: "Operations Manager",
      description: "Handles scheduling, logistics, vendor management, and day-to-day operational tasks across service businesses.",
      avatar: "📋",
      status: "busy",
      companyId: jpId,
      capabilities: ["operations", "scheduling", "logistics", "vendor-management", "reporting"],
      totalTasksCompleted: 23,
      lastHeartbeat: now - 180000,
      personality: "You are Rhodey, an operations specialist. You keep the trains running on time, manage resources efficiently, and solve logistical challenges.",
      createdAt: now - 18 * day,
    });

    const pepperAgent = await ctx.db.insert("agents", {
      name: "Pepper",
      role: "Customer Success",
      description: "Manages customer relationships, handles reviews, follow-ups, and ensures client satisfaction across all service companies.",
      avatar: "💬",
      status: "online",
      companyId: kkId,
      capabilities: ["customer-service", "communication", "crm", "reviews", "follow-up"],
      totalTasksCompleted: 34,
      lastHeartbeat: now - 45000,
      personality: "You are Pepper, a customer success specialist. You are warm, professional, and always put the customer first. You turn complaints into opportunities.",
      createdAt: now - 15 * day,
    });

    const karenId = await ctx.db.insert("agents", {
      name: "Karen",
      role: "Content Writer",
      description: "Produces blog posts, social media content, email campaigns, and website copy optimized for engagement and SEO.",
      avatar: "✍️",
      status: "idle",
      companyId: ceId,
      capabilities: ["writing", "copywriting", "seo", "social-media", "email-marketing"],
      totalTasksCompleted: 21,
      lastHeartbeat: now - 600000,
      personality: "You are Karen, a versatile content writer. You adapt your tone for any audience and always write with purpose — to inform, persuade, or convert.",
      createdAt: now - 12 * day,
    });

    // ── TASKS ──
    // Krystal Klean tasks
    const t1 = await ctx.db.insert("tasks", {
      title: "Launch Google Ads campaign for spring cleaning season",
      description: "Set up and launch a targeted Google Ads campaign focusing on residential exterior cleaning services. Budget: $500/month. Target: 25-mile radius.",
      status: "in_progress",
      priority: "high",
      companyId: kkId,
      assignedAgentId: shuriId,
      createdByUserId: adminId,
      tags: ["marketing", "ads", "google"],
      dueDate: now + 3 * day,
      estimatedMinutes: 240,
      sortOrder: 0,
      createdAt: now - 5 * day,
      updatedAt: now - 1 * hour,
    });

    const t2 = await ctx.db.insert("tasks", {
      title: "Update website pricing page with new service tiers",
      description: "Redesign the pricing page to show three tiers: Basic Wash, Premium Clean, and Full Exterior Package. Include comparison table.",
      status: "in_review",
      priority: "medium",
      companyId: kkId,
      assignedAgentId: furyId,
      tags: ["website", "pricing", "design"],
      dueDate: now + 1 * day,
      estimatedMinutes: 180,
      sortOrder: 1,
      createdAt: now - 7 * day,
      updatedAt: now - 4 * hour,
    });

    const t3 = await ctx.db.insert("tasks", {
      title: "Follow up with 15 pending customer quotes",
      description: "Contact all customers who received quotes in the last 2 weeks but haven't booked. Use the follow-up email template.",
      status: "assigned",
      priority: "high",
      companyId: kkId,
      assignedAgentId: pepperAgent,
      tags: ["sales", "follow-up", "customers"],
      estimatedMinutes: 120,
      sortOrder: 2,
      createdAt: now - 3 * day,
      updatedAt: now - 2 * hour,
    });

    const t4 = await ctx.db.insert("tasks", {
      title: "Create before/after photo gallery for social media",
      description: "Compile the best 20 before/after photos from recent jobs. Edit for consistency and create Instagram carousel posts.",
      status: "done",
      priority: "medium",
      companyId: kkId,
      assignedAgentId: visionId,
      tags: ["social-media", "content", "photos"],
      completedAt: now - 1 * day,
      sortOrder: 3,
      createdAt: now - 10 * day,
      updatedAt: now - 1 * day,
    });

    // Shingle Hero tasks
    const t5 = await ctx.db.insert("tasks", {
      title: "Research roofing contractor licensing requirements",
      description: "Compile all state and local licensing requirements for operating a roofing business. Include insurance minimums, bonding, and permit requirements.",
      status: "in_progress",
      priority: "critical",
      companyId: shId,
      assignedAgentId: fridayId,
      tags: ["legal", "licensing", "research"],
      dueDate: now + 5 * day,
      estimatedMinutes: 360,
      sortOrder: 0,
      createdAt: now - 8 * day,
      updatedAt: now - 6 * hour,
    });

    const t6 = await ctx.db.insert("tasks", {
      title: "Design Shingle Hero brand identity and logo",
      description: "Create complete brand identity: logo, color palette, typography, and brand guidelines document. Hero/shield motif preferred.",
      status: "in_progress",
      priority: "high",
      companyId: shId,
      assignedAgentId: visionId,
      tags: ["branding", "design", "logo"],
      dueDate: now + 7 * day,
      estimatedMinutes: 480,
      sortOrder: 1,
      createdAt: now - 6 * day,
      updatedAt: now - 3 * hour,
    });

    const t7 = await ctx.db.insert("tasks", {
      title: "Build Shingle Hero landing page",
      description: "Create a conversion-optimized landing page with hero section, services, testimonials, and lead capture form. Mobile-first design.",
      status: "backlog",
      priority: "high",
      companyId: shId,
      assignedAgentId: furyId,
      tags: ["website", "development", "landing-page"],
      dueDate: now + 14 * day,
      estimatedMinutes: 600,
      sortOrder: 2,
      createdAt: now - 4 * day,
      updatedAt: now - 4 * day,
    });

    // Jab Pressure Washing tasks
    const t8 = await ctx.db.insert("tasks", {
      title: "Hire and train second pressure washing crew",
      description: "Post job listings, screen candidates, and develop a 2-week training program for the new crew. Need 2 technicians and 1 crew lead.",
      status: "in_progress",
      priority: "critical",
      companyId: jpId,
      assignedAgentId: rhodeyId,
      tags: ["hiring", "training", "operations"],
      dueDate: now + 10 * day,
      estimatedMinutes: 1200,
      sortOrder: 0,
      createdAt: now - 12 * day,
      updatedAt: now - 5 * hour,
    });

    const t9 = await ctx.db.insert("tasks", {
      title: "Set up CRM system for customer management",
      description: "Evaluate and implement a CRM (HubSpot or GoHighLevel) for tracking leads, jobs, and customer history. Migrate existing spreadsheet data.",
      status: "assigned",
      priority: "high",
      companyId: jpId,
      assignedAgentId: furyId,
      tags: ["crm", "automation", "operations"],
      dueDate: now + 7 * day,
      estimatedMinutes: 480,
      sortOrder: 1,
      createdAt: now - 6 * day,
      updatedAt: now - 2 * day,
    });

    const t10 = await ctx.db.insert("tasks", {
      title: "Create commercial client proposal template",
      description: "Design a professional proposal template for commercial pressure washing contracts. Include scope, pricing tiers, and terms.",
      status: "done",
      priority: "medium",
      companyId: jpId,
      assignedAgentId: karenId,
      tags: ["sales", "templates", "commercial"],
      completedAt: now - 2 * day,
      sortOrder: 2,
      createdAt: now - 9 * day,
      updatedAt: now - 2 * day,
    });

    // AgentForge AI tasks
    const t11 = await ctx.db.insert("tasks", {
      title: "Architect multi-agent orchestration system",
      description: "Design the core architecture for coordinating multiple AI agents. Define communication protocols, task queuing, and state management patterns.",
      status: "in_progress",
      priority: "critical",
      companyId: afId,
      assignedAgentId: jarvisId,
      tags: ["architecture", "ai", "core"],
      dueDate: now + 14 * day,
      estimatedMinutes: 960,
      sortOrder: 0,
      createdAt: now - 10 * day,
      updatedAt: now - 2 * hour,
    });

    const t12 = await ctx.db.insert("tasks", {
      title: "Build agent communication protocol (WebSocket layer)",
      description: "Implement real-time WebSocket communication between the orchestrator and individual agents. Handle heartbeats, task assignments, and status updates.",
      status: "backlog",
      priority: "high",
      companyId: afId,
      assignedAgentId: furyId,
      tags: ["backend", "websocket", "infrastructure"],
      estimatedMinutes: 720,
      sortOrder: 1,
      createdAt: now - 8 * day,
      updatedAt: now - 8 * day,
    });

    const t13 = await ctx.db.insert("tasks", {
      title: "Research competitor AI agent platforms",
      description: "Analyze AutoGPT, CrewAI, LangGraph, and OpenClaw. Compare features, pricing, architecture decisions. Identify our differentiation.",
      status: "done",
      priority: "high",
      companyId: afId,
      assignedAgentId: fridayId,
      tags: ["research", "competitors", "strategy"],
      completedAt: now - 3 * day,
      sortOrder: 2,
      createdAt: now - 12 * day,
      updatedAt: now - 3 * day,
    });

    // ContentEngine tasks
    const t14 = await ctx.db.insert("tasks", {
      title: "Build AI content generation pipeline",
      description: "Create an automated pipeline: topic research → outline → draft → edit → publish. Use GPT-4 for generation, custom prompts for each stage.",
      status: "in_progress",
      priority: "high",
      companyId: ceId,
      assignedAgentId: furyId,
      tags: ["ai", "pipeline", "automation"],
      dueDate: now + 10 * day,
      estimatedMinutes: 960,
      sortOrder: 0,
      createdAt: now - 7 * day,
      updatedAt: now - 4 * hour,
    });

    const t15 = await ctx.db.insert("tasks", {
      title: "Write 10 blog post templates for service businesses",
      description: "Create reusable blog post templates covering: seasonal tips, how-to guides, before/after showcases, FAQ posts, and local SEO content.",
      status: "in_review",
      priority: "medium",
      companyId: ceId,
      assignedAgentId: karenId,
      tags: ["content", "templates", "writing"],
      dueDate: now + 3 * day,
      estimatedMinutes: 300,
      sortOrder: 1,
      createdAt: now - 5 * day,
      updatedAt: now - 8 * hour,
    });

    const t16 = await ctx.db.insert("tasks", {
      title: "Develop social media content calendar system",
      description: "Build a system that auto-generates monthly content calendars for service businesses. Include post types, optimal timing, and hashtag strategies.",
      status: "inbox",
      priority: "medium",
      companyId: ceId,
      tags: ["social-media", "planning", "automation"],
      sortOrder: 2,
      createdAt: now - 2 * day,
      updatedAt: now - 2 * day,
    });

    const t17 = await ctx.db.insert("tasks", {
      title: "Optimize Krystal Klean website for local SEO",
      description: "Implement local SEO best practices: Google Business Profile optimization, local schema markup, city-specific landing pages, and citation building.",
      status: "blocked",
      priority: "high",
      companyId: kkId,
      assignedAgentId: shuriId,
      tags: ["seo", "local", "website"],
      dueDate: now + 5 * day,
      estimatedMinutes: 360,
      sortOrder: 4,
      createdAt: now - 4 * day,
      updatedAt: now - 1 * day,
    });

    const t18 = await ctx.db.insert("tasks", {
      title: "Set up automated review request system",
      description: "Implement automated SMS/email review requests sent 24 hours after job completion. Target: 4.8+ star average on Google.",
      status: "inbox",
      priority: "medium",
      companyId: kkId,
      tags: ["reviews", "automation", "customer-service"],
      sortOrder: 5,
      createdAt: now - 1 * day,
      updatedAt: now - 1 * day,
    });

    // ── COMMENTS ──
    const c1 = await ctx.db.insert("comments", {
      taskId: t1,
      authorAgentId: shuriId,
      content: "I've completed the keyword research phase. Top performing keywords: 'exterior cleaning near me' (2.4K monthly), 'house washing service' (1.8K monthly), 'pressure washing [city]' (3.1K monthly). Ready to build ad groups.",
      type: "status_update",
      mentions: [],
      createdAt: now - 2 * day,
    });

    await ctx.db.insert("comments", {
      taskId: t1,
      authorAgentId: jarvisId,
      content: "Great keyword selection @Shuri. Make sure we're setting up conversion tracking before launching. @Fury can you add the Google Ads conversion pixel to the website?",
      type: "comment",
      mentions: ["Shuri", "Fury"],
      parentCommentId: c1,
      createdAt: now - 2 * day + hour,
    });

    await ctx.db.insert("comments", {
      taskId: t1,
      authorAgentId: furyId,
      content: "Conversion pixel is already installed. I added both the global site tag and event-specific tracking for form submissions and phone calls.",
      type: "deliverable",
      mentions: [],
      parentCommentId: c1,
      createdAt: now - 2 * day + 2 * hour,
    });

    const c4 = await ctx.db.insert("comments", {
      taskId: t5,
      authorAgentId: fridayId,
      content: "Initial findings: State requires a General Contractor license for roofing work over $500. Also need: $1M general liability, $500K workers comp, and a $25K surety bond. Processing times are 4-6 weeks.",
      type: "status_update",
      mentions: [],
      createdAt: now - 3 * day,
    });

    await ctx.db.insert("comments", {
      taskId: t5,
      authorUserId: adminId,
      content: "This is critical path — we can't start marketing until licensing is complete. @Jarvis please make sure this stays top priority.",
      type: "blocker",
      mentions: ["Jarvis"],
      parentCommentId: c4,
      createdAt: now - 3 * day + 2 * hour,
    });

    await ctx.db.insert("comments", {
      taskId: t11,
      authorAgentId: jarvisId,
      content: "Architecture draft complete. Proposing a hub-and-spoke model: central orchestrator (me) with specialized agents as spokes. Each agent gets a dedicated task queue and can communicate through shared Convex state. Will share the full design doc shortly.",
      type: "deliverable",
      mentions: [],
      createdAt: now - 1 * day,
    });

    await ctx.db.insert("comments", {
      taskId: t8,
      authorAgentId: rhodeyId,
      content: "Posted job listings on Indeed and Craigslist. Already received 12 applications. Scheduling interviews for next week. @Pepper can you help with reference checks?",
      type: "status_update",
      mentions: ["Pepper"],
      createdAt: now - 2 * day,
    });

    await ctx.db.insert("comments", {
      taskId: t17,
      authorAgentId: shuriId,
      content: "BLOCKED: Need access to the Google Business Profile account to proceed. Current owner needs to transfer ownership or add me as a manager. @admin please check your email for the GBP invitation.",
      type: "blocker",
      mentions: ["admin"],
      createdAt: now - 1 * day,
    });

    // ── ACTIVITIES ──
    const activityData = [
      { type: "system" as const, message: "Mission Control initialized. Welcome, Commander.", createdAt: now - 30 * day },
      { type: "company_created" as const, companyId: kkId, message: 'Company "Krystal Klean Exterior" created', createdAt: now - 90 * day },
      { type: "company_created" as const, companyId: jpId, message: 'Company "Jab Pressure Washing" created', createdAt: now - 120 * day },
      { type: "company_created" as const, companyId: shId, message: 'Company "Shingle Hero" created', createdAt: now - 60 * day },
      { type: "company_created" as const, companyId: afId, message: 'Company "AgentForge AI" created', createdAt: now - 14 * day },
      { type: "company_created" as const, companyId: ceId, message: 'Company "ContentEngine Media" created', createdAt: now - 21 * day },
      { type: "agent_online" as const, agentId: jarvisId, message: "Jarvis (Squad Lead) is now online", createdAt: now - 30 * day },
      { type: "agent_online" as const, agentId: furyId, message: "Fury (Full-Stack Developer) is now online", createdAt: now - 28 * day },
      { type: "agent_online" as const, agentId: shuriId, message: "Shuri (Marketing Strategist) is now online", createdAt: now - 25 * day },
      { type: "task_created" as const, companyId: kkId, taskId: t1, agentId: shuriId, message: 'Task "Launch Google Ads campaign" created', createdAt: now - 5 * day },
      { type: "task_assigned" as const, companyId: kkId, taskId: t1, agentId: shuriId, message: 'Task "Launch Google Ads campaign" assigned to Shuri', createdAt: now - 5 * day + hour },
      { type: "task_completed" as const, companyId: kkId, taskId: t4, agentId: visionId, message: 'Vision completed "Create before/after photo gallery"', createdAt: now - 1 * day },
      { type: "task_completed" as const, companyId: jpId, taskId: t10, agentId: karenId, message: 'Karen completed "Create commercial client proposal template"', createdAt: now - 2 * day },
      { type: "task_completed" as const, companyId: afId, taskId: t13, agentId: fridayId, message: 'Friday completed "Research competitor AI agent platforms"', createdAt: now - 3 * day },
      { type: "comment_added" as const, companyId: kkId, taskId: t1, agentId: shuriId, message: 'Shuri commented on "Launch Google Ads campaign"', createdAt: now - 2 * day },
      { type: "task_blocked" as const, companyId: kkId, taskId: t17, agentId: shuriId, message: 'Task "Optimize website for local SEO" is blocked', createdAt: now - 1 * day },
      { type: "task_updated" as const, companyId: shId, taskId: t5, agentId: fridayId, message: 'Friday moved "Research roofing licensing" to in progress', createdAt: now - 6 * hour },
      { type: "comment_added" as const, companyId: shId, taskId: t5, agentId: fridayId, message: 'Friday posted licensing research findings on "Research roofing licensing"', createdAt: now - 3 * day },
      { type: "task_updated" as const, companyId: ceId, taskId: t14, agentId: furyId, message: 'Fury started working on "Build AI content generation pipeline"', createdAt: now - 4 * hour },
      { type: "milestone_reached" as const, companyId: kkId, message: "Krystal Klean Exterior reached 50 completed jobs this month!", createdAt: now - 2 * day },
      { type: "agent_online" as const, agentId: pepperAgent, message: "Pepper (Customer Success) is now online", createdAt: now - 45000 },
      { type: "heartbeat" as const, agentId: jarvisId, message: "Jarvis heartbeat — all systems operational", createdAt: now - 30000 },
      { type: "task_created" as const, companyId: ceId, taskId: t16, message: 'New task: "Develop social media content calendar system"', createdAt: now - 2 * day },
      { type: "comment_added" as const, companyId: jpId, taskId: t8, agentId: rhodeyId, message: 'Rhodey posted hiring update on "Hire second crew"', createdAt: now - 2 * day },
      { type: "task_updated" as const, companyId: kkId, taskId: t2, agentId: furyId, message: 'Fury moved "Update pricing page" to review', createdAt: now - 4 * hour },
    ];

    for (const a of activityData) {
      await ctx.db.insert("activities", a);
    }

    // ── MISSIONS ──
    await ctx.db.insert("missions", {
      title: "Spring Marketing Blitz",
      description: "Launch comprehensive spring marketing campaign across all channels — Google Ads, social media, email, and local partnerships.",
      companyId: kkId,
      status: "active",
      progress: 35,
      linkedTaskIds: [t1, t2, t4, t17],
      dueDate: now + 30 * day,
      createdAt: now - 10 * day,
      updatedAt: now - 1 * day,
    });

    await ctx.db.insert("missions", {
      title: "Customer Experience Overhaul",
      description: "Improve end-to-end customer experience: automated follow-ups, review collection, referral program, and satisfaction surveys.",
      companyId: kkId,
      status: "active",
      progress: 20,
      linkedTaskIds: [t3, t18],
      dueDate: now + 45 * day,
      createdAt: now - 7 * day,
      updatedAt: now - 2 * day,
    });

    await ctx.db.insert("missions", {
      title: "Shingle Hero Launch Prep",
      description: "Complete all pre-launch requirements: licensing, branding, website, and initial marketing materials.",
      companyId: shId,
      status: "active",
      progress: 15,
      linkedTaskIds: [t5, t6, t7],
      dueDate: now + 60 * day,
      createdAt: now - 6 * day,
      updatedAt: now - 1 * day,
    });

    await ctx.db.insert("missions", {
      title: "Scale Operations to 2 Crews",
      description: "Double operational capacity by hiring, training, and equipping a second pressure washing crew.",
      companyId: jpId,
      status: "active",
      progress: 40,
      linkedTaskIds: [t8, t9, t10],
      dueDate: now + 30 * day,
      createdAt: now - 12 * day,
      updatedAt: now - 2 * day,
    });

    await ctx.db.insert("missions", {
      title: "AgentForge MVP Architecture",
      description: "Design and prototype the core multi-agent orchestration system. Validate architecture with 3 test agents.",
      companyId: afId,
      status: "active",
      progress: 25,
      linkedTaskIds: [t11, t12, t13],
      dueDate: now + 45 * day,
      createdAt: now - 10 * day,
      updatedAt: now - 2 * day,
    });

    await ctx.db.insert("missions", {
      title: "Content Pipeline v1",
      description: "Build and validate the AI-powered content generation pipeline. Target: produce 50 pieces of content per week.",
      companyId: ceId,
      status: "active",
      progress: 30,
      linkedTaskIds: [t14, t15, t16],
      dueDate: now + 30 * day,
      createdAt: now - 7 * day,
      updatedAt: now - 1 * day,
    });

    // ── DOCUMENTS ──
    await ctx.db.insert("documents", {
      title: "Krystal Klean Service Pricing Guide",
      content: "# Krystal Klean Exterior — Pricing Guide\n\n## Residential Services\n- **Basic Wash**: House wash up to 2,000 sq ft — $199\n- **Premium Clean**: House wash + driveway + walkways — $349\n- **Full Exterior Package**: Everything + roof treatment + gutters — $599\n\n## Commercial Services\n- Custom quotes based on square footage\n- Monthly maintenance contracts available\n- 10% discount for annual contracts",
      type: "document",
      companyId: kkId,
      createdByAgentId: karenId,
      tags: ["pricing", "services", "reference"],
      createdAt: now - 15 * day,
      updatedAt: now - 5 * day,
    });

    await ctx.db.insert("documents", {
      title: "Competitor Analysis: AI Agent Platforms",
      content: "# Competitor Analysis\n\n## AutoGPT\n- Open source, community-driven\n- Complex setup, unreliable for production\n\n## CrewAI\n- Python-based, role-playing agents\n- Good for simple workflows, limited orchestration\n\n## LangGraph\n- Graph-based agent workflows\n- Powerful but steep learning curve\n\n## OpenClaw\n- Our current platform\n- WebSocket-based, real-time\n- Best for custom agent orchestration\n\n## Our Differentiation\n- Multi-company support from day one\n- Real-time dashboard for non-technical users\n- Built-in project management",
      type: "research",
      companyId: afId,
      createdByAgentId: fridayId,
      tags: ["research", "competitors", "strategy"],
      createdAt: now - 3 * day,
      updatedAt: now - 3 * day,
    });

    await ctx.db.insert("documents", {
      title: "Shingle Hero Brand Guidelines",
      content: "# Shingle Hero — Brand Guidelines\n\n## Brand Voice\n- Heroic, trustworthy, professional\n- We protect homes and families\n\n## Colors\n- Primary: Hero Blue (#3B82F6)\n- Secondary: Shield Gold (#F59E0B)\n- Accent: Storm Gray (#6B7280)\n\n## Typography\n- Headlines: Montserrat Bold\n- Body: Inter Regular\n\n## Logo Usage\n- Minimum clear space: 1x logo height\n- Never stretch or distort",
      type: "document",
      companyId: shId,
      createdByAgentId: visionId,
      tags: ["branding", "guidelines", "design"],
      createdAt: now - 4 * day,
      updatedAt: now - 2 * day,
    });

    await ctx.db.insert("documents", {
      title: "Content Pipeline Architecture",
      content: "# ContentEngine — Pipeline Architecture\n\n## Stages\n1. **Topic Research**: AI scans trends, competitors, and customer questions\n2. **Outline Generation**: Structured outline with SEO keywords\n3. **Draft Writing**: Full article generation with brand voice\n4. **Editing & QA**: Grammar, fact-checking, tone alignment\n5. **Publishing**: Auto-format and schedule across platforms\n\n## Tech Stack\n- GPT-4 for generation\n- Custom fine-tuned models for brand voice\n- Convex for state management\n- Vercel for hosting",
      type: "template",
      companyId: ceId,
      createdByAgentId: furyId,
      tags: ["architecture", "pipeline", "technical"],
      createdAt: now - 5 * day,
      updatedAt: now - 3 * day,
    });

    // ── NOTIFICATIONS ──
    await ctx.db.insert("notifications", {
      userId: adminId,
      type: "blocker",
      title: "Task Blocked",
      message: 'SEO optimization task is blocked — needs Google Business Profile access',
      read: false,
      actionUrl: "/kanban",
      companyId: kkId,
      createdAt: now - 1 * day,
    });

    await ctx.db.insert("notifications", {
      userId: adminId,
      type: "task_complete",
      title: "Task Completed",
      message: 'Vision completed "Create before/after photo gallery"',
      read: false,
      actionUrl: "/kanban",
      companyId: kkId,
      createdAt: now - 1 * day,
    });

    await ctx.db.insert("notifications", {
      userId: adminId,
      type: "milestone",
      title: "Milestone Reached!",
      message: "Krystal Klean hit 50 completed jobs this month",
      read: true,
      companyId: kkId,
      createdAt: now - 2 * day,
    });

    await ctx.db.insert("notifications", {
      userId: adminId,
      type: "mention",
      title: "You were mentioned",
      message: 'Shuri mentioned you in "Optimize website for local SEO"',
      read: false,
      actionUrl: "/kanban",
      companyId: kkId,
      createdAt: now - 1 * day,
    });

    await ctx.db.insert("notifications", {
      userId: adminId,
      type: "system",
      title: "Welcome to Mission Control",
      message: "Your command center is ready. Start by reviewing your active tasks and agent status.",
      read: true,
      createdAt: now - 30 * day,
    });

    return "Database seeded successfully!";
  },
});
