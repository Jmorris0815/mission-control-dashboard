import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const VALID_ROLES = ["squad_lead", "specialist", "support"] as const;
const VALID_STATUSES = ["online", "busy", "idle", "offline", "error"] as const;

type AgentStatus = (typeof VALID_STATUSES)[number];

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (searchParams.get("token") !== API_TOKEN) {
    return jsonResponse(
      { success: false, error: "Unauthorized. Provide ?token=mc-api-2026-krystalklean" },
      401
    );
  }

  // ── Required ──────────────────────────────────────────────────────────────
  const name = searchParams.get("name")?.trim();
  if (!name) {
    return jsonResponse(
      { success: false, error: "Missing required parameter: name" },
      400
    );
  }

  // ── Optional with defaults ────────────────────────────────────────────────
  const rawRole = searchParams.get("role") || "specialist";
  const role = VALID_ROLES.includes(rawRole as any) ? rawRole : "specialist";

  const rawStatus = (searchParams.get("status") || "idle").toLowerCase();
  const status: AgentStatus = VALID_STATUSES.includes(rawStatus as AgentStatus)
    ? (rawStatus as AgentStatus)
    : "idle";

  const description =
    searchParams.get("description") || `${name} — AI agent`;

  const color = searchParams.get("color") || "#3b82f6";

  // Role title — the human-readable title (e.g. "Marketing", "AI Chief of Staff")
  const roleTitle = searchParams.get("roleTitle") || searchParams.get("title") || undefined;

  // Current task title
  const currentTaskTitle = searchParams.get("currentTask") || undefined;

  // Last action
  const lastAction = searchParams.get("lastAction") || undefined;

  // Specialties: comma-separated string → array
  const specialtiesRaw = searchParams.get("specialties") || "";
  const capabilities = specialtiesRaw
    ? specialtiesRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const companyParam = searchParams.get("company") || "all";

  // ── Convex ────────────────────────────────────────────────────────────────
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    // Check for duplicate name
    const existing = await client.query(api.agents.list);
    const duplicate = existing.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      return jsonResponse(
        {
          success: false,
          error: `An agent named "${name}" already exists (id: ${duplicate._id}). Use /api/agents/update to modify it.`,
        },
        409
      );
    }

    // Resolve companyId if specified
    let companyId: string | undefined;
    if (companyParam !== "all") {
      const companies = await client.query(api.companies.list);
      const match = companies.find(
        (c) =>
          c.name.toLowerCase() === companyParam.toLowerCase() ||
          c.name.toLowerCase().includes(companyParam.toLowerCase())
      );
      if (match) companyId = match._id;
    }

    const agentId = await client.mutation(api.agents.create, {
      name,
      role,
      roleTitle,
      description,
      avatar: color,
      status,
      companyId: companyId as any,
      capabilities,
      currentTaskTitle,
      lastAction,
    });

    return jsonResponse({
      success: true,
      agentId,
      message: `Agent "${name}" created successfully`,
      agent: {
        id: agentId,
        name,
        role,
        roleTitle,
        status,
        description,
        color,
        capabilities,
        company: companyParam,
        createdAt: new Date().toISOString(),
      },
      dashboard: "https://mission-control-dashboard-plum-two.vercel.app/agents",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ success: false, error: message }, 500);
  }
}
