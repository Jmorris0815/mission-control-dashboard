"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/providers/AuthProvider";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useMutation(api.auth.login);
  const { login: setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userId = await login({ username, password });
      setUser(userId);
    } catch {
      setError("Invalid credentials. Try admin / MissionControl2026!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚀</div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            MISSION CONTROL
          </h1>
          <p className="text-[#A0A0A0] mt-2 text-sm uppercase tracking-widest">
            Command Center v1.0
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838] transition-colors"
              placeholder="Enter username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white placeholder-[#555] focus:outline-none focus:border-[#E8A838] transition-colors"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#E8A838] hover:bg-[#D4962F] text-black font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Enter Command Center"}
          </button>

          <p className="text-center text-xs text-[#555]">
            Default: admin / MissionControl2026!
          </p>
        </form>
      </div>
    </div>
  );
}
