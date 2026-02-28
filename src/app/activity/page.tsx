"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { ACTIVITY_TYPE_ICONS } from "@/lib/constants";
import { timeAgo, formatDateTime } from "@/lib/utils";

const ACTIVITY_TYPES = [
  { value: "all", label: "All Activity" },
  { value: "task_created", label: "Tasks Created" },
  { value: "task_completed", label: "Tasks Completed" },
  { value: "task_blocked", label: "Blocked" },
  { value: "task_updated", label: "Task Updates" },
  { value: "task_assigned", label: "Assignments" },
  { value: "comment_added", label: "Comments" },
  { value: "agent_online", label: "Agent Online" },
  { value: "agent_offline", label: "Agent Offline" },
  { value: "milestone_reached", label: "Milestones" },
  { value: "system", label: "System" },
];

export default function ActivityPage() {
  const activities = useQuery(api.activities.list);
  const companies = useQuery(api.companies.list);
  const agents = useQuery(api.agents.list);
  const { selectedCompanyId } = useCompanyFilter();
  const [typeFilter, setTypeFilter] = useState("all");

  if (!activities || !companies || !agents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-3xl animate-pulse">⚡</div>
      </div>
    );
  }

  const getCompany = (id: string) => companies.find((c) => c._id === id);
  const getAgent = (id: string) => agents.find((a) => a._id === id);

  let filtered = selectedCompanyId
    ? activities.filter((a) => a.companyId === selectedCompanyId)
    : activities;

  if (typeFilter !== "all") {
    filtered = filtered.filter((a) => a.type === typeFilter);
  }

  // Group by date
  const grouped: Record<string, typeof filtered> = {};
  filtered.forEach((a) => {
    const date = new Date(a.createdAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(a);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Activity Feed</h1>
        <p className="text-[#A0A0A0] text-sm mt-1">Real-time log of all operations across your ventures</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {ACTIVITY_TYPES.map((type) => (
          <button
            key={type.value}
            onClick={() => setTypeFilter(type.value)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
              typeFilter === type.value
                ? "bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/20"
                : "bg-[#1A1A1A] text-[#A0A0A0] border border-[#2A2A2A] hover:bg-[#242424]"
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <h3 className="text-xs font-medium text-[#555] uppercase tracking-wider mb-3 sticky top-0 bg-[#0F0F0F] py-2 z-10">{date}</h3>
            <div className="space-y-1">
              {items.map((activity) => {
                const company = activity.companyId ? getCompany(activity.companyId) : null;
                const agent = activity.agentId ? getAgent(activity.agentId) : null;
                const icon = ACTIVITY_TYPE_ICONS[activity.type] ?? "⚙️";

                return (
                  <div
                    key={activity._id}
                    className="flex items-start gap-3 px-4 py-3 rounded-lg hover:bg-[#1A1A1A] transition-colors group"
                  >
                    <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F5F5F5]">{activity.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {company && (
                          <span className="flex items-center gap-1 text-[10px] text-[#555]">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: company.color }} />
                            {company.name}
                          </span>
                        )}
                        {agent && (
                          <span className="text-[10px] text-[#555]">{agent.avatar} {agent.name}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-[#555] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {formatDateTime(activity.createdAt)}
                    </span>
                    <span className="text-[10px] text-[#555] flex-shrink-0">{timeAgo(activity.createdAt)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#555] text-sm">No activity found for the selected filters</p>
        </div>
      )}
    </div>
  );
}
