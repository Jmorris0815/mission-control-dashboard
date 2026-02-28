"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { timeAgo, formatDate } from "@/lib/utils";
import { Id } from "../../../convex/_generated/dataModel";

const DOC_TYPE_ICONS: Record<string, string> = {
  document: "📄",
  code: "💻",
  research: "🔬",
  report: "📊",
  template: "📋",
  other: "📎",
};

export default function DocumentsPage() {
  const documents = useQuery(api.documents.list);
  const companies = useQuery(api.companies.list);
  const agents = useQuery(api.agents.list);
  const { selectedCompanyId } = useCompanyFilter();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newType, setNewType] = useState<"document" | "code" | "research" | "report" | "template" | "other">("document");
  const [newCompany, setNewCompany] = useState("");
  const createDoc = useMutation(api.documents.create);

  if (!documents || !companies || !agents) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-3xl animate-pulse">📄</div>
      </div>
    );
  }

  const getCompany = (id: string) => companies.find((c) => c._id === id);
  const getAgent = (id: string) => agents.find((a) => a._id === id);

  let filtered = selectedCompanyId
    ? documents.filter((d) => d.companyId === selectedCompanyId)
    : documents;

  if (typeFilter !== "all") {
    filtered = filtered.filter((d) => d.type === typeFilter);
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newCompany) return;
    await createDoc({
      title: newTitle,
      content: newContent,
      type: newType,
      companyId: newCompany as Id<"companies">,
      tags: [],
    });
    setNewTitle("");
    setNewContent("");
    setShowNewForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Documents</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">{filtered.length} documents</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-[#E8A838] hover:bg-[#D4962F] text-black text-sm font-medium rounded-lg transition-colors"
        >
          + New Document
        </button>
      </div>

      {/* Type Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: "all", label: "All" },
          { value: "document", label: "Documents" },
          { value: "code", label: "Code" },
          { value: "research", label: "Research" },
          { value: "report", label: "Reports" },
          { value: "template", label: "Templates" },
        ].map((type) => (
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

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((doc) => {
          const company = getCompany(doc.companyId);
          const agent = doc.createdByAgentId ? getAgent(doc.createdByAgentId) : null;
          return (
            <div
              key={doc._id}
              onClick={() => setSelectedDoc(doc)}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 hover:border-[#3A3A3A] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{DOC_TYPE_ICONS[doc.type] ?? "📎"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#242424] text-[#555] uppercase">{doc.type}</span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{doc.title}</h3>
              {doc.content && (
                <p className="text-xs text-[#A0A0A0] line-clamp-3 mb-3">{doc.content.substring(0, 150)}...</p>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {company && (
                    <span className="flex items-center gap-1 text-[10px] text-[#555]">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: company.color }} />
                      {company.name}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-[#555]">{timeAgo(doc.updatedAt)}</span>
              </div>
              {agent && (
                <p className="text-[10px] text-[#555] mt-2">Created by {agent.avatar} {agent.name}</p>
              )}
              {doc.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {doc.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#242424] text-[#555]">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-[#555] text-sm">No documents found</p>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setSelectedDoc(null)} />
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <button onClick={() => setSelectedDoc(null)} className="absolute top-4 right-4 text-[#555] hover:text-white text-xl">&times;</button>
            {(() => {
              const company = getCompany(selectedDoc.companyId);
              const agent = selectedDoc.createdByAgentId ? getAgent(selectedDoc.createdByAgentId) : null;
              return (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">{DOC_TYPE_ICONS[selectedDoc.type] ?? "📎"}</span>
                    {company && (
                      <span className="flex items-center gap-1 text-xs text-[#A0A0A0]">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: company.color }} />
                        {company.name}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{selectedDoc.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-[#555] mb-6">
                    {agent && <span>Created by {agent.avatar} {agent.name}</span>}
                    <span>Updated {timeAgo(selectedDoc.updatedAt)}</span>
                  </div>
                  {selectedDoc.content && (
                    <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
                      <pre className="text-sm text-[#A0A0A0] whitespace-pre-wrap font-sans leading-relaxed">{selectedDoc.content}</pre>
                    </div>
                  )}
                  {selectedDoc.tags.length > 0 && (
                    <div className="flex gap-1 mt-4">
                      {selectedDoc.tags.map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-1 rounded-full bg-[#242424] text-[#A0A0A0]">{tag}</span>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* New Document Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70" onClick={() => setShowNewForm(false)} />
          <div className="relative bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-white mb-4">New Document</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Title</label>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]" autoFocus />
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Type</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value as any)} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]">
                  <option value="document">Document</option>
                  <option value="code">Code</option>
                  <option value="research">Research</option>
                  <option value="report">Report</option>
                  <option value="template">Template</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Company</label>
                <select value={newCompany} onChange={(e) => setNewCompany(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838]">
                  <option value="">Select company...</option>
                  {companies.map((c) => (<option key={c._id} value={c._id}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#A0A0A0] mb-1 block">Content</label>
                <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-white focus:outline-none focus:border-[#E8A838] h-32 resize-none" />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowNewForm(false)} className="flex-1 py-2 border border-[#2A2A2A] text-[#A0A0A0] text-sm rounded-lg hover:bg-[#242424]">Cancel</button>
                <button onClick={handleCreate} className="flex-1 py-2 bg-[#E8A838] hover:bg-[#D4962F] text-black text-sm font-medium rounded-lg">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
