"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Id } from "../../convex/_generated/dataModel";

interface AuthContextType {
  userId: Id<"users"> | null;
  login: (id: Id<"users">) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  userId: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("mc_user_id");
    if (stored) {
      setUserId(stored as Id<"users">);
    }
    setIsLoading(false);
  }, []);

  const login = (id: Id<"users">) => {
    localStorage.setItem("mc_user_id", id);
    setUserId(id);
  };

  const logout = () => {
    localStorage.removeItem("mc_user_id");
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ userId, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
