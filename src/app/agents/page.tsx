"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { AGENT_STATUS_CONFIG } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Agent Roster</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">
          {filteredAgents.length} agents · {filteredAgents.filter((a) => a.status === "online" || a.status === "busy").length} active
        </p>
      </div>

      {/* Status Summary */}
      <div className="flex gap-3 flex-wrap">
        {(Object.entries(AGENT_STATUS_CONFIG) as [string, any][]).map(([status, cfg]) => {
          const count = filteredAgents.filter((a) => a.status === status).length;
          return (
            <div key={status} className="flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-2">
              <span className={`w-2 h-2 rounded-full ${cfg.color} ${cfg.pulse ? "animate-pulse-dot" : ""}`} />
              <span className="text-xs text-[#A0A0A0]">{cfg.label}</span>
              <span className="text-xs font-bold text-white">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAgents.map((agent) => {
          const statusCfg = AGENT_STATUS_CONFIG[agent.status];
          const company = agent.companyId ? getCompany(agent.companyId) : null;
          const agentTasks = tasks.filter((t) => t.assignedAgentId === agent._id);
          const activeTasks = agentTasks.filter((t) => t.status !== "done" && t.status !== "cancelled");
          const currentTask = agentTasks.find((t) => t.status === "in_progress");

          return (
            <div
              key={agent._id}
              onClick={() => setSelectedAgent(agent)}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all cursor-pointer group"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="relative">
                  <span className="text-3xl">{agent.avatar}</span>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1A1A1A] ${statusCfg.color} ${statusCfg.pulse ? "animate-pulse-dot" : ""}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{agent.name}</h3>
                  <p className="text-xs text-[#A0A0A0]">{agent.role}</p>
                  {company && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: company.color }} />
                      <span className="text-[10px] text-[#555]">{company.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center bg-[#0F0F0F] rounded-lg py-2">
                  <p className="text-sm font-bold text-white">{agent.totalTasksCompleted}</p>
                  <p className="text-[10px] text-[#555]">Done</p>
                </div>
                <div className="text-center bg-[#0F0F0F] rounded-lg py-2">
                  <p className="text-sm font-bold text-white">{activeTasks.length}</p>
                  <p className="text-[10px] text-[#555]">Active</p>
                </div>
                <div className="text-center bg-[#0F0F0F] rounded-lg py-2">
                  <p className="text-sm font-bold text-white">{agentTasks.length}</p>
                  <p className="text-[10px] text-[#555]">Total</p>
                </div>
              </div>

              {/* Current Task */}
              {currentTask && (
                <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-2 mb-3">
                  <p className="text-[10px] text-[#E8A838] uppercase tracking-wider mb-0.5">Working on</p>
                  <p className="text-xs text-[#A0A0A0] line-clamp-1">{currentTask.title}</p>
                </div>
              )}

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 4).map((cap) => (
                  <span key={cap} className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] text-[#555]">{cap}</span>
                ))}
                {agent.capabilities.length > 4 && (
                  <span className="text-[10px] text-[#555]">+{agent.capabilities.length - 4}</span>
                )}
              </div>

              {/* Last heartbeat */}
              {agent.lastHeartbeat && (
                <p className="text-[10px] text-[#555] mt-3">Last heartbeat: {timeAgo(agent.lastHeartbeat)}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSelectedAgent(null)} />
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <button onClick={() => setSelectedAgent(null)} className="absolute top-4 right-4 text-[#555] hover:text-white text-xl">&times;</button>

            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <span className="text-5xl">{selectedAgent.avatar}</span>
                <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1A1A1A] ${AGENT_STATUS_CONFIG[selectedAgent.status as keyof typeof AGENT_STATUS_CONFIG].color}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedAgent.name}</h2>
                <p className="text-sm text-[#A0A0A0]">{selectedAgent.role}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  selectedAgent.status === "online" ? "bg-green-500/10 text-green-400" :
                  selectedAgent.status === "busy" ? "bg-yellow-500/10 text-yellow-400" :
                  selectedAgent.status === "error" ? "bg-red-500/10 text-red-400" :
                  "bg-gray-500/10 text-gray-400"
                }`}>{selectedAgent.status}</span>
              </div>
            </div>

            <p className="text-sm text-[#A0A0A0] mb-4">{selectedAgent.description}</p>

            {selectedAgent.personality && (
              <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3 mb-4">
                <p className="text-[10px] text-[#E8A838] uppercase tracking-wider mb-1">Personality</p>
                <p className="text-xs text-[#A0A0A0]">{selectedAgent.personality}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-xs font-medium text-white mb-2">Capabilities</p>
              <div className="flex flex-wrap gap-1">
                {selectedAgent.capabilities.map((cap: string) => (
                  <span key={cap} className="text-xs px-2 py-1 rounded-full bg-[#242424] text-[#A0A0A0]">{cap}</span>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div>
              <p className="text-xs font-medium text-white mb-2">Recent Activity</p>
              <div className="space-y-2">
                {activities
                  .filter((a) => a.agentId === selectedAgent._id)
                  .slice(0, 5)
                  .map((activity) => (
                    <div key={activity._id} className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-2">
                      <p className="text-xs text-[#A0A0A0]">{activity.message}</p>
                      <p className="text-[10px] text-[#555] mt-1">{timeAgo(activity.createdAt)}</p>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
