"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { timeAgo } from "@/lib/utils";

/* ── Action type config ─────────────────────────────────────────────────── */
const ACTION_TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  exec_command:       { icon: "⌨️", color: "text-green-400" },
  shell:              { icon: "⌨️", color: "text-green-400" },
  file_created:       { icon: "📄", color: "text-blue-400" },
  file_modified:      { icon: "✏️", color: "text-blue-300" },
  file_deleted:       { icon: "🗑️", color: "text-red-400" },
  api_call:           { icon: "🌐", color: "text-purple-400" },
  api_request:        { icon: "🌐", color: "text-purple-400" },
  task_created:       { icon: "📝", color: "text-amber-400" },
  task_updated:       { icon: "🔄", color: "text-amber-300" },
  task_completed:     { icon: "✅", color: "text-green-400" },
  task_deleted:       { icon: "❌", color: "text-red-400" },
  agent_status:       { icon: "🤖", color: "text-cyan-400" },
  discord_message:    { icon: "💬", color: "text-indigo-400" },
  email_sent:         { icon: "📧", color: "text-pink-400" },
  web_fetch:          { icon: "🔗", color: "text-teal-400" },
  database_query:     { icon: "🗄️", color: "text-orange-400" },
  error:              { icon: "🚨", color: "text-red-500" },
  deployment:         { icon: "🚀", color: "text-green-500" },
  login:              { icon: "🔐", color: "text-yellow-400" },
  system:             { icon: "⚙️", color: "text-gray-400" },
  info:               { icon: "ℹ️", color: "text-blue-400" },
  thinking:           { icon: "🧠", color: "text-purple-300" },
  decision:           { icon: "⚡", color: "text-amber-400" },
  report:             { icon: "📊", color: "text-cyan-300" },
};

const getActionConfig = (type: string) =>
  ACTION_TYPE_CONFIG[type.toLowerCase()] || { icon: "⚙️", color: "text-gray-400" };

