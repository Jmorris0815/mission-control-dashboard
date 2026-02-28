"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { LoginPage } from "@/components/auth/LoginPage";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CompanyFilterContext } from "@/hooks/useCompanyFilter";
import { Id } from "../../../convex/_generated/dataModel";

export function AppShell({ children }: { children: ReactNode }) {
  const { userId, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<Id<"companies"> | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🚀</div>
          <p className="text-[#A0A0A0] text-sm uppercase tracking-widest">Initializing Mission Control...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return <LoginPage />;
  }

  return (
    <CompanyFilterContext.Provider value={{ selectedCompanyId, setSelectedCompanyId }}>
      <div className="min-h-screen flex bg-[#0F0F0F]">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:block transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}>
          <Sidebar collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative w-64 z-50">
              <Sidebar collapsed={false} onToggle={() => setMobileSidebarOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
          <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </CompanyFilterContext.Provider>
  );
}
