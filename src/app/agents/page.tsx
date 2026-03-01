"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { timeAgo } from "@/lib/utils";

/* ── Role title map (fallback when roleTitle not set in DB) ─────────────── */
const ROLE_TITLE_MAP: Record<string, string> = {
  jarvis: "AI Chief of Staff",
  mercury: "Marketing",
  atlas: "Customer Ops",
  prospector: "Sales",
  ledger: "Finance",
  scribe: "Content",
};

/* ── Status config with glow classes ────────────────────────────────────── */
const STATUS_CFG = {
  online: { label: "Online", dotClass: "status-glow-online", cardClass: "agent-card-online", textClass: "text-green-400", bgClass: "bg-green-500/10" },
  busy:   { label: "Busy",   dotClass: "status-glow-busy",   cardClass: "agent-card-busy",   textClass: "text-amber-400", bgClass: "bg-amber-500/10" },
  idle:   { label: "Standby",dotClass: "status-glow-idle",   cardClass: "",                   textClass: "text-gray-400",  bgClass: "bg-gray-500/10" },
  offline:{ label: "Offline", dotClass: "status-glow-offline",cardClass: "",                   textClass: "text-gray-500",  bgClass: "bg-gray-600/10" },
  error:  { label: "Error",  dotClass: "status-glow-error",  cardClass: "agent-card-error",   textClass: "text-red-400",   bgClass: "bg-red-500/10" },
} as const;

