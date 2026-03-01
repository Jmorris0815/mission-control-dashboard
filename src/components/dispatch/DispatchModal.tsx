"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface DispatchModalProps {
  open: boolean;
  onClose: () => void;
}

const PRIORITIES = [
  { value: "low", label: "Low", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { value: "medium", label: "Medium", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "high", label: "High", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { value: "critical", label: "Critical", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
] as const;

export function DispatchModal({ open, onClose }: DispatchModalProps) {
  const agents = useQuery(api.agents.list);
  const companies = useQuery(api.companies.list);
  const dispatch = useMutation(api.dispatch.dispatchTask);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const handleDispatch = async () => {
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    if (!selectedAgentId) {
      setError("Select an agent to dispatch to");
      return;
    }
    if (!selectedCompanyId) {
      setError("Select a company");
      return;
    }

    setIsDispatching(true);
    setError("");

    try {
      await dispatch({
        title: title.trim(),
        description: description.trim() || `Dispatched: ${title.trim()}`,
        priority,
        companyId: selectedCompanyId as Id<"companies">,
        agentId: selectedAgentId as Id<"agents">,
        tags: ["dispatched"],
      });
      setSuccess(true);
      setTimeout(() => {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setSelectedAgentId("");
        setSelectedCompanyId("");
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setIsDispatching(false);
    }
  };

  const selectedAgent = agents?.find((a) => a._id === selectedAgentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#2A2A2A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E8A838]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#E8A838]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Dispatch Task</h2>
              <p className="text-[10px] text-[#555] uppercase tracking-wider">Assign to agent</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#555] hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-lg font-bold text-green-400">Task Dispatched!</h3>
            <p className="text-sm text-[#A0A0A0] mt-1">
              &quot;{title}&quot; assigned to {selectedAgent?.name}
            </p>
          </div>
        ) : (
          <>
            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Agent Selection */}
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-2">
                  Dispatch To *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {agents?.map((agent) => (
                    <button
                      key={agent._id}
                      onClick={() => setSelectedAgentId(agent._id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        selectedAgentId === agent._id
                          ? "bg-[#E8A838]/10 border-[#E8A838]/30 text-white"
                          : "bg-[#0F0F0F] border-[#2A2A2A] text-[#A0A0A0] hover:border-[#3A3A3A] hover:text-white"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: agent.avatar || "#3b82f6" }}
                      >
                        {agent.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{agent.name}</p>
                        <p className="text-[10px] text-[#555] truncate">
                          {agent.roleTitle || agent.role}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-auto ${
                        agent.status === "online" ? "bg-green-500" :
                        agent.status === "busy" ? "bg-amber-500" :
                        agent.status === "idle" ? "bg-gray-500" :
                        agent.status === "error" ? "bg-red-500" : "bg-gray-700"
                      }`} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Selection */}
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-2">
                  Company *
                </label>
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#E8A838]/50"
                >
                  <option value="">Select company...</option>
                  {companies?.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838]/50"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional details, context, or instructions..."
                  rows={3}
                  className="w-full bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838]/50 resize-none"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-2">
                  Priority
                </label>
                <div className="flex gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setPriority(p.value)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        priority === p.value
                          ? `${p.bg} ${p.color}`
                          : "bg-[#0F0F0F] border-[#2A2A2A] text-[#555] hover:text-[#A0A0A0]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#2A2A2A] flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-[#A0A0A0] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDispatch}
                disabled={isDispatching || !title.trim() || !selectedAgentId || !selectedCompanyId}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#E8A838] hover:bg-[#E8A838]/90 disabled:bg-[#E8A838]/30 disabled:cursor-not-allowed text-black font-semibold text-sm rounded-lg transition-all"
              >
                {isDispatching ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Dispatching...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Dispatch
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
