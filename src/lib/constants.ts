export const TASK_STATUSES = [
  { value: "inbox", label: "Inbox", color: "bg-gray-500" },
  { value: "backlog", label: "Backlog", color: "bg-slate-500" },
  { value: "assigned", label: "Assigned", color: "bg-blue-500" },
  { value: "in_progress", label: "In Progress", color: "bg-purple-500" },
  { value: "in_review", label: "In Review", color: "bg-amber-500" },
  { value: "done", label: "Done", color: "bg-green-500" },
  { value: "blocked", label: "Blocked", color: "bg-red-500" },
  { value: "cancelled", label: "Cancelled", color: "bg-gray-400" },
] as const;

export const KANBAN_COLUMNS = TASK_STATUSES;

export const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: "🔴" },
  high: { label: "High", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "🟠" },
  medium: { label: "Medium", color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "🟡" },
  low: { label: "Low", color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30", icon: "⚪" },
} as const;

export const AGENT_STATUS_CONFIG = {
  online: { label: "Online", color: "bg-green-500", pulse: true },
  busy: { label: "Busy", color: "bg-yellow-500", pulse: false },
  idle: { label: "Standby", color: "bg-gray-400", pulse: false },
  offline: { label: "Offline", color: "bg-gray-600", pulse: false },
  error: { label: "Error", color: "bg-red-500", pulse: true },
} as const;

export const COMPANY_STATUS_CONFIG = {
  ideation: { label: "Ideation", color: "bg-purple-500/20 text-purple-400" },
  building: { label: "Building", color: "bg-blue-500/20 text-blue-400" },
  launched: { label: "Launched", color: "bg-green-500/20 text-green-400" },
  scaling: { label: "Scaling", color: "bg-amber-500/20 text-amber-400" },
  paused: { label: "Paused", color: "bg-gray-500/20 text-gray-400" },
  archived: { label: "Archived", color: "bg-gray-600/20 text-gray-500" },
} as const;

export const ACTIVITY_TYPE_ICONS: Record<string, string> = {
  task_created: "📝",
  task_updated: "🔄",
  task_completed: "✅",
  task_assigned: "👤",
  task_blocked: "🚫",
  agent_online: "🟢",
  agent_offline: "⚫",
  agent_error: "🔴",
  comment_added: "💬",
  mention: "📢",
  deliverable_uploaded: "📦",
  company_created: "🏢",
  milestone_reached: "🏆",
  heartbeat: "💓",
  system: "⚙️",
};