/* ── Status badge config ────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  success: { label: "OK", bg: "bg-green-500/10", text: "text-green-400", dot: "bg-green-500" },
  fail:    { label: "FAIL", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  pending: { label: "PEND", bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  info:    { label: "INFO", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500" },
} as const;

export default function LogsPage() {
  const logs = useQuery(api.activityLogs.list, { limit: 500 });
  const stats = useQuery(api.activityLogs.stats);
  const agents = useQuery(api.agents.list);

  const [agentFilter, setAgentFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (!logs || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-pulse">📡</span>
          <span className="text-[#A0A0A0] text-sm font-mono">Loading activity logs...</span>
        </div>
      </div>
    );
  }

  // Derive unique agents and action types from logs
  const uniqueAgents = [...new Set(logs.map((l) => l.agentName))].sort();
  const uniqueTypes = [...new Set(logs.map((l) => l.actionType))].sort();

  // Apply filters
  let filtered = logs;
  if (agentFilter !== "all") {
    filtered = filtered.filter((l) => l.agentName === agentFilter);
  }
  if (typeFilter !== "all") {
    filtered = filtered.filter((l) => l.actionType === typeFilter);
  }
  if (statusFilter !== "all") {
    filtered = filtered.filter((l) => l.status === statusFilter);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (l) =>
        l.description.toLowerCase().includes(q) ||
        l.agentName.toLowerCase().includes(q) ||
        l.actionType.toLowerCase().includes(q)
    );
  }

  // Group by date
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((l) => {
    const date = new Date(l.timestamp).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(l);
  });

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ACTIVITY LOG
          </h1>
          <p className="text-[#A0A0A0] text-sm mt-1 font-mono">
            System audit trail &middot; Real-time agent monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-green-400 font-mono">LIVE</span>
        </div>
      </div>

      {/* ── Stats Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider">Total Logs</p>
          <p className="text-xl font-bold text-white font-mono mt-1">{stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider">Today</p>
          <p className="text-xl font-bold text-white font-mono mt-1">{stats.today.toLocaleString()}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
          <p className="text-[10px] text-[#555] uppercase tracking-wider">Last Hour</p>
          <p className="text-xl font-bold text-white font-mono mt-1">{stats.lastHour.toLocaleString()}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
          <p className="text-[10px] text-green-400 uppercase tracking-wider">Success</p>
          <p className="text-xl font-bold text-green-400 font-mono mt-1">{stats.successCount}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
          <p className="text-[10px] text-red-400 uppercase tracking-wider">Failed</p>
          <p className="text-xl font-bold text-red-400 font-mono mt-1">{stats.failCount}</p>
        </div>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3">
          <p className="text-[10px] text-amber-400 uppercase tracking-wider">Pending</p>
          <p className="text-xl font-bold text-amber-400 font-mono mt-1">{stats.pendingCount}</p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838]/50"
            />
          </div>

          {/* Agent filter */}
          <div className="min-w-[140px]">
            <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">Agent</label>
            <select
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
            >
              <option value="all">All Agents</option>
              {uniqueAgents.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Action type filter */}
          <div className="min-w-[140px]">
            <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">Action Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="min-w-[120px]">
            <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="fail">Failed</option>
              <option value="pending">Pending</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>

        {/* Active filter count */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-[#555] font-mono">
            Showing {filtered.length} of {logs.length} entries
          </span>
          {(agentFilter !== "all" || typeFilter !== "all" || statusFilter !== "all" || searchQuery) && (
            <button
              onClick={() => {
                setAgentFilter("all");
                setTypeFilter("all");
                setStatusFilter("all");
                setSearchQuery("");
              }}
              className="text-[10px] text-[#E8A838] hover:text-[#E8A838]/80 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Log Entries ─────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="sticky top-0 z-10 bg-[#0F0F0F] py-2 mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-medium text-[#555] uppercase tracking-wider">
                  {date}
                </h3>
                <span className="text-[10px] text-[#333] font-mono">
                  ({items.length} entries)
                </span>
                <div className="flex-1 h-px bg-[#1A1A1A]" />
              </div>
            </div>

            <div className="space-y-1">
              {items.map((log) => {
                const actionCfg = getActionConfig(log.actionType);
                const statusCfg = STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.info;
                const timestamp = new Date(log.timestamp);
                const timeStr = timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                });

                return (
                  <div
                    key={log._id}
                    className={`group flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors border-l-2 ${
                      log.status === "fail"
                        ? "border-l-red-500/50"
                        : log.status === "success"
                          ? "border-l-green-500/20"
                          : log.status === "pending"
                            ? "border-l-amber-500/30"
                            : "border-l-[#2A2A2A]"
                    }`}
                  >
                    {/* Timestamp */}
                    <span className="text-[11px] text-[#444] font-mono flex-shrink-0 w-[70px] mt-0.5">
                      {timeStr}
                    </span>

                    {/* Action icon */}
                    <span className="text-sm flex-shrink-0 mt-0.5">
                      {actionCfg.icon}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Agent name */}
                        <span className="text-xs font-semibold text-white bg-[#242424] px-2 py-0.5 rounded">
                          {log.agentName}
                        </span>

                        {/* Action type badge */}
                        <span className={`text-[10px] font-mono ${actionCfg.color}`}>
                          {log.actionType}
                        </span>

                        {/* Status badge */}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusCfg.bg} ${statusCfg.text} font-mono`}>
                          {statusCfg.label}
                        </span>

                        {/* Duration if present */}
                        {log.duration !== undefined && log.duration !== null && (
                          <span className="text-[10px] text-[#555] font-mono">
                            {log.duration < 1000
                              ? `${log.duration}ms`
                              : `${(log.duration / 1000).toFixed(1)}s`}
                          </span>
                        )}

                        {/* Company if present */}
                        {log.company && (
                          <span className="text-[10px] text-[#555]">
                            [{log.company}]
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-[#A0A0A0] mt-1 leading-relaxed">
                        {log.description}
                      </p>

                      {/* Metadata (expandable) */}
                      {log.metadata && (
                        <details className="mt-1">
                          <summary className="text-[10px] text-[#444] cursor-pointer hover:text-[#666] font-mono">
                            metadata
                          </summary>
                          <pre className="text-[10px] text-[#555] bg-[#0F0F0F] border border-[#2A2A2A] rounded p-2 mt-1 overflow-x-auto font-mono">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>

                    {/* Relative time */}
                    <span className="text-[10px] text-[#444] flex-shrink-0 font-mono">
                      {timeAgo(log.timestamp)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Empty State ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="text-center py-16 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl">
          <div className="text-4xl mb-3">📡</div>
          <h3 className="text-lg font-semibold text-white mb-1">
            {logs.length === 0 ? "No Activity Logged Yet" : "No Matching Entries"}
          </h3>
          <p className="text-sm text-[#555] max-w-md mx-auto">
            {logs.length === 0
              ? "Activity logs will appear here as agents perform actions. Use the /api/activity-log endpoint to start logging."
              : "Try adjusting your filters to see more entries."}
          </p>
          {logs.length === 0 && (
            <div className="mt-4 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3 max-w-lg mx-auto text-left">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">Quick Start</p>
              <code className="text-[11px] text-[#A0A0A0] font-mono break-all">
                GET /api/activity-log?token=mc-api-2026-krystalklean&agentName=Jarvis&actionType=exec_command&description=Ran+system+check&status=success
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