function durationSince(ts: number | undefined): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export default function AgentsPage() {
  const agents = useQuery(api.agents.list);
  const companies = useQuery(api.companies.list);
  const tasks = useQuery(api.tasks.list);
  const activities = useQuery(api.activities.list);
  const { selectedCompanyId } = useCompanyFilter();
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  if (!agents || !companies || !tasks || !activities) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-3xl animate-pulse">🤖</div>
      </div>
    );
  }

  const filteredAgents = selectedCompanyId
    ? agents.filter((a) => a.companyId === selectedCompanyId || !a.companyId)
    : agents;

  const getCompany = (id: string) => companies.find((c) => c._id === id);
  const getAgentActivities = (agentId: string) =>
    activities
      .filter((a) => a.agentId === agentId)
      .sort((a, b) => b.createdAt - a.createdAt);

  const onlineCount = filteredAgents.filter((a) => a.status === "online").length;
  const busyCount = filteredAgents.filter((a) => a.status === "busy").length;
  const idleCount = filteredAgents.filter((a) => a.status === "idle").length;
  const offlineCount = filteredAgents.filter((a) => a.status === "offline").length;
  const errorCount = filteredAgents.filter((a) => a.status === "error").length;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            AGENT ROSTER
          </h1>
          <p className="text-[#A0A0A0] text-sm mt-1 font-mono">
            {filteredAgents.length} deployed &middot;{" "}
            {onlineCount + busyCount} active
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2">
          <span className="text-[#555]">SYS</span>
          <span className="text-[#555]">|</span>
          <span className="text-green-400">{onlineCount} ON</span>
          <span className="text-[#333]">/</span>
          <span className="text-amber-400">{busyCount} BSY</span>
          <span className="text-[#333]">/</span>
          <span className="text-gray-400">{idleCount} SBY</span>
          <span className="text-[#333]">/</span>
          <span className="text-gray-500">{offlineCount} OFF</span>
          {errorCount > 0 && (
            <>
              <span className="text-[#333]">/</span>
              <span className="text-red-400 animate-pulse">{errorCount} ERR</span>
            </>
          )}
        </div>
      </div>

      {/* ── Status Bar ──────────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(STATUS_CFG) as [keyof typeof STATUS_CFG, (typeof STATUS_CFG)[keyof typeof STATUS_CFG]][]).map(
          ([status, cfg]) => {
            const count = filteredAgents.filter((a) => a.status === status).length;
            return (
              <div
                key={status}
                className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dotClass}`} />
                <span className={`text-xs ${cfg.textClass}`}>{cfg.label}</span>
                <span className="text-xs font-bold text-white">{count}</span>
              </div>
            );
          }
        )}
      </div>

      {/* ── Agent Grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => {
          const cfg = STATUS_CFG[agent.status as keyof typeof STATUS_CFG] || STATUS_CFG.idle;
          const company = agent.companyId ? getCompany(agent.companyId) : null;
          const agentTasks = tasks.filter((t) => t.assignedAgentId === agent._id);
          const activeTasks = agentTasks.filter(
            (t) => t.status !== "done" && t.status !== "cancelled"
          );
          const currentTask =
            agent.currentTaskTitle ||
            agentTasks.find((t) => t.status === "in_progress")?.title;
          const recentActivities = getAgentActivities(agent._id).slice(0, 4);
          const displayTitle =
            agent.roleTitle ||
            ROLE_TITLE_MAP[agent.name.toLowerCase()] ||
            agent.role;

          // Determine the avatar color — stored in avatar field as hex
          const avatarColor =
            agent.avatar && agent.avatar.startsWith("#")
              ? agent.avatar
              : "#3b82f6";

          return (
            <div
              key={agent._id}
              onClick={() => setSelectedAgent(agent)}
              className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden hover:border-[#3A3A3A] transition-all cursor-pointer group ${cfg.cardClass}`}
            >
              {/* ── Top accent bar ──────────────────────────────────────────── */}
              <div className="h-1" style={{ backgroundColor: avatarColor }} />

              <div className="p-5">
                {/* ── Header Row ────────────────────────────────────────────── */}
                <div className="flex items-start gap-3 mb-4">
                  {/* Avatar circle with status glow */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{ backgroundColor: avatarColor + "22", color: avatarColor }}
                    >
                      {agent.name.charAt(0)}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#1A1A1A] ${cfg.dotClass}`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white truncate">
                        {agent.name}
                      </h3>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bgClass} ${cfg.textClass}`}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#A0A0A0] mt-0.5">{displayTitle}</p>
                    {company && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: company.color }}
                        />
                        <span className="text-[11px] text-[#555]">{company.name}</span>
                      </div>
                    )}
                    {!company && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] text-[#555]">All Companies</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Stats Row ─────────────────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="text-center bg-[#0F0F0F] rounded-lg py-2">
                    <p className="text-sm font-bold text-white">
                      {agent.totalTasksCompleted}
                    </p>
                    <p className="text-[10px] text-[#555]">Total</p>
                  </div>
                  <div className="text-center bg-[#0F0F0F] rounded-lg py-2">
                    <p className="text-sm font-bold text-white">
                      {agent.tasksCompletedToday ?? 0}
                    </p>
                    <p className="text-[10px] text-[#555]">Today</p>
                  </div>
                  <div className="text-center bg-[#0F0F0F] rounded-lg py-2">
                    <p className="text-sm font-bold text-white">
                      {activeTasks.length}
                    </p>
                    <p className="text-[10px] text-[#555]">Active</p>
                  </div>
                  <div className="text-center bg-[#0F0F0F] rounded-lg py-2">
                    <p className="text-sm font-bold text-white font-mono">
                      {durationSince(agent.lastStatusChange || agent.createdAt)}
                    </p>
                    <p className="text-[10px] text-[#555]">Uptime</p>
                  </div>
                </div>

                {/* ── Current Task ──────────────────────────────────────────── */}
                <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-[#E8A838] uppercase tracking-wider font-semibold">
                      Current Task
                    </span>
                    {currentTask && (
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-[#A0A0A0] line-clamp-1">
                    {currentTask || "Idle — awaiting assignment"}
                  </p>
                </div>

                {/* ── Last Action ───────────────────────────────────────────── */}
                {agent.lastAction && (
                  <div className="mb-3">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
                      Last Action
                    </p>
                    <p className="text-xs text-[#A0A0A0] line-clamp-1">
                      {agent.lastAction}
                    </p>
                  </div>
                )}

                {/* ── Specialties ───────────────────────────────────────────── */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {agent.capabilities.slice(0, 5).map((cap) => (
                    <span
                      key={cap}
                      className="text-[10px] px-2 py-0.5 rounded-full border border-[#2A2A2A] text-[#777]"
                    >
                      {cap}
                    </span>
                  ))}
                  {agent.capabilities.length > 5 && (
                    <span className="text-[10px] text-[#555]">
                      +{agent.capabilities.length - 5}
                    </span>
                  )}
                </div>

                {/* ── Mini Activity Log ─────────────────────────────────────── */}
                {recentActivities.length > 0 && (
                  <div className="border-t border-[#2A2A2A] pt-3">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                      Recent Activity
                    </p>
                    <div className="space-y-1.5">
                      {recentActivities.map((act) => (
                        <div key={act._id} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#333] mt-1.5 flex-shrink-0" />
                          <p className="text-[11px] text-[#666] line-clamp-1 flex-1">
                            {act.message}
                          </p>
                          <span className="text-[10px] text-[#444] flex-shrink-0 font-mono">
                            {timeAgo(act.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Footer ────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#2A2A2A]">
                  <span className="text-[10px] text-[#444] font-mono">
                    HB: {agent.lastHeartbeat ? timeAgo(agent.lastHeartbeat) : "—"}
                  </span>
                  <span className="text-[10px] text-[#444] font-mono">
                    ID: {agent._id.slice(-6)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-16 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-lg font-semibold text-white mb-1">
            No Agents Deployed
          </h3>
          <p className="text-sm text-[#555]">
            Use the API to deploy agents to the roster.
          </p>
        </div>
      )}

      {/* ── Agent Detail Modal ──────────────────────────────────────────────── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedAgent(null)}
          />
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            {/* Modal accent bar */}
            <div
              className="h-1.5 rounded-t-xl"
              style={{
                backgroundColor:
                  selectedAgent.avatar && selectedAgent.avatar.startsWith("#")
                    ? selectedAgent.avatar
                    : "#3b82f6",
              }}
            />

            <div className="p-6">
              <button
                onClick={() => setSelectedAgent(null)}
                className="absolute top-4 right-4 text-[#555] hover:text-white text-xl z-10"
              >
                &times;
              </button>

              {/* ── Modal Header ──────────────────────────────────────────── */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      backgroundColor:
                        (selectedAgent.avatar && selectedAgent.avatar.startsWith("#")
                          ? selectedAgent.avatar
                          : "#3b82f6") + "22",
                      color:
                        selectedAgent.avatar && selectedAgent.avatar.startsWith("#")
                          ? selectedAgent.avatar
                          : "#3b82f6",
                    }}
                  >
                    {selectedAgent.name.charAt(0)}
                  </div>
                  <span
                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1A1A1A] ${
                      STATUS_CFG[selectedAgent.status as keyof typeof STATUS_CFG]?.dotClass ||
                      "status-glow-idle"
                    }`}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedAgent.name}
                    <span className="text-[#A0A0A0] font-normal ml-2">
                      —{" "}
                      {selectedAgent.roleTitle ||
                        ROLE_TITLE_MAP[selectedAgent.name.toLowerCase()] ||
                        selectedAgent.role}
                    </span>
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        STATUS_CFG[selectedAgent.status as keyof typeof STATUS_CFG]?.bgClass
                      } ${STATUS_CFG[selectedAgent.status as keyof typeof STATUS_CFG]?.textClass}`}
                    >
                      {STATUS_CFG[selectedAgent.status as keyof typeof STATUS_CFG]?.label}
                    </span>
                    <span className="text-xs text-[#555] font-mono">
                      Uptime:{" "}
                      {durationSince(
                        selectedAgent.lastStatusChange || selectedAgent.createdAt
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Description ───────────────────────────────────────────── */}
              <p className="text-sm text-[#A0A0A0] mb-5 leading-relaxed">
                {selectedAgent.description}
              </p>

              {/* ── Stats Grid ────────────────────────────────────────────── */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="text-center bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-3">
                  <p className="text-lg font-bold text-white">
                    {selectedAgent.totalTasksCompleted}
                  </p>
                  <p className="text-[10px] text-[#555] uppercase">Total Done</p>
                </div>
                <div className="text-center bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-3">
                  <p className="text-lg font-bold text-white">
                    {selectedAgent.tasksCompletedToday ?? 0}
                  </p>
                  <p className="text-[10px] text-[#555] uppercase">Today</p>
                </div>
                <div className="text-center bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-3">
                  <p className="text-lg font-bold text-white">
                    {tasks.filter(
                      (t) =>
                        t.assignedAgentId === selectedAgent._id &&
                        t.status !== "done" &&
                        t.status !== "cancelled"
                    ).length}
                  </p>
                  <p className="text-[10px] text-[#555] uppercase">Active</p>
                </div>
                <div className="text-center bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg py-3">
                  <p className="text-lg font-bold text-white font-mono">
                    {durationSince(
                      selectedAgent.lastStatusChange || selectedAgent.createdAt
                    )}
                  </p>
                  <p className="text-[10px] text-[#555] uppercase">Uptime</p>
                </div>
              </div>

              {/* ── Current Task ──────────────────────────────────────────── */}
              <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-[#E8A838] uppercase tracking-wider font-semibold">
                    Current Task
                  </span>
                  {(selectedAgent.currentTaskTitle ||
                    tasks.find(
                      (t) =>
                        t.assignedAgentId === selectedAgent._id &&
                        t.status === "in_progress"
                    )) && (
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  )}
                </div>
                <p className="text-sm text-[#A0A0A0]">
                  {selectedAgent.currentTaskTitle ||
                    tasks.find(
                      (t) =>
                        t.assignedAgentId === selectedAgent._id &&
                        t.status === "in_progress"
                    )?.title ||
                    "Idle — awaiting assignment"}
                </p>
              </div>

              {/* ── Last Action ───────────────────────────────────────────── */}
              {selectedAgent.lastAction && (
                <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 mb-5">
                  <p className="text-xs text-[#555] uppercase tracking-wider mb-1">
                    Last Action
                  </p>
                  <p className="text-sm text-[#A0A0A0]">
                    {selectedAgent.lastAction}
                  </p>
                </div>
              )}

              {/* ── Personality ───────────────────────────────────────────── */}
              {selectedAgent.personality && (
                <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4 mb-5">
                  <p className="text-xs text-[#E8A838] uppercase tracking-wider mb-1">
                    Personality
                  </p>
                  <p className="text-sm text-[#A0A0A0]">
                    {selectedAgent.personality}
                  </p>
                </div>
              )}

              {/* ── Capabilities ──────────────────────────────────────────── */}
              <div className="mb-5">
                <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider">
                  Specialties
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedAgent.capabilities.map((cap: string) => (
                    <span
                      key={cap}
                      className="text-xs px-3 py-1 rounded-full border border-[#2A2A2A] text-[#A0A0A0] bg-[#0F0F0F]"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Activity Log ──────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-medium text-white mb-2 uppercase tracking-wider">
                  Activity Log
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {getAgentActivities(selectedAgent._id).length === 0 && (
                    <p className="text-xs text-[#555] py-2">No activity yet.</p>
                  )}
                  {getAgentActivities(selectedAgent._id)
                    .slice(0, 10)
                    .map((activity) => (
                      <div
                        key={activity._id}
                        className="flex items-start gap-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#333] mt-1.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#A0A0A0]">
                            {activity.message}
                          </p>
                          <p className="text-[10px] text-[#555] mt-1 font-mono">
                            {timeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* ── Footer Meta ───────────────────────────────────────────── */}
              <div className="flex items-center justify-between mt-5 pt-3 border-t border-[#2A2A2A]">
                <span className="text-[10px] text-[#444] font-mono">
                  Last heartbeat:{" "}
                  {selectedAgent.lastHeartbeat
                    ? timeAgo(selectedAgent.lastHeartbeat)
                    : "—"}
                </span>
                <span className="text-[10px] text-[#444] font-mono">
                  Created: {timeAgo(selectedAgent.createdAt)}
                </span>
                <span className="text-[10px] text-[#444] font-mono">
                  ID: {selectedAgent._id.slice(-8)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
