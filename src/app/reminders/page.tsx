"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

const PRIORITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: "CRIT", color: "text-red-400", bg: "bg-red-500/20" },
  high: { label: "HIGH", color: "text-orange-400", bg: "bg-orange-500/20" },
  medium: { label: "MED", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  low: { label: "LOW", color: "text-blue-400", bg: "bg-blue-500/20" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  pending: { label: "Pending", color: "text-amber-400", bg: "bg-amber-500/20", icon: "⏳" },
  triggered: { label: "Triggered", color: "text-red-400", bg: "bg-red-500/20", icon: "🔔" },
  snoozed: { label: "Snoozed", color: "text-blue-400", bg: "bg-blue-500/20", icon: "😴" },
  dismissed: { label: "Dismissed", color: "text-gray-400", bg: "bg-gray-500/20", icon: "✕" },
  completed: { label: "Completed", color: "text-green-400", bg: "bg-green-500/20", icon: "✓" },
};

const RECURRENCE_LABELS: Record<string, string> = {
  none: "One-time",
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
};

function timeUntil(dueAt: number): string {
  const diff = dueAt - Date.now();
  if (diff < 0) {
    const ago = Math.abs(diff);
    if (ago < 60000) return "just now";
    if (ago < 3600000) return `${Math.floor(ago / 60000)}m overdue`;
    if (ago < 86400000) return `${Math.floor(ago / 3600000)}h overdue`;
    return `${Math.floor(ago / 86400000)}d overdue`;
  }
  if (diff < 60000) return "< 1m";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  return `${Math.floor(diff / 86400000)}d ${Math.floor((diff % 86400000) / 3600000)}h`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function RemindersPage() {
  const reminders = useQuery(api.reminders.list) ?? [];
  const companies = useQuery(api.companies.list) ?? [];
  const agents = useQuery(api.agents.list) ?? [];
  const completeMutation = useMutation(api.reminders.complete);
  const snoozeMutation = useMutation(api.reminders.snooze);
  const dismissMutation = useMutation(api.reminders.dismiss);
  const triggerMutation = useMutation(api.reminders.trigger);
  const removeMutation = useMutation(api.reminders.remove);
  const createMutation = useMutation(api.reminders.create);

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDue, setNewDue] = useState("");
  const [newPriority, setNewPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [newRecurrence, setNewRecurrence] = useState<"none" | "daily" | "weekly" | "monthly">("none");
  const [newCompany, setNewCompany] = useState("");
  const [newAgent, setNewAgent] = useState("");

  // Filter reminders
  const filtered = reminders.filter((r) => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    if (filterPriority !== "all" && r.priority !== filterPriority) return false;
    return true;
  });

  // Stats
  const pending = reminders.filter((r) => r.status === "pending").length;
  const triggered = reminders.filter((r) => r.status === "triggered").length;
  const snoozed = reminders.filter((r) => r.status === "snoozed").length;
  const overdue = reminders.filter((r) => r.status === "pending" && r.dueAt <= Date.now()).length;
  const completedToday = reminders.filter(
    (r) => r.status === "completed" && r.completedAt && r.completedAt > Date.now() - 86400000
  ).length;

  const companyMap = Object.fromEntries(companies.map((c) => [c._id, c]));
  const agentMap = Object.fromEntries(agents.map((a) => [a._id, a]));

  async function handleCreate() {
    if (!newTitle || !newDue) return;
    const dueAt = new Date(newDue).getTime();
    if (isNaN(dueAt)) return;

    await createMutation({
      title: newTitle,
      description: newDesc || undefined,
      dueAt,
      priority: newPriority,
      recurrence: newRecurrence,
      createdBy: "dashboard",
      ...(newCompany ? { companyId: newCompany as Id<"companies"> } : {}),
      ...(newAgent ? { agentId: newAgent as Id<"agents"> } : {}),
    });

    setNewTitle("");
    setNewDesc("");
    setNewDue("");
    setNewPriority("medium");
    setNewRecurrence("none");
    setNewCompany("");
    setNewAgent("");
    setShowCreate(false);
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">⏰</span>
            Reminders
          </h1>
          <p className="text-sm text-[#A0A0A0] mt-1">
            Scheduled alerts and recurring tasks — {reminders.length} total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#E8A838] hover:bg-[#E8A838]/90 text-black font-semibold text-sm rounded-lg transition-all shadow-lg shadow-[#E8A838]/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          New Reminder
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Pending", value: pending, color: "text-amber-400", bg: "border-amber-500/30" },
          { label: "Triggered", value: triggered, color: "text-red-400", bg: "border-red-500/30" },
          { label: "Snoozed", value: snoozed, color: "text-blue-400", bg: "border-blue-500/30" },
          { label: "Overdue", value: overdue, color: "text-red-400", bg: "border-red-500/30" },
          { label: "Done Today", value: completedToday, color: "text-green-400", bg: "border-green-500/30" },
        ].map((s) => (
          <div key={s.label} className={`bg-[#1A1A1A] border ${s.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-[#A0A0A0] uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#555]">Status:</span>
          {["all", "pending", "triggered", "snoozed", "completed", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                filterStatus === s
                  ? "bg-[#E8A838]/20 text-[#E8A838] border border-[#E8A838]/30"
                  : "bg-[#1A1A1A] text-[#A0A0A0] border border-[#2A2A2A] hover:border-[#3A3A3A]"
              }`}
            >
              {s === "all" ? "All" : STATUS_CONFIG[s]?.label ?? s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#555]">Priority:</span>
          {["all", "critical", "high", "medium", "low"].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${
                filterPriority === p
                  ? "bg-[#E8A838]/20 text-[#E8A838] border border-[#E8A838]/30"
                  : "bg-[#1A1A1A] text-[#A0A0A0] border border-[#2A2A2A] hover:border-[#3A3A3A]"
              }`}
            >
              {p === "all" ? "All" : PRIORITY_CONFIG[p]?.label ?? p}
            </button>
          ))}
        </div>
      </div>

      {/* Reminders List */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-12 text-center">
            <p className="text-4xl mb-3">⏰</p>
            <p className="text-[#A0A0A0] text-sm">No reminders found</p>
            <p className="text-[#555] text-xs mt-1">
              Create one using the button above, or via API:
            </p>
            <code className="text-[10px] text-[#E8A838] mt-2 block">
              /api/reminders?action=create&token=...&title=Check+reports&due=+2h
            </code>
          </div>
        )}

        {filtered.map((reminder) => {
          const status = STATUS_CONFIG[reminder.status] ?? STATUS_CONFIG.pending;
          const priority = PRIORITY_CONFIG[reminder.priority] ?? PRIORITY_CONFIG.medium;
          const isOverdue = reminder.status === "pending" && reminder.dueAt <= Date.now();
          const company = reminder.companyId ? companyMap[reminder.companyId] : null;
          const agent = reminder.agentId ? agentMap[reminder.agentId] : null;

          return (
            <div
              key={reminder._id}
              className={`bg-[#1A1A1A] border rounded-xl p-4 transition-all hover:border-[#3A3A3A] ${
                isOverdue
                  ? "border-red-500/40 bg-red-500/5"
                  : reminder.status === "triggered"
                    ? "border-red-500/30 animate-pulse"
                    : "border-[#2A2A2A]"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status icon */}
                <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center text-lg flex-shrink-0`}>
                  {status.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{reminder.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${priority.bg} ${priority.color}`}>
                      {priority.label}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                      {status.label}
                    </span>
                    {reminder.recurrence && reminder.recurrence !== "none" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                        🔁 {RECURRENCE_LABELS[reminder.recurrence]}
                      </span>
                    )}
                    {isOverdue && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  {reminder.description && (
                    <p className="text-xs text-[#A0A0A0] mt-1">{reminder.description}</p>
                  )}

                  <div className="flex items-center gap-4 mt-2 text-[10px] text-[#555]">
                    <span>
                      Due: <span className={isOverdue ? "text-red-400" : "text-[#A0A0A0]"}>{formatDate(reminder.dueAt)}</span>
                    </span>
                    <span>
                      {isOverdue ? "Overdue by" : "In"}: <span className={isOverdue ? "text-red-400 font-semibold" : "text-[#A0A0A0]"}>{timeUntil(reminder.dueAt)}</span>
                    </span>
                    {company && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: company.color }} />
                        {company.name}
                      </span>
                    )}
                    {agent && (
                      <span>Agent: <span className="text-[#A0A0A0]">{agent.name}</span></span>
                    )}
                    <span>By: <span className="text-[#A0A0A0]">{reminder.createdBy}</span></span>
                    {reminder.tags && reminder.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        {reminder.tags.map((t) => (
                          <span key={t} className="bg-[#242424] px-1.5 py-0.5 rounded text-[#A0A0A0]">{t}</span>
                        ))}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {(reminder.status === "pending" || reminder.status === "triggered" || reminder.status === "snoozed") && (
                    <>
                      <button
                        onClick={() => completeMutation({ id: reminder._id })}
                        className="p-2 rounded-lg hover:bg-green-500/20 text-[#555] hover:text-green-400 transition-all"
                        title="Complete"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setSnoozeId(snoozeId === reminder._id ? null : reminder._id)}
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-[#555] hover:text-blue-400 transition-all"
                        title="Snooze"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      {reminder.status === "pending" && (
                        <button
                          onClick={() => triggerMutation({ id: reminder._id })}
                          className="p-2 rounded-lg hover:bg-amber-500/20 text-[#555] hover:text-amber-400 transition-all"
                          title="Trigger now"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => dismissMutation({ id: reminder._id })}
                        className="p-2 rounded-lg hover:bg-gray-500/20 text-[#555] hover:text-gray-400 transition-all"
                        title="Dismiss"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setDeleteConfirm(reminder._id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-[#555] hover:text-red-400 transition-all"
                    title="Delete permanently"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Snooze options */}
              {snoozeId === reminder._id && (
                <div className="mt-3 pt-3 border-t border-[#2A2A2A] flex items-center gap-2">
                  <span className="text-xs text-[#555]">Snooze for:</span>
                  {[
                    { label: "15m", minutes: 15 },
                    { label: "30m", minutes: 30 },
                    { label: "1h", minutes: 60 },
                    { label: "2h", minutes: 120 },
                    { label: "4h", minutes: 240 },
                    { label: "1d", minutes: 1440 },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={async () => {
                        await snoozeMutation({ id: reminder._id, minutes: opt.minutes });
                        setSnoozeId(null);
                      }}
                      className="px-3 py-1 rounded-lg bg-[#242424] text-xs text-[#A0A0A0] hover:bg-blue-500/20 hover:text-blue-400 transition-all"
                    >
                      {opt.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setSnoozeId(null)}
                    className="ml-auto text-xs text-[#555] hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Reminder Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="p-6 border-b border-[#2A2A2A] flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>⏰</span> New Reminder
              </h2>
              <button onClick={() => setShowCreate(false)} className="text-[#555] hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Review weekly KPIs"
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838]/50"
                />
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Optional details..."
                  rows={2}
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838]/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#A0A0A0] mb-1 block">Due Date/Time *</label>
                  <input
                    type="datetime-local"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50 [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#A0A0A0] mb-1 block">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#A0A0A0] mb-1 block">Recurrence</label>
                  <select
                    value={newRecurrence}
                    onChange={(e) => setNewRecurrence(e.target.value as any)}
                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                  >
                    <option value="none">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[#A0A0A0] mb-1 block">Company</label>
                  <select
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                  >
                    <option value="">All Companies</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Assign to Agent</label>
                <select
                  value={newAgent}
                  onChange={(e) => setNewAgent(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                >
                  <option value="">No agent</option>
                  {agents.map((a) => (
                    <option key={a._id} value={a._id}>{a.name} — {a.roleTitle ?? a.role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-[#2A2A2A] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-[#A0A0A0] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle || !newDue}
                className="px-6 py-2 bg-[#E8A838] hover:bg-[#E8A838]/90 text-black font-semibold text-sm rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#E8A838]/20"
              >
                Create Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-white font-semibold mb-2">Delete Reminder?</h3>
            <p className="text-sm text-[#A0A0A0] mb-4">
              This will permanently delete this reminder. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-[#A0A0A0] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await removeMutation({ id: deleteConfirm as Id<"reminders"> });
                  setDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg font-semibold transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
