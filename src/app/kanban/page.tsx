"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { KANBAN_COLUMNS, PRIORITY_CONFIG } from "@/lib/constants";
import { timeAgo, cn } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ── Trash icon (inline SVG, no extra deps) ────────────────────────────────────
function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

// ── Confirmation Dialog ───────────────────────────────────────────────────────
function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80" onClick={onCancel} />
      <div className="relative bg-[#1A1A1A] border border-[#3A3A3A] rounded-xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
            <TrashIcon className="w-4 h-4 text-red-400" />
          </div>
          <h3 className="text-base font-semibold text-white">{title}</h3>
        </div>
        <p className="text-sm text-[#A0A0A0] mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-[#2A2A2A] text-[#A0A0A0] text-sm rounded-lg hover:bg-[#242424] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({
  task,
  companies,
  agents,
  onClick,
  onDelete,
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const company = companies?.find((c: any) => c._id === task.companyId);
  const agent = task.assignedAgentId
    ? agents?.find((a: any) => a._id === task.assignedAgentId)
    : null;
  const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // prevent opening the modal
    onDelete(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-[#3A3A3A] transition-colors group"
    >
      {/* Hover trash icon — top-right corner */}
      <button
        onClick={handleDeleteClick}
        title="Delete task"
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-[#555] hover:text-red-400 transition-all z-10"
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-2 mb-2">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: company?.color ?? "#555" }}
        />
        <span className="text-[10px] text-[#555] truncate">{company?.name}</span>
        <span
          className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${priorityCfg.bg} ${priorityCfg.color}`}
        >
          {priorityCfg.label}
        </span>
      </div>
      <p className="text-sm text-white mb-2 line-clamp-2 pr-5">{task.title}</p>
      <div className="flex items-center justify-between">
        {agent ? (
          <span className="text-[10px] text-[#A0A0A0] flex items-center gap-1">
            {agent.avatar} {agent.name}
          </span>
        ) : (
          <span className="text-[10px] text-[#555]">Unassigned</span>
        )}
        {task.tags?.length > 0 && (
          <span className="text-[10px] text-[#555]">{task.tags[0]}</span>
        )}
      </div>
    </div>
  );
}

// ── Task Detail Modal ─────────────────────────────────────────────────────────
function TaskDetailModal({
  task,
  companies,
  agents,
  onClose,
  onDelete,
}: any) {
  const comments = useQuery(api.comments.getByTask, { taskId: task._id });
  const createComment = useMutation(api.comments.create);
  const [newComment, setNewComment] = useState("");
  const company = companies?.find((c: any) => c._id === task.companyId);
  const agent = task.assignedAgentId
    ? agents?.find((a: any) => a._id === task.assignedAgentId)
    : null;
  const priorityCfg = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG];

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await createComment({
      taskId: task._id,
      content: newComment,
      type: "comment",
      mentions: [],
    });
    setNewComment("");
  };

  const topLevelComments = comments?.filter((c) => !c.parentCommentId) ?? [];
  const getReplies = (parentId: string) =>
    comments?.filter((c) => c.parentCommentId === parentId) ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#2A2A2A]">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: company?.color ?? "#555" }}
            />
            <span className="text-xs text-[#A0A0A0]">{company?.name}</span>
            <span
              className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${priorityCfg.bg} ${priorityCfg.color}`}
            >
              {priorityCfg.label}
            </span>
            {/* Delete button in modal header */}
            <button
              onClick={() => onDelete(task)}
              title="Delete task"
              className="ml-auto mr-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#555] hover:text-red-400 hover:bg-red-500/10 transition-all text-xs"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
            <button onClick={onClose} className="text-[#555] hover:text-white text-xl leading-none">
              &times;
            </button>
          </div>
          <h2 className="text-lg font-semibold text-white">{task.title}</h2>
          <p className="text-sm text-[#A0A0A0] mt-2">{task.description}</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-[#555]">
            {agent && (
              <span>
                {agent.avatar} {agent.name}
              </span>
            )}
            <span>Created {timeAgo(task.createdAt)}</span>
            {task.dueDate && <span>Due {timeAgo(task.dueDate)}</span>}
          </div>
          {task.tags?.length > 0 && (
            <div className="flex gap-1 mt-3 flex-wrap">
              {task.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] text-[#A0A0A0]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Comments ({comments?.length ?? 0})
          </h3>
          {topLevelComments.map((comment) => {
            const author = comment.authorAgentId
              ? agents?.find((a: any) => a._id === comment.authorAgentId)
              : null;
            const replies = getReplies(comment._id);
            return (
              <div key={comment._id} className="space-y-2">
                <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{author?.avatar ?? "👤"}</span>
                    <span className="text-xs font-medium text-white">
                      {author?.name ?? "User"}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        comment.type === "blocker"
                          ? "bg-red-500/10 text-red-400"
                          : comment.type === "deliverable"
                            ? "bg-green-500/10 text-green-400"
                            : comment.type === "status_update"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-[#242424] text-[#555]"
                      }`}
                    >
                      {comment.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[#555] ml-auto">
                      {timeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
                {replies.map((reply) => {
                  const replyAuthor = reply.authorAgentId
                    ? agents?.find((a: any) => a._id === reply.authorAgentId)
                    : null;
                  return (
                    <div
                      key={reply._id}
                      className="ml-6 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{replyAuthor?.avatar ?? "👤"}</span>
                        <span className="text-xs font-medium text-white">
                          {replyAuthor?.name ?? "User"}
                        </span>
                        <span className="text-[10px] text-[#555] ml-auto">
                          {timeAgo(reply.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-[#A0A0A0] whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {topLevelComments.length === 0 && (
            <p className="text-xs text-[#555] text-center py-4">No comments yet.</p>
          )}
        </div>

        {/* Add Comment */}
        <div className="p-4 border-t border-[#2A2A2A]">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838]"
            />
            <button
              onClick={handleAddComment}
              className="px-4 py-2 bg-[#E8A838] hover:bg-[#D4962F] text-black text-sm font-medium rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Kanban Page ──────────────────────────────────────────────────────────
export default function KanbanPage() {
  const companies = useQuery(api.companies.list);
  const tasks = useQuery(api.tasks.list);
  const agents = useQuery(api.agents.list);
  const updateTask = useMutation(api.tasks.update);
  const removeTask = useMutation(api.tasks.remove);
  const createTask = useMutation(api.tasks.create);
  const { selectedCompanyId } = useCompanyFilter();

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null); // task pending confirmation
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<
    "low" | "medium" | "high" | "critical"
  >("medium");
  const [newTaskCompany, setNewTaskCompany] = useState<string>("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    return selectedCompanyId
      ? tasks.filter((t) => t.companyId === selectedCompanyId)
      : tasks;
  }, [tasks, selectedCompanyId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const overId = over.id as string;
    const activeTask = filteredTasks.find((t) => t._id === active.id);
    if (!activeTask) return;

    const targetColumn = KANBAN_COLUMNS.find((c) => c.value === overId);
    if (targetColumn) {
      if (activeTask.status !== targetColumn.value) {
        updateTask({
          id: activeTask._id as Id<"tasks">,
          status: targetColumn.value as any,
        });
      }
      return;
    }

    const overTask = filteredTasks.find((t) => t._id === overId);
    if (overTask && activeTask.status !== overTask.status) {
      updateTask({
        id: activeTask._id as Id<"tasks">,
        status: overTask.status as any,
      });
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskCompany) return;
    await createTask({
      title: newTaskTitle,
      description: newTaskDesc || "No description",
      status: "inbox",
      priority: newTaskPriority,
      companyId: newTaskCompany as Id<"companies">,
      tags: [],
    });
    setNewTaskTitle("");
    setNewTaskDesc("");
    setShowNewTaskForm(false);
  };

  // Called from both the card hover icon and the modal delete button
  const handleDeleteRequest = (task: any) => {
    setSelectedTask(null); // close modal if open
    setTaskToDelete(task);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    await removeTask({ id: taskToDelete._id as Id<"tasks"> });
    setTaskToDelete(null);
  };

  const handleDeleteCancel = () => {
    setTaskToDelete(null);
  };

  const activeTask = activeId ? filteredTasks.find((t) => t._id === activeId) : null;

  if (!companies || !tasks || !agents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#555] text-sm animate-pulse">Loading Kanban board...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Kanban Board</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">
            {filteredTasks.length} tasks across {KANBAN_COLUMNS.length} columns
          </p>
        </div>
        <button
          onClick={() => setShowNewTaskForm(true)}
          className="px-4 py-2 bg-[#E8A838] hover:bg-[#D4962F] text-black text-sm font-medium rounded-lg transition-colors"
        >
          + New Task
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {KANBAN_COLUMNS.map((column) => {
              const columnTasks = filteredTasks.filter((t) => t.status === column.value);
              return (
                <div key={column.value} className="w-72 flex-shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`w-2 h-2 rounded-full ${column.color}`} />
                    <span className="text-xs font-medium text-white uppercase tracking-wider">
                      {column.label}
                    </span>
                    <span className="text-[10px] text-[#555] bg-[#242424] px-1.5 py-0.5 rounded-full ml-auto">
                      {columnTasks.length}
                    </span>
                  </div>
                  <SortableContext
                    id={column.value}
                    items={columnTasks.map((t) => t._id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div
                      className="space-y-2 min-h-[200px] bg-[#0F0F0F]/50 rounded-xl p-2 border border-[#2A2A2A]/50"
                      data-column={column.value}
                    >
                      {columnTasks.map((task) => (
                        <TaskCard
                          key={task._id}
                          task={task}
                          companies={companies}
                          agents={agents}
                          onClick={setSelectedTask}
                          onDelete={handleDeleteRequest}
                        />
                      ))}
                      {columnTasks.length === 0 && (
                        <div className="flex items-center justify-center h-24 text-[#555] text-xs">
                          Drop tasks here
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-[#1A1A1A] border border-[#E8A838]/50 rounded-lg p-3 shadow-2xl w-72 opacity-90">
              <p className="text-sm text-white">{activeTask.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          companies={companies}
          agents={agents}
          onClose={() => setSelectedTask(null)}
          onDelete={handleDeleteRequest}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {taskToDelete && (
        <ConfirmDialog
          title="Delete Task"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}

      {/* New Task Modal */}
      {showNewTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setShowNewTaskForm(false)}
          />
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Task</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Title</label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Description</label>
                <textarea
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838] h-20 resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Company</label>
                <select
                  value={newTaskCompany}
                  onChange={(e) => setNewTaskCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]"
                >
                  <option value="">Select company...</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Priority</label>
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="flex-1 py-2 border border-[#2A2A2A] text-[#A0A0A0] text-sm rounded-lg hover:bg-[#242424] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  className="flex-1 py-2 bg-[#E8A838] hover:bg-[#D4962F] text-black text-sm font-medium rounded-lg transition-colors"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
