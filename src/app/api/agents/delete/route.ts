import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

const API_TOKEN = "mc-api-2026-krystalklean";
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

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

  // ── Convex ────────────────────────────────────────────────────────────────
  const client = new ConvexHttpClient(CONVEX_URL);

  try {
    const agentId = await client.mutation(api.agents.removeByName, { name });

    return jsonResponse({
      success: true,
      agentId,
      message: `Agent "${name}" has been deleted`,
      dashboard: "https://mission-control-dashboard-plum-two.vercel.app/agents",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const httpStatus = message.includes("not found") ? 404 : 500;
    return jsonResponse({ success: false, error: message }, httpStatus);
  }
}
