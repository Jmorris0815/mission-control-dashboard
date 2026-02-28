"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { PRIORITY_CONFIG, AGENT_STATUS_CONFIG, COMPANY_STATUS_CONFIG, ACTIVITY_TYPE_ICONS } from "@/lib/constants";
import { timeAgo } from "@/lib/utils";
import Link from "next/link";

export default function DashboardPage() {
  const companies = useQuery(api.companies.list);
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const activities = useQuery(api.activities.getRecent, { limit: 15 });
  const missions = useQuery(api.missions.list);
  const { selectedCompanyId } = useCompanyFilter();

  if (!companies || !tasks || !agents || !activities || !missions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-3xl mb-3 animate-pulse">🚀</div>
          <p className="text-[#A0A0A0] text-sm">Loading Mission Control...</p>
        </div>
      </div>
    );
  }

  const filteredTasks = selectedCompanyId ? tasks.filter((t) => t.companyId === selectedCompanyId) : tasks;
  const filteredAgents = selectedCompanyId ? agents.filter((a) => a.companyId === selectedCompanyId || !a.companyId) : agents;
  const filteredActivities = selectedCompanyId ? activities.filter((a) => a.companyId === selectedCompanyId) : activities;
  const filteredMissions = selectedCompanyId ? missions.filter((m) => m.companyId === selectedCompanyId) : missions;

  const totalTasks = filteredTasks.length;
  const inProgress = filteredTasks.filter((t) => t.status === "in_progress").length;
  const completed = filteredTasks.filter((t) => t.status === "done").length;
  const blocked = filteredTasks.filter((t) => t.status === "blocked").length;
  const onlineAgents = filteredAgents.filter((a) => a.status === "online" || a.status === "busy").length;
  const criticalTasks = filteredTasks.filter((t) => t.priority === "critical" && t.status !== "done").length;

  const getCompany = (id: string) => companies.find((c) => c._id === id);
  const getAgent = (id: string) => agents.find((a) => a._id === id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">
          {selectedCompanyId ? getCompany(selectedCompanyId)?.name : "All ventures"} — Real-time overview
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Tasks", value: totalTasks, icon: "📋", color: "border-blue-500/30" },
          { label: "In Progress", value: inProgress, icon: "⚡", color: "border-purple-500/30" },
          { label: "Completed", value: completed, icon: "✅", color: "border-green-500/30" },
          { label: "Blocked", value: blocked, icon: "🚫", color: "border-red-500/30" },
          { label: "Agents Active", value: onlineAgents, icon: "🤖", color: "border-amber-500/30" },
          { label: "Critical", value: criticalTasks, icon: "🔴", color: "border-red-500/30" },
        ].map((stat) => (
          <div key={stat.label} className={`bg-[#1A1A1A] border ${stat.color} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-[10px] text-[#A0A0A0] uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Companies Overview */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Companies</h2>
            <span className="text-xs text-[#A0A0A0]">{companies.length} ventures</span>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {companies.map((company) => {
              const companyTasks = tasks.filter((t) => t.companyId === company._id);
              const doneTasks = companyTasks.filter((t) => t.status === "done").length;
              const progress = companyTasks.length > 0 ? Math.round((doneTasks / companyTasks.length) * 100) : 0;
              const statusConfig = COMPANY_STATUS_CONFIG[company.status];
              return (
                <div key={company._id} className="p-4 hover:bg-[#242424] transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: company.color }} />
                    <span className="text-sm font-medium text-white truncate">{company.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ml-auto flex-shrink-0 ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="ml-6">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-[#242424] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: company.color }} />
                      </div>
                      <span className="text-[10px] text-[#A0A0A0]">{progress}%</span>
                    </div>
                    <p className="text-[10px] text-[#555]">{companyTasks.length} tasks · {doneTasks} done</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Agents */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Agent Roster</h2>
            <Link href="/agents" className="text-xs text-[#E8A838] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-[#2A2A2A]">
            {filteredAgents.slice(0, 6).map((agent) => {
              const statusCfg = AGENT_STATUS_CONFIG[agent.status];
              const company = agent.companyId ? getCompany(agent.companyId) : null;
              return (
                <div key={agent._id} className="p-3 hover:bg-[#242424] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span className="text-xl">{agent.avatar}</span>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#1A1A1A] ${statusCfg.color} ${statusCfg.pulse ? "animate-pulse-dot" : ""}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{agent.name}</span>
                        {company && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: company.color }} />}
                      </div>
                      <p className="text-[10px] text-[#A0A0A0]">{agent.role}</p>
                    </div>
                    <span className="text-[10px] text-[#555]">{agent.totalTasksCompleted} done</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Activity Feed</h2>
            <Link href="/activity" className="text-xs text-[#E8A838] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-[#2A2A2A] max-h-[400px] overflow-y-auto">
            {filteredActivities.slice(0, 12).map((activity) => {
              const company = activity.companyId ? getCompany(activity.companyId) : null;
              return (
                <div key={activity._id} className="px-4 py-3 hover:bg-[#242424] transition-colors">
                  <div className="flex items-start gap-2">
                    <span className="text-sm flex-shrink-0 mt-0.5">{ACTIVITY_TYPE_ICONS[activity.type] ?? "⚙️"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#A0A0A0] leading-relaxed">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {company && (
                          <span className="flex items-center gap-1 text-[10px] text-[#555]">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: company.color }} />
                            {company.name}
                          </span>
                        )}
                        <span className="text-[10px] text-[#555]">{timeAgo(activity.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Missions Overview */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Active Missions</h2>
          <Link href="/missions" className="text-xs text-[#E8A838] hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {filteredMissions.filter((m) => m.status === "active").map((mission) => {
            const company = getCompany(mission.companyId);
            return (
              <div key={mission._id} className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: company?.color ?? "#555" }} />
                  <span className="text-[10px] text-[#A0A0A0]">{company?.name}</span>
                </div>
                <h3 className="text-sm font-medium text-white mb-2">{mission.title}</h3>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#242424] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${mission.progress}%`, backgroundColor: company?.color ?? "#E8A838" }} />
                  </div>
                  <span className="text-xs font-mono text-[#A0A0A0]">{mission.progress}%</span>
                </div>
                <p className="text-[10px] text-[#555] mt-2">{mission.linkedTaskIds.length} linked tasks</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Priority Tasks */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#2A2A2A]">
          <h2 className="text-sm font-semibold text-white">Priority Tasks</h2>
        </div>
        <div className="divide-y divide-[#2A2A2A]">
          {filteredTasks
            .filter((t) => t.status !== "done" && t.status !== "cancelled")
            .sort((a, b) => {
              const order = { critical: 0, high: 1, medium: 2, low: 3 };
              return order[a.priority] - order[b.priority];
            })
            .slice(0, 8)
            .map((task) => {
              const company = getCompany(task.companyId);
              const agent = task.assignedAgentId ? getAgent(task.assignedAgentId) : null;
              const priorityCfg = PRIORITY_CONFIG[task.priority];
              return (
                <div key={task._id} className="p-4 hover:bg-[#242424] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm">{priorityCfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-white truncate block">{task.title}</span>
                      <div className="flex items-center gap-2 mt-1">
                        {company && (
                          <span className="flex items-center gap-1 text-[10px] text-[#555]">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: company.color }} />
                            {company.name}
                          </span>
                        )}
                        {agent && <span className="text-[10px] text-[#555]">{agent.avatar} {agent.name}</span>}
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${priorityCfg.bg} ${priorityCfg.color}`}>
                      {priorityCfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
