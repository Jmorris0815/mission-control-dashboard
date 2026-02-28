"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { timeAgo, formatDate } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

export default function MissionsPage() {
  const missions = useQuery(api.missions.list);
  const companies = useQuery(api.companies.list);
  const tasks = useQuery(api.tasks.list);
  const { selectedCompanyId } = useCompanyFilter();
  const [selectedMission, setSelectedMission] = useState<any>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const createMission = useMutation(api.missions.create);

  if (!missions || !companies || !tasks) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-3xl animate-pulse">🎯</div>
      </div>
    );
  }

  const getCompany = (id: string) => companies.find((c) => c._id === id);

  const filtered = selectedCompanyId
    ? missions.filter((m) => m.companyId === selectedCompanyId)
    : missions;

  const activeMissions = filtered.filter((m) => m.status === "active");
  const completedMissions = filtered.filter((m) => m.status === "completed");
  const pausedMissions = filtered.filter((m) => m.status === "paused");

  const handleCreate = async () => {
    if (!newTitle.trim() || !newCompany) return;
    await createMission({
      title: newTitle,
      description: newDesc || "No description",
      companyId: newCompany as Id<"companies">,
      status: "active",
      linkedTaskIds: [],
    });
    setNewTitle("");
    setNewDesc("");
    setShowNewForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Missions</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">
            {activeMissions.length} active · {completedMissions.length} completed · {pausedMissions.length} paused
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-[#E8A838] hover:bg-[#D4962F] text-black text-sm font-medium rounded-lg transition-colors"
        >
          + New Mission
        </button>
      </div>

      {/* Active Missions */}
      {activeMissions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Active Missions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMissions.map((mission) => {
              const company = getCompany(mission.companyId);
              const linkedTasks = mission.linkedTaskIds.map((id) => tasks.find((t) => t._id === id)).filter(Boolean);
              const doneTasks = linkedTasks.filter((t: any) => t.status === "done").length;
              return (
                <div
                  key={mission._id}
                  onClick={() => setSelectedMission(mission)}
                  className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: company?.color ?? "#555" }} />
                    <span className="text-xs text-[#A0A0A0]">{company?.name}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">{mission.title}</h3>
                  <p className="text-xs text-[#A0A0A0] line-clamp-2 mb-4">{mission.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-2.5 bg-[#242424] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${mission.progress}%`, backgroundColor: company?.color ?? "#E8A838" }}
                      />
                    </div>
                    <span className="text-sm font-mono font-bold text-white">{mission.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#555]">
                    <span>{linkedTasks.length} tasks ({doneTasks} done)</span>
                    {mission.dueDate && <span>Due {formatDate(mission.dueDate)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Missions */}
      {completedMissions.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Completed Missions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedMissions.map((mission) => {
              const company = getCompany(mission.companyId);
              return (
                <div key={mission._id} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 opacity-70">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: company?.color ?? "#555" }} />
                    <span className="text-xs text-[#A0A0A0]">{company?.name}</span>
                    <span className="ml-auto text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">{mission.title}</h3>
                  <p className="text-xs text-[#555]">{mission.linkedTaskIds.length} tasks</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-[#555] text-sm">No missions yet. Create your first mission to track progress.</p>
        </div>
      )}

      {/* Mission Detail Modal */}
      {selectedMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSelectedMission(null)} />
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
            <button onClick={() => setSelectedMission(null)} className="absolute top-4 right-4 text-[#555] hover:text-white text-xl">&times;</button>
            {(() => {
              const company = getCompany(selectedMission.companyId);
              const linkedTasks = selectedMission.linkedTaskIds.map((id: string) => tasks.find((t) => t._id === id)).filter(Boolean);
              return (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: company?.color ?? "#555" }} />
                    <span className="text-xs text-[#A0A0A0]">{company?.name}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{selectedMission.title}</h2>
                  <p className="text-sm text-[#A0A0A0] mb-4">{selectedMission.description}</p>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="flex-1 h-3 bg-[#242424] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${selectedMission.progress}%`, backgroundColor: company?.color ?? "#E8A838" }} />
                    </div>
                    <span className="text-lg font-mono font-bold text-white">{selectedMission.progress}%</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-3">Linked Tasks ({linkedTasks.length})</h3>
                  <div className="space-y-2">
                    {linkedTasks.map((task: any) => (
                      <div key={task._id} className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3 flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${task.status === "done" ? "bg-green-500" : task.status === "blocked" ? "bg-red-500" : task.status === "in_progress" ? "bg-purple-500" : "bg-gray-500"}`} />
                        <span className="text-sm text-[#A0A0A0] flex-1">{task.title}</span>
                        <span className="text-[10px] text-[#555]">{task.status.replace("_", " ")}</span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* New Mission Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowNewForm(false)} />
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Mission</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Title</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]" autoFocus />
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Description</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838] h-20 resize-none" />
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Company</label>
                <select value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]">
                  <option value="">Select company...</option>
                  {companies.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNewForm(false)} className="flex-1 py-2 border border-[#2A2A2A] text-[#A0A0A0] text-sm rounded-lg hover:bg-[#242424]">Cancel</button>
                <button onClick={handleCreate} className="flex-1 py-2 bg-[#E8A838] hover:bg-[#D4962F] text-black text-sm font-medium rounded-lg">Create Mission</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
