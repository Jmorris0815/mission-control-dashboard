"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useCompanyFilter } from "@/hooks/useCompanyFilter";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/kanban", label: "Kanban Board", icon: "📋" },
  { href: "/agents", label: "Agent Roster", icon: "🤖" },
  { href: "/activity", label: "Activity Feed", icon: "⚡" },
  { href: "/missions", label: "Missions", icon: "🎯" },
  { href: "/documents", label: "Documents", icon: "📄" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const companies = useQuery(api.companies.list);
  const { selectedCompanyId, setSelectedCompanyId } = useCompanyFilter();

  return (
    <div className="h-screen flex flex-col bg-[#1A1A1A] border-r border-[#2A2A2A]">
      {/* Logo */}
      <div className="p-4 border-b border-[#2A2A2A] flex items-center gap-3">
        <span className="text-2xl">🚀</span>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">MISSION CONTROL</h1>
            <p className="text-[10px] text-[#A0A0A0] uppercase tracking-widest">Command Center</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-[#A0A0A0] hover:text-white transition-colors hidden lg:block"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-[#E8A838]/10 text-[#E8A838] border border-[#E8A838]/20"
                  : "text-[#A0A0A0] hover:bg-[#242424] hover:text-white"
              )}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Company Filter */}
      {!collapsed && (
        <div className="border-t border-[#2A2A2A] p-4">
          <p className="text-[10px] text-[#A0A0A0] uppercase tracking-widest mb-3">Companies</p>
          <button
            onClick={() => setSelectedCompanyId(null)}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-xs transition-all mb-1",
              !selectedCompanyId
                ? "bg-[#242424] text-white"
                : "text-[#A0A0A0] hover:bg-[#242424] hover:text-white"
            )}
          >
            All Companies
          </button>
          {companies?.map((company) => (
            <button
              key={company._id}
              onClick={() => setSelectedCompanyId(company._id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center gap-2",
                selectedCompanyId === company._id
                  ? "bg-[#242424] text-white"
                  : "text-[#A0A0A0] hover:bg-[#242424] hover:text-white"
              )}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: company.color }}
              />
              <span className="truncate">{company.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
