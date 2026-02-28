"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import { ACTIVITY_TYPE_ICONS } from "@/lib/constants";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const { userId, logout } = useAuth();
  const user = useQuery(api.auth.getUser, userId ? { userId } : "skip");
  const notifications = useQuery(
    api.notifications.getByUser,
    userId ? { userId } : "skip"
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const searchResults = useQuery(
    api.search.globalSearch,
    searchQuery.length >= 2 ? { query: searchQuery } : "skip"
  );
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-14 border-b border-[#2A2A2A] bg-[#1A1A1A] flex items-center px-4 gap-4 flex-shrink-0">
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="lg:hidden text-[#A0A0A0] hover:text-white">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-xl">
        <button
          onClick={() => setSearchOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-sm text-[#555] hover:border-[#3A3A3A] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span>Search tasks, agents, docs...</span>
          <kbd className="ml-auto text-[10px] bg-[#242424] px-1.5 py-0.5 rounded text-[#555]">⌘K</kbd>
        </button>

        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#2A2A2A]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search everything..."
                className="w-full bg-transparent text-white placeholder-[#555] focus:outline-none text-sm"
                autoFocus
              />
            </div>
            {searchResults && (
              <div className="max-h-80 overflow-y-auto p-2">
                {searchResults.tasks.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-[#555] uppercase px-2 py-1">Tasks</p>
                    {searchResults.tasks.map((t) => (
                      <button
                        key={t._id}
                        onClick={() => { router.push("/kanban"); setSearchOpen(false); setSearchQuery(""); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#242424] text-sm text-[#A0A0A0] hover:text-white transition-colors"
                      >
                        📋 {t.title}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.agents.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-[#555] uppercase px-2 py-1">Agents</p>
                    {searchResults.agents.map((a) => (
                      <button
                        key={a._id}
                        onClick={() => { router.push("/agents"); setSearchOpen(false); setSearchQuery(""); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#242424] text-sm text-[#A0A0A0] hover:text-white transition-colors"
                      >
                        {a.avatar} {a.name} — {a.role}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.documents.length > 0 && (
                  <div className="mb-2">
                    <p className="text-[10px] text-[#555] uppercase px-2 py-1">Documents</p>
                    {searchResults.documents.map((d) => (
                      <button
                        key={d._id}
                        onClick={() => { router.push("/documents"); setSearchOpen(false); setSearchQuery(""); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#242424] text-sm text-[#A0A0A0] hover:text-white transition-colors"
                      >
                        📄 {d.title}
                      </button>
                    ))}
                  </div>
                )}
                {searchResults.tasks.length === 0 && searchResults.agents.length === 0 && searchResults.documents.length === 0 && searchQuery.length >= 2 && (
                  <p className="text-center text-[#555] text-sm py-6">No results found</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div ref={notifRef} className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative p-2 text-[#A0A0A0] hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden">
            <div className="p-3 border-b border-[#2A2A2A] flex items-center justify-between">
              <span className="text-sm font-medium text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{unreadCount} new</span>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications?.slice(0, 10).map((n) => (
                <div
                  key={n._id}
                  className={`px-4 py-3 border-b border-[#2A2A2A]/50 hover:bg-[#242424] transition-colors ${!n.read ? "bg-[#E8A838]/5" : ""}`}
                >
                  <p className="text-sm text-white">{n.title}</p>
                  <p className="text-xs text-[#A0A0A0] mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-[#555] mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              ))}
              {(!notifications || notifications.length === 0) && (
                <p className="text-center text-[#555] text-sm py-6">No notifications</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 text-[#A0A0A0] hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-[#E8A838]/20 flex items-center justify-center text-sm">
            👤
          </div>
          <span className="text-sm hidden sm:block">{user?.name ?? "User"}</span>
        </button>

        {userMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl z-50 overflow-hidden">
            <button
              onClick={() => { logout(); setUserMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-[#A0A0A0] hover:bg-[#242424] hover:text-white transition-colors"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
